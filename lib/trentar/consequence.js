// lib/trentar/consequence.js — where a node's influence lands.
//
// The drill-downs for cards 02–06 must connect a metric to what it moves
// (bankability, tenant acceptance, approvals, operating cost, schedule…), not
// list it. That connection is read off the graph: follow decision-bearing
// edges downstream from the node and see which consequence nodes are reached.
//
// Differs from fid.js's upstream walk in two deliberate ways: `measures` and
// `part_of` count as influence (Scope 1 measures CUE; cooling capital is part
// of capex), and `threatens` does too (a risk moves what it threatens).
import { edges } from './registry.js';

const ACTIVE = new Set([
  'determines', 'gates', 'constrains', 'feeds', 'delays', 'costs', 'conditions', 'requires_of', 'approves',
  'supplies', 'entitles', 'applies_to', 'precedes', 'threatens', 'measures', 'part_of',
]);
const PASSIVE = new Set(['gated_by', 'constrained_by', 'determined_by', 'fed_by', 'delayed_by', 'cost_driven_by', 'conditioned_by', 'subject_to']);

const out = new Map();
const inc = new Map();
const link = (from, to, relation) => {
  if (!out.has(from)) out.set(from, []);
  if (!inc.has(to)) inc.set(to, []);
  out.get(from).push({ id: to, relation });
  inc.get(to).push({ id: from, relation });
};
for (const e of edges) {
  if (ACTIVE.has(e.relation)) link(e.from, e.to, e.relation);
  else if (PASSIVE.has(e.relation)) link(e.to, e.from, e.relation);
}

export const DOWNSTREAM_DEPTH = 4;

/** Node ids downstream of `id` (what it influences), nearest first. */
export function downstreamOf(id, depth = DOWNSTREAM_DEPTH) {
  const seen = new Set([id]);
  const order = [];
  let frontier = [id];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const n of frontier) for (const { id: v } of out.get(n) ?? []) {
      if (seen.has(v)) continue;
      seen.add(v); order.push(v); next.push(v);
    }
    frontier = next;
  }
  return order;
}

/** Direct influencers of `id` as { id, relation }. */
export const influencedBy = (id) => inc.get(id) ?? [];
/** Direct influence of `id` as { id, relation }. */
export const influences = (id) => out.get(id) ?? [];

/**
 * Consequence channels. A node "connects to" a channel when the channel's
 * nodes lie downstream of it; `inbound` channels also count a channel node
 * that directly constrains it (an approval that conditions a KPI).
 */
export const CHANNELS = {
  bankability: { label: 'Bankability', ids: ['t.esg.lender_esg', 't.fin.cost_of_capital', 't.fin.debt', 't.fin.funding'] },
  tenant: { label: 'Tenant acceptance', ids: ['t.esg.tenant_esg', 't.dsn.tenant_req', 't.fin.contracted_revenue'] },
  approvals: { label: 'Approvals', prefix: 't.reg.', inbound: true },
  opex: { label: 'Operating cost', ids: ['t.fin.energy_cost', 't.fin.water_cost'] },
  capex: { label: 'Capex', ids: ['t.fin.capex'] },
  schedule: { label: 'Schedule', ids: ['t.prj.cod', 't.pwr.energisation'] },
  revenue: { label: 'Revenue', ids: ['t.fin.contracted_revenue', 't.fin.take_up'] },
};

const inChannel = (ch, id) => (ch.prefix ? id.startsWith(ch.prefix) : ch.ids.includes(id));

/** Channel nodes `id` reaches, for one channel key. Empty when unconnected. */
export function reaches(id, channelKey, depth = DOWNSTREAM_DEPTH) {
  const ch = CHANNELS[channelKey];
  const hits = downstreamOf(id, depth).filter((v) => inChannel(ch, v));
  if (ch.inbound) for (const { id: u } of influencedBy(id)) if (inChannel(ch, u) && !hits.includes(u)) hits.push(u);
  return hits;
}
