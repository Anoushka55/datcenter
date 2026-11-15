// LLM prioritization layer — Part 3 of the dynamic decision-engine spec.
//
// The LLM's ONLY job: reason about THIS specific query (location, capacity,
// intent) and decide which of the available modules actually matter for it,
// then explain why. It never computes a score, ranking, or financial figure —
// those are already computed and handed in as read-only context. It must not
// fall back to decision_type defaults, and it must not select everything.

import { callClaudeServer } from '@/lib/anthropicServer';
import { MODULE_REGISTRY, MODULE_LABELS, applyHardConstraints, defaultSelection } from '@/data/decisionModules';

export const PRIORITIZATION_PROMPT_TEMPLATE = `You are the EAiQ Decision Prioritization Layer.

You are NOT a chatbot and you do NOT compute anything. Scores, rankings, and
financial figures below are already calculated by a deterministic engine —
treat them as read-only facts. Your only job is to REASON about this specific
query and decide which modules actually matter for it.

AVAILABLE MODULES for this decision_type (you may ONLY use these exact keys —
never invent a new one, and do NOT just select every module on this list):
{{module_list}}

THIS QUERY:
decision_type: {{decision_type}}
mode: {{mode}}
client_name: {{client_name}}
location: {{location}}
capacity_mw: {{capacity}}

COMPUTED CONTEXT (already calculated — reason from it, do not recompute it):
{{computed_summary}}

THINK ABOUT (this is reasoning guidance, not a template to copy):
- Does the location's computed risk profile (coastal/flood) change what matters here?
- Does the capacity make grid/power the binding constraint, or is it small enough that
  power is a non-issue and something else (cost, connectivity, feasibility) matters more?
- What is this query's actual intent — is it about site selection, financial viability,
  technical readiness, or risk? Weight modules toward that intent.
- Pick 3-5 modules that are genuinely the most decision-relevant for THIS case — not a
  generic "one of each" or "everything available."

HARD GUARDRAILS (enforced in code regardless of your answer — respect them anyway):
- "final_recommendation" must always be included.
- Select a minimum of 3 and a maximum of 5 modules total.
- If capacity_mw >= 50, strongly prioritize "power_analysis" (if available).
- If the location is coastal or flood-prone, strongly prioritize "risk_analysis" (if available).

Respond with ONLY raw JSON, no markdown fences, no commentary, in EXACTLY this shape.
Each reasoning field must be a short, specific string grounded in the actual numbers
above — never generic. Use a leading "- " for each bullet line if a field needs more
than one point (most need only one short sentence):
{
  "selected_modules": ["final_recommendation", "..."],
  "priority_order": ["final_recommendation", "..."],
  "reasoning": {
    "<module_key>": {
      "summary": "one short clause — why this was selected for THIS query",
      "why_it_matters": "1-2 sentences on why this dimension matters for this decision",
      "why_this_value": "1-2 sentences referencing the ACTUAL computed number/flag for this module",
      "decision_impact": "1-2 sentences on how this module's result shapes the final recommendation"
    }
  }
}`;

function buildComputedSummary(computedData) {
  return Object.entries(computedData)
    .map(([key, val]) => {
      const bits = [];
      if (typeof val.score === 'number') bits.push(`score=${val.score}`);
      if (val.verdict) bits.push(`verdict=${val.verdict}`);
      if (val.coastal !== undefined) bits.push(`coastal=${val.coastal}`);
      if (val.flood_zone) bits.push(`flood_zone=${val.flood_zone}`);
      if (val.grid_capacity_mw) bits.push(`grid_capacity_mw=${val.grid_capacity_mw}`);
      if (val.capex_usd_m) bits.push(`capex_usd_m=${val.capex_usd_m}`);
      if (val.ranked) bits.push(`top=${val.ranked[0]?.name} (score=${val.ranked[0]?.score})`);
      if (val.chip_label) bits.push(`chip=${val.chip_label}`, `cooling=${val.cooling_label}`, `cooling_mismatch=${val.cooling_mismatch}`, `envelope_utilization_pct=${val.envelope_utilization?.utilization_pct}`);
      return `- ${key}: ${bits.join(', ') || 'computed'}`;
    })
    .join('\n');
}

