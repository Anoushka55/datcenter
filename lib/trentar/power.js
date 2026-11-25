// lib/trentar/power.js — 03 Power & AI Design, derived from the ontology.
//
// Three parts: the energy ladder (public floor → illustrative year-three step
// → 24x7 direction), the sourcing comparison, and the AI-design chain from
// rack density to firm capacity.
//
// The sourcing comparison is qualitative and deliberately sparse. Each cell
// restates a position already written in that option's ontology basis; the
// `phrase` must appear verbatim in the basis (power.test enforces it), so a
// cell cannot say more than the ontology does. Unstated cells stay empty.
import { claim } from './claim.js';
import { getClaim, edges, relations } from './registry.js';

export const DIMENSIONS = [
  { key: 'cost', label: 'Cost' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'additionality', label: 'Additionality' },
  { key: 'hourly', label: 'Hourly matching' },
  { key: 'complexity', label: 'Complexity' },
];

/** tone: 'plus' helps the investment case, 'minus' hurts it, 'watch' depends. */
export const SOURCING = [
  { id: 't.pwr.src_green_tariff', cells: {
    reliability: { text: 'Utility-dependent', tone: 'watch', phrase: 'utility-dependent' },
    additionality: { text: 'Weakest', tone: 'minus', phrase: 'weakest additionality' },
    complexity: { text: 'Lowest', tone: 'plus', phrase: 'Lowest complexity' },
  } },
  { id: 't.pwr.src_oa_ppa', cells: {
    cost: { text: 'Exposed to surcharge and wheeling', tone: 'watch', phrase: 'exposed to cross-subsidy and wheeling charges' },
    additionality: { text: 'Strong', tone: 'plus', phrase: 'Strong additionality' },
  } },
  { id: 't.pwr.src_group_captive', cells: {
    cost: { text: 'Alters the charge profile', tone: 'plus', phrase: 'Alters the charge profile' },
    complexity: { text: 'Structural', tone: 'minus', phrase: 'structural complexity' },
  } },
  { id: 't.pwr.src_re_bess', cells: {
    cost: { text: 'Highest capital', tone: 'minus', phrase: 'highest capital cost' },
    hourly: { text: 'Only route that improves it', tone: 'plus', phrase: 'only route that meaningfully improves hourly matching' },
  } },
  { id: 't.pwr.src_recs', cells: {
    additionality: { text: 'None', tone: 'minus', phrase: 'no additionality' },
    hourly: { text: 'None', tone: 'minus', phrase: 'no hourly matching' },
  } },
];

/** The AI-design chain: density → cooling → PUE → electrical load → intake → firm capacity. */
export const DESIGN_CHAIN = ['t.dsn.workload_mix', 't.dsn.density', 't.dsn.cooling', 't.esg.pue', 't.dsn.electrical_load', 't.prj.intake', 't.pwr.firm_capacity'];
/** Nodes beside the chain that change how it reads. */
export const DESIGN_SIDE = ['t.prj.capacity_basis', 't.dsn.diversity', 't.site.heat', 't.dsn.redundancy'];

const relLabel = (from, to) => {
  const e = edges.find((x) => x.from === from && x.to === to) ?? edges.find((x) => x.from === to && x.to === from);
  if (!e) return null;
  const r = relations.find((x) => x.id === e.relation);
  // Read the label in chain direction: if the edge runs backwards, use the inverse wording.
  return e.from === from ? r.label : (relations.find((x) => x.id === r.inverse)?.label ?? r.label);
};

let cache;
export function powerModel() {
  if (cache) return cache;
  const ladder = getClaim('t.pwr.energy_ladder');
  const sourcing = SOURCING.map((o) => {
    const option = getClaim(o.id);
    const cells = Object.fromEntries(DIMENSIONS.filter((d) => o.cells[d.key]).map((d) => {
      const cell = o.cells[d.key];
      return [d.key, {
        tone: cell.tone,
        phrase: cell.phrase,
        claim: claim({
          id: `t.calc.src_${o.id.split('.').pop()}_${d.key}`,
          label: `${option.label}: ${d.label.toLowerCase()}`,
          value: cell.text,
          provenance: 'EAIQ_ANALYSIS',
          basis: option.basis,
        }),
      }];
    }));
    return { option, cells };
  });
  const chain = DESIGN_CHAIN.map((id, i) => ({ claim: getClaim(id), via: i === 0 ? null : relLabel(DESIGN_CHAIN[i - 1], id) }));
  cache = {
    metrics: {
      capacity: getClaim('t.prj.it_capacity'),
      capacityBasis: getClaim('t.prj.capacity_basis'),
      floor: getClaim('t.pwr.re_commitment'),
      matching: getClaim('t.esg.matching_basis'),
      firm: getClaim('t.pwr.firm_capacity'),
      pue: getClaim('t.esg.pue'),
    },
    ladder: {
      floor: getClaim('t.pwr.re_commitment'),
      direction: ladder,
      gap: getClaim('t.ev.gap_ladder_endpoint'),
      matching: getClaim('t.esg.matching_basis'),
    },
    sourcing,
    chain,
    side: DESIGN_SIDE.map(getClaim),
    workload: getClaim('t.dsn.intended_use'),
  };
  return cache;
}
