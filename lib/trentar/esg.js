// lib/trentar/esg.js — 05 ESG & Resources, derived from the ontology.
//
// The KPI rail is read for consequence, not reporting: each KPI shows which
// of bankability, tenant acceptance, approvals and operating cost it moves,
// read off the graph by consequence.js.
//
// The cooling trade-off uses the ontology's cooling-technology classes. Cells
// restate the class definition and the `phrase` must appear in it
// (esg.test enforces it), so no cell claims more than the ontology defines.
import { claim } from './claim.js';
import { getClaim, getClass } from './registry.js';
import { reaches, downstreamOf } from './consequence.js';

export const KPIS = [
  { id: 't.esg.pue', name: 'PUE' },
  { id: 't.esg.wue', name: 'WUE' },
  { id: 't.esg.cue', name: 'CUE' },
  { id: 't.pwr.re_commitment', name: 'Renewable share' },
  { id: 't.esg.scope1', name: 'Scope 1' },
  { id: 't.esg.scope2', name: 'Scope 2' },
  { id: 't.esg.scope3', name: 'Material Scope 3' },
  { id: 't.esg.water_withdrawal', name: 'Water withdrawal' },
  { id: 't.esg.water_reuse', name: 'Water reuse' },
  { id: 't.esg.ewaste', name: 'E-waste recovery' },
];

export const ESG_CHANNELS = ['bankability', 'tenant', 'approvals', 'opex'];

export const COOLING_DIMENSIONS = [
  { key: 'water', label: 'Water' },
  { key: 'power', label: 'Power' },
  { key: 'density', label: 'Density' },
  { key: 'maturity', label: 'Maturity' },
];

/** tone: 'plus' favourable, 'minus' unfavourable, 'watch' conditional. */
export const COOLING = [
  { cls: 'dsn.air_cooling', cells: { density: { text: 'Limited at high density', tone: 'minus', phrase: 'Limited at high density' } } },
  { cls: 'dsn.evaporative_cooling', cells: {
    water: { text: 'Heavy', tone: 'minus', phrase: 'heavy on water' },
    power: { text: 'Efficient', tone: 'plus', phrase: 'Efficient on power' },
  } },
  { cls: 'dsn.adiabatic_cooling', cells: {
    water: { text: 'Only at high ambient', tone: 'watch', phrase: 'evaporation only at high ambient' },
    power: { text: 'Traded seasonally', tone: 'watch', phrase: 'trading water against power seasonally' },
  } },
  { cls: 'dsn.closed_loop_cooling', cells: {
    water: { text: 'Minimal make-up', tone: 'plus', phrase: 'minimal make-up water' },
    power: { text: 'Higher draw', tone: 'minus', phrase: 'higher power draw' },
  } },
  { cls: 'dsn.direct_to_chip', cells: { density: { text: 'Required above the air ceiling', tone: 'plus', phrase: 'Required above the air-cooling ceiling' } } },
  { cls: 'dsn.immersion_cooling', cells: {
    density: { text: 'Highest', tone: 'plus', phrase: 'Highest density' },
    maturity: { text: 'Least mature', tone: 'minus', phrase: 'least mature supply chain' },
  } },
  { cls: 'dsn.hybrid_cooling', cells: { density: { text: 'Mixed halls for a workload mix', tone: 'plus', phrase: 'Mixed halls' } } },
];

/** What must be known before cooling can be chosen (its decision inputs). */
export const COOLING_INPUTS = ['t.dsn.density', 't.site.water_source', 't.site.water_stress', 't.site.heat', 't.site.recycled_water'];
/** What the cooling decision moves directly (one edge downstream). */
export const coolingMoves = () => downstreamOf('t.dsn.cooling', 1).map(getClaim);

const count = (id, label, value, unit, basis) => claim({ id, label, value, unit, basis, provenance: 'EAIQ_ANALYSIS' });

let cache;
export function esgModel() {
  if (cache) return cache;
  const kpis = KPIS.map((k) => {
    const c = getClaim(k.id);
    return { ...k, claim: c, channels: Object.fromEntries(ESG_CHANNELS.map((ch) => [ch, reaches(k.id, ch)])) };
  });
  const cooling = COOLING.map((t) => {
    const cls = getClass(t.cls);
    const cells = Object.fromEntries(COOLING_DIMENSIONS.filter((d) => t.cells[d.key]).map((d) => {
      const cell = t.cells[d.key];
      return [d.key, {
        tone: cell.tone,
        phrase: cell.phrase,
        claim: claim({
          id: `t.calc.cool_${t.cls.split('.').pop()}_${d.key}`,
          label: `${cls.label}: ${d.label.toLowerCase()}`,
          value: cell.text,
          provenance: 'EAIQ_ANALYSIS',
          basis: `${cls.definition} Qualitative position from the ontology's class definition; no Trentar design data has been applied.`,
        }),
      }];
    }));
    return { cls: t.cls, name: cls.label, definition: cls.definition, cells };
  });
  const n = (p) => kpis.filter((k) => k.claim.provenance === p).length;
  cache = {
    kpis,
    cooling,
    selected: getClaim('t.dsn.cooling'),
    coolingInputs: COOLING_INPUTS.map(getClaim),
    coolingMoves: coolingMoves(),
    metrics: {
      floor: getClaim('t.pwr.re_commitment'),
      matching: getClaim('t.esg.matching_basis'),
      pue: getClaim('t.esg.pue'),
      evidenced: count('t.calc.esg_public', 'ESG KPIs with a public position', n('PUBLIC_FACT'), `of ${kpis.length} KPIs`,
        'Count of the ten ESG KPIs on the rail whose position is a dated, linked public fact.'),
      required: count('t.calc.esg_required', 'ESG KPIs needing Trentar data', n('TRENTAR_INPUT_REQUIRED'), `of ${kpis.length} KPIs`,
        'Count of the ten ESG KPIs on the rail that cannot be stated without Trentar design or operating data.'),
      water: getClaim('t.site.water_source'),
    },
  };
  return cache;
}