function buildPrompt(decisionType, params, computedData) {
  const registry = MODULE_REGISTRY[decisionType] || [];
  const moduleList = registry.map(m => `- ${m}: ${MODULE_LABELS[m]}`).join('\n');
  return PRIORITIZATION_PROMPT_TEMPLATE
    .replace('{{module_list}}', moduleList)
    .replace('{{decision_type}}', decisionType)
    .replace('{{mode}}', params.mode || 'exploratory')
    .replace('{{client_name}}', params.clientName || '(none — exploratory)')
    .replace('{{location}}', params.location)
    .replace('{{capacity}}', String(params.capacity))
    .replace('{{computed_summary}}', buildComputedSummary(computedData));
}

function parseLLMJson(raw) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in LLM response.');
  return JSON.parse(match[0]);
}

/**
 * Normalizes whatever shape the LLM (or the deterministic fallback) produced
 * for a single module's reasoning into the 4-field structured object the
 * ExplanationPanel expects. Never leaves a field blank.
 */
function normalizeReasoning(raw, fallbackBuilder) {
  const fallback = fallbackBuilder();
  if (!raw) return fallback;
  if (typeof raw === 'string') return { ...fallback, summary: raw };
  return {
    summary: raw.summary || fallback.summary,
    why_it_matters: raw.why_it_matters || fallback.why_it_matters,
    why_this_value: raw.why_this_value || fallback.why_this_value,
    decision_impact: raw.decision_impact || fallback.decision_impact,
  };
}

/**
 * Ranks/selects modules for this decision. Always returns a valid,
 * constraint-satisfying result — falls back to a deterministic default
 * selection (no LLM) on any failure, so the system never breaks into a
 * chatbot-style free-text error.
 */
export async function prioritizeModules({ decisionType, params, computedData }) {
  const prompt = buildPrompt(decisionType, params, computedData);

  try {
    const raw = await callClaudeServer({
      prompt,
      system: 'You output only raw JSON matching the requested schema. No prose, no markdown fences. Reason freshly about each query — do not reuse a fixed template across queries.',
      maxTokens: 1200,
      temperature: 0.9, // explicit: this layer must NOT behave deterministically
    });
    const parsed = parseLLMJson(raw);
    const enforced = applyHardConstraints(decisionType, params, parsed);

    const reasoning = {};
    for (const key of enforced.selected_modules) {
      reasoning[key] = normalizeReasoning(parsed.reasoning?.[key], () => defaultReason(key, decisionType, params, computedData));
    }

    return { ...enforced, reasoning, source: 'llm' };
  } catch {
    const fallback = defaultSelection(decisionType, params);
    const reasoning = {};
    for (const key of fallback.selected_modules) {
      reasoning[key] = defaultReason(key, decisionType, params, computedData);
    }
    return { ...fallback, reasoning, source: 'fallback' };
  }
}

