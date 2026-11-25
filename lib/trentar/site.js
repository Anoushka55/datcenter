// lib/trentar/site.js — 02 Site & Infrastructure, derived from the ontology.
//
// The weighting model is in the ontology (six criteria, weights summing to
// 100). No criterion is scored for any candidate, so every criterion score is
// derived with derive(): its inputs are the site evidence that criterion
// rests on, all of which are Trentar inputs, so every score is "Input
// required" and every weighted total stays null. Nothing here can name a
// winner: there is no value to rank by.
import { claim, derive } from './claim.js';
import { getClaim } from './registry.js';

/**
 * Criterion → the evidence it is scored on. The ontology defines the
 * criteria and the evidence nodes but has no edge between them; this mapping
 * follows the requirement's site drill list (title/zoning, headroom, grid
 * proximity and connection, water source, hazard exposure, fibre diversity).
 */
export const CRITERIA = [
  { key: 'power', id: 't.site.crit_power', name: 'Power', drill: 'Grid proximity and HT connection', inputs: ['t.site.substation', 't.pwr.firm_capacity', 't.pwr.evacuation'] },
  { key: 'water', id: 't.site.crit_water', name: 'Water', drill: 'Basin and water source', inputs: ['t.site.water_source', 't.site.water_stress', 't.site.recycled_water_volume'] },
  { key: 'connectivity', id: 't.site.crit_connectivity', name: 'Connectivity', drill: 'Fibre route and carrier diversity', inputs: ['t.site.fibre_div'] },
  { key: 'hazard', id: 't.site.crit_hazard', name: 'Hazard and resilience', drill: 'Flood, heat, seismic and coastal exposure', inputs: ['t.site.flood', 't.site.heat', 't.site.seismic', 't.site.cyclone'] },
  { key: 'land', id: 't.site.crit_land', name: 'Land and approvals', drill: 'Title, zoning and expansion headroom', inputs: ['t.site.land_control', 't.site.zoning', 't.site.headroom'] },
  { key: 'incentives', id: 't.site.crit_incentives', name: 'Incentives and talent', drill: 'Policy instrument and eligibility', inputs: ['t.reg.state_policy'] },
];

export const CANDIDATES = [
  { key: 'navi_mumbai', id: 't.site.mm_navi_mumbai', scoreId: 't.site.score_navi_mumbai', name: 'Navi Mumbai' },
  { key: 'thane_airoli', id: 't.site.mm_thane_airoli', scoreId: 't.site.score_thane_airoli', name: 'Thane / Airoli' },
  { key: 'panvel', id: 't.site.mm_panvel', scoreId: 't.site.score_panvel', name: 'Panvel' },
];

/** What the recommendation asks Trentar to validate before land commitment. */
export const VALIDATE_FIRST = [
  { step: 'HT feasibility with the DISCOM', ids: ['t.site.substation', 't.pwr.firm_capacity'] },
  { step: 'Title and zoning on shortlisted parcels', ids: ['t.site.land_control', 't.site.zoning'] },
  { step: 'Water source and basin stress', ids: ['t.site.water_source', 't.site.water_stress'] },
];

const count = (id, label, value, unit, basis) => claim({ id, label, value, unit, basis, provenance: 'EAIQ_ANALYSIS' });

let cache;
export function siteModel() {
  if (cache) return cache;
  const criteria = CRITERIA.map((c) => ({ ...c, weight: getClaim(c.id), evidence: c.inputs.map(getClaim) }));
  const candidates = CANDIDATES.map((m) => {
    const scores = criteria.map((c) => ({
      criterion: c.key,
      claim: derive({
        id: `t.calc.site_${m.key}_${c.key}`,
        label: `${c.name} score, ${m.name}`,
        unit: 'points',
        inputs: c.evidence,
        logic: `Score for the ${m.name} micro-market on ${c.name.toLowerCase()} (${c.drill.toLowerCase()}), weighted by the criterion weight.`,
      }),
    }));
    return { ...m, market: getClaim(m.id), total: getClaim(m.scoreId), scores };
  });
  const cells = candidates.flatMap((m) => m.scores);
  const scored = cells.filter((s) => s.claim.value !== null).length;
  const inputIds = new Set(criteria.flatMap((c) => c.inputs));
  cache = {
    criteria,
    candidates,
    validateFirst: VALIDATE_FIRST.map((v) => ({ step: v.step, claims: v.ids.map(getClaim) })),
    metrics: {
      state: getClaim('t.site.state'),
      selected: getClaim('t.site.selected'),
      candidates: count('t.calc.site_candidates', 'Candidate micro-markets', candidates.length, 'candidates',
        'Count of micro-market nodes in the ontology that are alternatives to the confirmed site. Carried forward from KPMG preliminary work; none is a Trentar-disclosed location.'),
      scored: count('t.calc.site_scored', 'Criterion scores evidenced', scored, `of ${cells.length} scored`,
        'Count of criterion-by-candidate scores with an evidenced value, out of six criteria for each candidate. A score is computable only once the site evidence it rests on is supplied.'),
      inputs: count('t.calc.site_inputs', 'Site evidence inputs required', [...inputIds].filter((id) => getClaim(id).provenance === 'TRENTAR_INPUT_REQUIRED').length, 'inputs',
        'Distinct Trentar inputs the six site criteria are scored on: substation, firm capacity, evacuation, water source and stress, treated-water volume, fibre, flood, heat, seismic, cyclone, land control, zoning, headroom and the state policy position.'),
      weightPower: getClaim('t.site.crit_power'),
    },
  };
  return cache;
}

/** Criterion name without the weight the ontology label embeds ("Power (30%)"). */
export const criterionName = (key) => CRITERIA.find((c) => c.key === key)?.name ?? key;
