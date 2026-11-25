// lib/trentar/commercial.js — 06 Commercial & Ecosystem, derived from the ontology.
//
// The ecosystem is the campus node and every party that `supplies` it. No
// party is named in the ontology, so every slot is unnamed and carries the
// "indicative / to be confirmed" qualifier; what each slot moves is read from
// its outgoing edges. Delivery risks are connected to schedule, capex, opex
// and revenue by consequence.js; every risk also feeds cost of delay.
import { claim } from './claim.js';
import { getClaim, edges, relations } from './registry.js';
import { reaches } from './consequence.js';

export const RISK_CHANNELS = ['schedule', 'capex', 'opex', 'revenue'];
/** The requirement's named delivery risks, mapped to ontology risk nodes. */
export const NAMED_RISKS = {
  't.rsk.supply_chain': 'Long-lead MEP',
  't.rsk.approval': 'Approvals',
  't.rsk.grid_delay': 'Grid connection',
  't.rsk.firm_capacity': 'Grid connection',
  't.rsk.specialist_capacity': 'Specialist capacity',
};

const count = (id, label, value, unit, basis) => claim({ id, label, value, unit, basis, provenance: 'EAIQ_ANALYSIS' });
const relLabel = (id) => relations.find((r) => r.id === id)?.label ?? id;

let cache;
export function commercialModel() {
  if (cache) return cache;
  const slotIds = edges.filter((e) => e.to === 't.prj.campus' && e.relation === 'supplies').map((e) => e.from);
  const ownerIds = edges.filter((e) => e.to === 't.prj.campus' && e.relation === 'owns').map((e) => e.from);
  const slots = slotIds.map((id) => ({
    claim: getClaim(id),
    named: false,
    moves: edges.filter((e) => e.from === id && e.to !== 't.prj.campus').map((e) => ({ relation: relLabel(e.relation), claim: getClaim(e.to) })),
  }));
  const owners = ownerIds.map(getClaim);
  const sponsor = edges.filter((e) => ownerIds.includes(e.to) && e.relation === 'owns').map((e) => getClaim(e.from));
  const risks = edges.filter((e) => e.relation === 'threatens').map((e) => {
    const target = getClaim(e.to);
    return {
      claim: getClaim(e.from),
      threatens: target,
      named: NAMED_RISKS[e.from] ?? null,
      costOfDelay: edges.some((x) => x.from === e.from && x.to === 't.fin.cost_of_delay' && x.relation === 'feeds'),
      channels: Object.fromEntries(RISK_CHANNELS.map((ch) => [ch, reaches(e.to, ch)])),
    };
  });
  cache = {
    hub: getClaim('t.prj.campus'),
    owners,
    sponsor,
    slots,
    risks,
    metrics: {
      announced: getClaim('t.fin.announced_investment'),
      capex: getClaim('t.fin.capex'),
      tenant: getClaim('t.pty.tenant'),
      named: count('t.calc.eco_named', 'Ecosystem partners named', slots.filter((s) => s.named).length, `of ${slots.length} named`,
        'Count of capability slots supplying the campus that have a named party with a recorded relationship state. Any name added must carry indicative through to contracted.'),
      risks: count('t.calc.eco_risks', 'Delivery risks identified', risks.length, 'identified, unscored',
        'Count of risk nodes in the ontology, each linked to what it threatens and to cost of delay. Likelihood and impact are not scored without Trentar programme and cost data.'),
      revenue: getClaim('t.fin.contracted_revenue'),
    },
  };
  return cache;
}