// Deterministic, data-grounded reasoning used only when the LLM call fails.
// Never a generic placeholder — always references the real computed numbers.
function defaultReason(key, decisionType, params, computedData) {
  const capacity = Number(params?.capacity) || 0;
  const d = computedData[key] || {};

  if (key === 'final_recommendation') {
    return {
      summary: 'Always shown — the headline decision for this query.',
      why_it_matters: 'This is the synthesized verdict across every computed module for this case.',
      why_this_value: `Aggregate score is ${d.score ?? '—'}/100, yielding a "${d.verdict ?? 'pending'}" verdict.`,
      decision_impact: 'Directly drives whether to proceed, proceed with mitigations, or hold.',
    };
  }
  if (key === 'power_analysis') {
    return {
      summary: capacity >= 50 ? `Critical at ${capacity}MW — above the grid-impact threshold.` : 'Included to confirm grid readiness.',
      why_it_matters: 'Power availability is often the binding constraint for datacenter siting at scale.',
      why_this_value: `Grid capacity is ${d.grid_capacity_mw ?? '—'}MW against a ${capacity}MW requirement, substation ${d.substation_distance_km ?? '—'}km away.`,
      decision_impact: `Verdict: ${d.verdict ?? 'pending'} — shapes the timeline and CapEx for grid interconnection.`,
    };
  }
  if (key === 'risk_analysis') {
    return {
      summary: d.coastal ? `${params.location} is a coastal/flood-exposed market.` : 'Included to confirm baseline risk exposure.',
      why_it_matters: 'Site-level risk exposure affects insurance, design standards, and resilience CapEx.',
      why_this_value: `Coastal=${d.coastal ?? false}, flood_zone=${d.flood_zone ?? '—'}, regulatory_risk=${d.regulatory_risk ?? '—'}.`,
      decision_impact: `Risk score of ${d.score ?? '—'}/100 directly discounts the final recommendation's confidence.`,
    };
  }
  if (key === 'candidate_locations') {
    return {
      summary: decisionType === 'land_site_audit' ? 'Land-related query — site shortlist is always relevant.' : 'Included to compare site options.',
      why_it_matters: 'Site selection is the foundation every other module is evaluated against.',
      why_this_value: `Top-ranked site is ${d.ranked?.[0]?.name ?? '—'} at score ${d.ranked?.[0]?.score ?? '—'}.`,
      decision_impact: 'The top-ranked location anchors the headline in the final recommendation.',
    };
  }
  if (key === 'cost_estimation') {
    return {
      summary: 'Included to ground the recommendation in financial terms.',
      why_it_matters: 'CapEx/OpEx and payback period determine whether the opportunity clears investment hurdles.',
      why_this_value: `CapEx is $${d.capex_usd_m ?? '—'}M with a ${d.payback_years ?? '—'}-year payback (${d.verdict ?? 'pending'}).`,
      decision_impact: 'Slow payback or high CapEx weighs against a "Proceed" verdict.',
    };
  }
  if (key === 'connectivity') {
    return {
      summary: 'Included to assess network readiness.',
      why_it_matters: 'Fiber density and latency to hub matter for hyperscale/AI workloads sensitive to network performance.',
      why_this_value: `${d.fiber_routes ?? '—'} fiber routes, ${d.latency_ms_to_hub ?? '—'}ms latency, ${d.carrier_density ?? '—'} carrier density.`,
      decision_impact: `Verdict: ${d.verdict ?? 'pending'} — informs whether additional carrier buildout is needed.`,
    };
  }
  if (key === 'gpu_cluster_planning') {
    return {
      summary: d.cooling_mismatch ? `${d.cooling_label} cannot support the ${d.chip_label} rack density — a hard finding.` : `${d.chip_label} on ${d.cooling_label} is the core sizing input for this campus.`,
      why_it_matters: 'Chip generation and cooling approach determine achievable density, PUE, and — critically — whether GPU hardware capex leaves room in the envelope for the facility itself.',
      why_this_value: `${d.gpus_supported ?? '—'} GPUs across ${d.racks_required ?? '—'} racks at ${d.power_density_kw_per_rack ?? '—'}kW/rack; envelope utilization ${d.envelope_utilization?.utilization_pct ?? '—'}%.`,
      decision_impact: d.cooling_mismatch
        ? `Cooling mismatch forces a minimum viable upgrade to ${d.min_viable_cooling_label ?? 'a denser cooling tier'} before this design is buildable.`
        : `GPU hardware capex ($${Math.round((d.gpu_capex_usd ?? 0) / 1e6)}M) vs facility capex ($${Math.round((d.facility_capex_usd ?? 0) / 1e6)}M) sets how much of the investment envelope is actually deployable.`,
    };
  }
  if (key === 'feasibility') {
    return {
      summary: 'Included to confirm the path to execution is realistic.',
      why_it_matters: 'Feasibility synthesizes land, regulatory, and utility readiness into one execution-risk view.',
      why_this_value: `Feasibility score is ${d.score ?? '—'}/100 ("${d.verdict ?? 'pending'}").`,
      decision_impact: 'Low feasibility scores force conditions/mitigations onto the final recommendation.',
    };
  }
  return {
    summary: `Relevant to ${MODULE_LABELS[key] || key} for this decision.`,
    why_it_matters: 'Provides supporting context for the final recommendation.',
    why_this_value: 'See computed data for this module.',
    decision_impact: 'Feeds into the overall recommendation score.',
  };
}
