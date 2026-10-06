// lib/nexus/guarded-narrate.js
//
// The number guard every Nexus brief runs through. The model sees only
// `facts`: figures the engines already computed, pre-formatted, so it never
// needs to convert or calculate. Every complete number the model streams is
// checked against the numbers present in those facts; anything else aborts the
// stream and the deterministic template is shown instead.
import { callClaudeStream } from '../claude-api.js';

const NUMBER = /\d[\d,]*(?:\.\d+)?/g;
const toNum = (s) => Number(s.replace(/,/g, ''));

/** Shared rules appended to every narration system prompt. */
export const NUMBER_RULES = `Use only the numbers present in the provided facts. Never calculate, estimate, infer or invent a figure. If a number is not in the facts, do not mention it.
Do not add, subtract, multiply or otherwise combine figures — any total or difference worth stating is already in the facts.
Do not state percentages, shares, ratios, time periods or deadlines unless that exact figure is in the facts.
Keep every figure attached to the item it belongs to: never apply one item's cost, date or count to another item or to several items together.
Never mention how this text was produced, and never name any software, model or assistant.`;

export function allowedNumbers(facts) {
  const set = new Set();
  const walk = (v) => {
    if (v == null) return;
    if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === 'object') Object.values(v).forEach(walk);
    else for (const m of String(v).match(NUMBER) ?? []) set.add(toNum(m));
  };
  walk(facts);
  return set;
}

/**
 * Returns the longest prefix of `text` that is safe to display: every
 * completed number in it is in `allowed`. A number still being streamed at
 * the end is held back. `violation` is set if a disallowed number appears.
 */
export function safePrefix(text, allowed, complete = false) {
  NUMBER.lastIndex = 0;
  let m;
  while ((m = NUMBER.exec(text)) !== null) {
    const end = m.index + m[0].length;
    const atEnd = end >= text.length || (/[.,]/.test(text[end]) && end + 1 >= text.length);
    if (atEnd && !complete) return { text: text.slice(0, m.index), violation: false };
    if (!allowed.has(toNum(m[0]))) return { text: text.slice(0, m.index), violation: true, offending: m[0] };
  }
  return { text, violation: false };
}

/**
 * Streams a brief through the guard. onText(displayText) is called as
 * verified text arrives. Resolves to { text, source: 'llm' | 'template' }.
 * `offline` skips the network and returns the template immediately.
 *
 * @param {{ systemPrompt: string, facts: object, template: string, instruction?: string,
 *           maxTokens?: number, onText?: (t: string) => void, offline?: boolean,
 *           signal?: AbortSignal, label?: string }} opts
 */
export async function guardedNarrate({
  systemPrompt, facts, template, instruction = 'Write the paragraph.', factsLabel = 'Facts', maxTokens = 320,
  onText = () => {}, offline = false, signal, label = 'narrator',
}) {
  if (offline) {
    onText(template);
    return { text: template, source: 'template' };
  }
  const allowed = allowedNumbers(facts);
  let raw = '';
  try {
    const prompt = `${factsLabel} (every figure is final):\n${JSON.stringify(facts, null, 2)}\n\n${instruction}`;
    for await (const chunk of callClaudeStream({ prompt, systemOverride: systemPrompt, maxTokens })) {
      if (signal?.aborted) return { text: '', source: 'aborted' };
      raw += chunk;
      const safe = safePrefix(raw, allowed);
      if (safe.violation) {
        console.warn(`[${label}] rejected unsupported figure "${safe.offending}" — showing template`, { raw });
        onText(template);
        return { text: template, source: 'template', rejected: safe.offending };
      }
      onText(safe.text);
    }
    const final = safePrefix(raw.trim(), allowed, true);
    if (final.violation || !final.text) {
      onText(template);
      return { text: template, source: 'template', rejected: final.offending };
    }
    onText(final.text);
    return { text: final.text, source: 'llm' };
  } catch (err) {
    console.warn(`[${label}] stream failed — showing template`, err?.message);
    onText(template);
    return { text: template, source: 'template' };
  }
}
