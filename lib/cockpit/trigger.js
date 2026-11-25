// lib/cockpit/trigger.js — decides whether a Guide prompt opens a presentation cockpit.
//
// Each cockpit brings its own matcher. A cockpit whose trigger defines
// score(text) is scored by it (0..1, with its own fires decision). Otherwise
// the original rule applies, unchanged and forgiving on purpose: one required
// term, at least one strong term and two or more supporting terms, matched as
// whole words on lowercased, punctuation-free text. That rule scores 1 when it
// passes and 0 when it does not.
//
// Precedence: of the cockpits that fire, the highest score wins. A tie at the
// top falls through to the Guide's normal response rather than picking one.
import { COCKPITS } from '../../data/cockpit/index.js';

export const MIN_SUPPORTING = 2;

export const normalise = (text) => ` ${String(text ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;

const has = (norm, term) => norm.includes(` ${normalise(term).trim()} `);

function termCount(t, text) {
  const norm = normalise(text);
  const required = t.required.filter((term) => has(norm, term));
  const strong = t.strong.filter((term) => has(norm, term));
  const supporting = [...new Set(t.supporting.filter((term) => has(norm, term)))];
  const fires = required.length > 0 && strong.length > 0 && supporting.length >= MIN_SUPPORTING;
  return {
    score: fires ? 1 : 0, fires, threshold: 1,
    groups: { required: { matched: required }, strong: { matched: strong }, supporting: { matched: supporting } },
  };
}

/** One cockpit's verdict on a prompt. */
export function scoreCockpit(text, cockpit) {
  const t = cockpit.trigger;
  return typeof t.score === 'function' ? t.score(text) : termCount(t, text);
}

/** Every cockpit's verdict, highest score first. Feeds the dev matcher panel. */
export function explainMatch(text, cockpits = COCKPITS) {
  return Object.entries(cockpits)
    .map(([slug, c]) => ({ slug, ...scoreCockpit(text, c) }))
    .sort((a, b) => b.score - a.score);
}

/** The matching cockpit's slug, or null (nothing fires, or a tie at the top). */
export function matchCockpit(text, cockpits = COCKPITS) {
  const hits = explainMatch(text, cockpits).filter((h) => h.fires);
  if (hits.length === 0) return null;
  if (hits.length > 1 && hits[0].score === hits[1].score) return null;
  return hits[0].slug;
}

/** "/cockpit" on its own: go straight to the default cockpit, no animation. */
export const isCockpitShortcut = (text) => String(text ?? '').trim().toLowerCase() === '/cockpit';
