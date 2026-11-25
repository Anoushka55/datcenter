// lib/trentar/fid.js — the FID readiness matrix, derived from the ontology.
//
// Each of the twelve readiness items measures one decision node. Its row is
// built by walking the graph upstream from that node:
//
//   issue           the readiness item
//   classification  its decision class (gate / condition / post-FID)
//   why it matters  the item's basis
//   evidence req.   the measured node and every required input upstream of it
//   status          the item's status
//   owner / action  decision owner (none is assigned in the ontology) and who
//                   must supply the evidence, from any named evidence gap
//
// "Upstream" follows decision-bearing edges against their direction of
// influence (A determines B ⇒ A is upstream of B), to a fixed depth, so a row
// lists what actually has to be known before that item can close.
import { claim } from './claim.js';
import { getClaim, readiness, evidenceGaps, edges, rules, getClass } from './registry.js';

export const UPSTREAM_DEPTH = 2;

// Relations where the edge's `from` influences its `to`.
const ACTIVE = new Set(['determines', 'gates', 'constrains', 'feeds', 'delays', 'costs', 'conditions', 'requires_of', 'approves', 'supplies', 'entitles', 'applies_to', 'precedes']);
// Passive forms: the edge's `to` influences its `from`.
const PASSIVE = new Set(['gated_by', 'constrained_by', 'determined_by', 'fed_by', 'delayed_by', 'cost_driven_by', 'conditioned_by', 'subject_to']);

/** Map: node id → ids that directly influence it. */
const influencers = (() => {
  const m = new Map();
  const add = (to, from) => { if (!m.has(to)) m.set(to, new Set()); m.get(to).add(from); };
  for (const e of edges) {
    if (ACTIVE.has(e.relation)) add(e.to, e.from);
    else if (PASSIVE.has(e.relation)) add(e.from, e.to);
  }
  return m;
})();

/** Node ids upstream of `id`, nearest first, excluding `id` itself. */
export function upstreamOf(id, depth = UPSTREAM_DEPTH) {
  const seen = new Set([id]);
  const order = [];
  let frontier = [id];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const n of frontier) for (const u of influencers.get(n) ?? []) {
      if (seen.has(u) || u.startsWith('t.rdy.') || u.startsWith('t.ev.')) continue;
      seen.add(u); order.push(u); next.push(u);
    }
    frontier = next;
  }
  return order;
}

/**
 * For an input-required node that computes from upstream ('derive'), the
 * nodes it computes from: its direct influencers in the graph.
 */
export const derivesFrom = (id) => upstreamOf(id, 1).map(getClaim);

export const DOMAINS = [
  { id: 'SITE', label: 'Site' },
  { id: 'POWER', label: 'Power' },
  { id: 'DESIGN', label: 'AI design' },
  { id: 'ESG', label: 'ESG' },
  { id: 'REGULATION', label: 'Regulatory' },
  { id: 'PARTY', label: 'Parties' },
  { id: 'FINANCE', label: 'Finance' },
  { id: 'PROJECT', label: 'Programme' },
];

const RANK = { PUBLIC_FACT: 3, EAIQ_ANALYSIS: 2, ILLUSTRATIVE_SCENARIO: 1, TRENTAR_INPUT_REQUIRED: 0 };
const weakestOf = (claims) => claims.reduce((w, c) => (w === null || RANK[c.provenance] < RANK[w] ? c.provenance : w), null);

export const STATES = [
  { id: 'FID_GATE', label: 'FID gate', plural: 'FID gates', rule: 'r.dec.gate' },
  { id: 'FID_CONDITION', label: 'FID condition', plural: 'FID conditions', rule: 'r.dec.condition' },
  { id: 'POST_FID_OPTIMISATION', label: 'Post-FID optimisation', plural: 'Post-FID optimisations', rule: 'r.dec.postfid' },
];
export const stateRule = (stateId) => rules.find((r) => r.id === STATES.find((s) => s.id === stateId).rule);

const STATUS_LABEL = { NOT_STARTED: 'Not started', IN_PROGRESS: 'In progress', VALIDATED: 'Validated' };

// Every readiness basis opens with the same classification sentence; the
// specific reason follows it.
const BOILERPLATE = /^Classified by whether the investment decision can responsibly be taken without it\.\s*/;
// ...and readiness bases now close with a sentence about the owner, which
// belongs under "Owner", not under "Why it matters".
const OWNER_NOTE = /\s*(Owner is the accountable function[\s\S]*)$/;
export const whyItMatters = (item) => (item.basis ?? '').replace(BOILERPLATE, '').replace(OWNER_NOTE, '');
export const ownerNote = (item) => OWNER_NOTE.exec(item.basis ?? '')?.[1] ?? null;

let rowsCache;
/** The twelve readiness rows, gates first. Every value-bearing field is a claim. */
export function readinessRows() {
  if (rowsCache) return rowsCache;
  const gaps = evidenceGaps();
  const gapTargets = new Map(edges.filter((e) => e.relation === 'gap_in').map((e) => [e.from, e.to]));
  const order = Object.fromEntries(STATES.map((s, i) => [s.id, i]));

  rowsCache = readiness().map((item) => {
    const measuredIds = edges.filter((e) => e.from === item.id && e.relation === 'measures').map((e) => e.to);
    const upIds = [...new Set(measuredIds.flatMap((m) => upstreamOf(m)))].filter((id) => !measuredIds.includes(id));
    const measured = measuredIds.map(getClaim);
    const upstream = upIds.map(getClaim);
    const chain = [...measured, ...upstream];
    const chainIds = new Set(chain.map((c) => c.id));
    const rowGaps = gaps.filter((g) => chainIds.has(gapTargets.get(g.id)));
    const domains = Object.fromEntries(DOMAINS.map((d) => {
      const inDomain = chain.filter((c) => getClass(c.classId)?.domain === d.id);
      return [d.id, { provenance: weakestOf(inDomain), claims: inDomain }];
    }));
    return {
      id: item.id,
      item,
      state: item.decisionClass,
      why: whyItMatters(item),
      status: STATUS_LABEL[item.status] ?? item.status ?? 'Not recorded',
      measured,
      upstream,
      requiredInputs: chain.filter((c) => c.provenance === 'TRENTAR_INPUT_REQUIRED' && c.id !== 't.fid'),
      gaps: rowGaps,
      evidenceFrom: [...new Set(rowGaps.map((g) => g.owner).filter(Boolean))],
      decisionOwner: item.owner ?? null,
      ownerNote: ownerNote(item),
      confidence: item.confidence,
      domains,
      presentIn: (domainId) => [...new Set(domains[domainId].claims.map((c) => c.provenance))],
    };
  }).sort((a, b) => order[a.state] - order[b.state]);
  return rowsCache;
}

const count = (id, label, value, unit, basis) => claim({ id, label, value, unit, basis, provenance: 'EAIQ_ANALYSIS' });

let metricsCache;
/** Headline metrics for the FID view, each a claim with its counting rule as basis. */
export function fidMetrics() {
  if (metricsCache) return metricsCache;
  const rows = readinessRows();
  const gateRows = rows.filter((r) => r.state === 'FID_GATE');
  const inputsBehindGates = new Set(gateRows.flatMap((r) => r.requiredInputs.map((c) => c.id)));
  const owned = rows.filter((r) => r.decisionOwner).length;
  metricsCache = {
    inputsBehindGates: count(
      't.calc.fid_inputs_behind_gates', 'Trentar inputs behind the open gates', inputsBehindGates.size, 'inputs',
      `Distinct TRENTAR_INPUT_REQUIRED nodes measured by, or up to ${UPSTREAM_DEPTH} decision-bearing edges upstream of, the eight FID-gate readiness items.`,
    ),
    gapsNamed: count(
      't.calc.fid_gaps', 'Named evidence gaps', evidenceGaps().length, 'gaps named',
      'Count of evidence-gap nodes in the ontology: each names what is missing, from whom, and what it would unblock.',
    ),
    owners: count(
      't.calc.fid_owners', 'Readiness items with a proposed owner', owned, `of ${rows.length} proposed`,
      'Count of readiness items with an accountable function recorded in the ontology. Each owner is a function proposed by EAiQ, not a named individual, and is to be confirmed by Trentar.',
    ),
    irr: getClaim('t.fin.irr'),
  };
  return metricsCache;
}
