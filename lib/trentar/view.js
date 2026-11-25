// lib/trentar/view.js — everything the cockpit screen shows, as claims.
//
// The cockpit's only model. It reads data/cockpit/trentar.js (curated,
// sourced content) and nothing from the generated ontology: no ontology.js,
// no evidence.js, no registry. lib/trentar/boundaries.test.mjs walks this
// module's imports and fails if either becomes reachable.
//
// Every public figure becomes a PUBLIC_FACT claim with its sources; every
// derived number goes through derive(), so it takes the weakest provenance of
// its inputs; every sentence (insight, answer, finding, open question) is a
// claim whose label is the sentence and whose emphasis is its bold phrase.
// Nothing here describes what is missing as an empty field: gaps arrive as
// open questions, stated as findings.
import { claim, derive, weakest, assertClaim, isClaim } from './claim.js';
import { displayOf, formatAsOf, formatNumber } from './format.js';
import { researchSources } from './research-sources.js';
import { research } from '../../data/cockpit/trentar.js';

export { assertClaim, isClaim, displayOf, formatAsOf };

const R = research;
const F = R.facts;
export const CARD_IDS = Object.keys(R.cards);
export const card = (id) => { if (!R.cards[id]) throw new Error(`Unknown card "${id}"`); return R.cards[id]; };

const fact = (key, f) => claim({ id: `t.v.fact.${key}`, label: f.label, value: f.value, unit: f.unit, provenance: 'PUBLIC_FACT', evidence: f.evidence });
const count = (id, label, value, unit, basis) => claim({ id, label, value, unit, basis, provenance: 'EAIQ_ANALYSIS' });

// ---- public figures -----------------------------------------------------------
const facts = Object.fromEntries(Object.entries(F).filter(([, f]) => !Array.isArray(f)).map(([k, f]) => [k, fact(k, f)]));
facts.perWattByCountry = F.costPerWatt.map((c) => ({ key: c.key, short: c.key === 'usa' ? 'US / KR / AU' : c.short, claim: fact(`cost_per_watt_${c.key}`, c) }));

const pueAssumption = claim({
  id: 't.v.assume.pue',
  label: 'Design PUE, illustrative midpoint',
  value: R.assumptions.designPue,
  unit: null,
  provenance: 'ILLUSTRATIVE_SCENARIO',
  basis: 'Midpoint of the illustrative 1.3 to 1.4 design PUE offered in the EAiQ Guide requirement. Not a Trentar figure; bounded by site wet-bulb and the cooling choice.',
});

// ---- readiness (curated) --------------------------------------------------------
export const DOMAIN_LABEL = { SITE: 'Site', POWER: 'Power', DESIGN: 'AI design', ESG: 'ESG', REGULATION: 'Regulatory', PARTY: 'Parties', FINANCE: 'Finance', PROJECT: 'Programme' };
export const CLASS_LABEL = { FID_GATE: 'Gate', FID_CONDITION: 'Condition', POST_FID_OPTIMISATION: 'Post-FID' };
const READINESS_BASIS = 'Count of the twelve readiness items by decision class. An item is a gate if the board could not responsibly sanction capital while it is open, a condition if sanction can proceed with it carried, owned and dated. A count by state, not a readiness score.';
const byClass = (cls) => R.readiness.filter((r) => r.decisionClass === cls).length;
const states = {
  gates: count('t.v.calc.gates', 'FID gates open', byClass('FID_GATE'), null, READINESS_BASIS),
  conditions: count('t.v.calc.conditions', 'FID conditions to carry', byClass('FID_CONDITION'), null, READINESS_BASIS),
};
/** The twelve readiness items, gates first: plain curated content. */
export const readinessItems = () => [...R.readiness].sort((a, b) => (a.decisionClass === b.decisionClass ? 0 : a.decisionClass === 'FID_GATE' ? -1 : 1));

// ---- derived figures (weakest-input rule applies) ---------------------------------
const pct = (x) => Math.round(x * 100);
const derived = {
  shareOperational: derive({ id: 't.v.calc.share_operational', label: 'Announced capacity as a share of Mumbai operational capacity', unit: '%',
    inputs: [facts.itCapacity, facts.mumbaiOperational], logic: 'Announced capacity ÷ Mumbai operational capacity.', compute: ([a, b]) => pct(a / b) }),
  sharePipeline: derive({ id: 't.v.calc.share_pipeline', label: 'Announced capacity as a share of Mumbai upcoming pipeline', unit: '%',
    inputs: [facts.itCapacity, facts.mumbaiPipeline], logic: 'Announced capacity ÷ Mumbai upcoming pipeline.', compute: ([a, p]) => pct(a / p) }),
  mumbaiShareIndia: derive({ id: 't.v.calc.mumbai_share_india', label: 'Mumbai share of India operational capacity', unit: '%',
    inputs: [facts.mumbaiOperational, facts.indiaOperational], logic: 'Mumbai operational ÷ India operational.', compute: ([m, i]) => pct(m / i) }),
  mumbaiPipelineShare: derive({ id: 't.v.calc.mumbai_pipeline_share', label: 'Mumbai share of India pipeline to 2030', unit: '%',
    inputs: [facts.mumbaiPipeline, facts.indiaPipeline], logic: 'Mumbai pipeline ÷ India pipeline.', compute: ([m, i]) => pct(m / i) }),
  intake: derive({ id: 't.v.calc.intake', label: 'Grid intake at the illustrative design PUE', unit: 'MW',
    inputs: [facts.itCapacity, pueAssumption], logic: 'Grid intake = IT load × design PUE, reading the announced 500 MW as IT load.', compute: ([mw, pue]) => Math.round(mw * pue) }),
  perWatt: derive({ id: 't.v.calc.per_watt', label: 'Implied development cost per announced watt', unit: 'USD/W',
    inputs: [facts.announcedUsd, facts.itCapacity], logic: 'Announced US$ investment ÷ announced MW.', compute: ([bn, mw]) => Math.round(((bn * 1e9) / (mw * 1e6)) * 10) / 10 }),
};
derived.overhead = derive({ id: 't.v.calc.overhead', label: 'Cooling and distribution overhead at the illustrative design PUE', unit: 'MW',
  inputs: [derived.intake, facts.itCapacity], logic: 'Illustrative grid intake minus announced IT load.', compute: ([i, a]) => i - a });
derived.vsMumbai = derive({ id: 't.v.calc.vs_mumbai', label: 'Implied cost per watt as a share of Mumbai construction-only cost', unit: '%',
  inputs: [derived.perWatt, facts.mumbaiCost], logic: 'Implied US$ per watt ÷ Mumbai construction cost per watt.', compute: ([a, b]) => pct(a / b) });
const india = facts.perWattByCountry.find((c) => c.key === 'india').claim;
derived.benchmarkShare = derive({ id: 't.v.calc.benchmark_share', label: 'Implied cost per watt as a share of the India benchmark', unit: '%',
  inputs: [derived.perWatt, india], logic: 'Implied US$ per watt ÷ India development cost per watt.', compute: ([a, b]) => pct(a / b) });

const values = {
  shareOperational: formatNumber(derived.shareOperational.value, '%'),
  sharePipeline: formatNumber(derived.sharePipeline.value, '%'),
  pue: formatNumber(pueAssumption.value, null),
  intake: formatNumber(derived.intake.value, 'MW'),
  mumbaiShareIndia: formatNumber(derived.mumbaiShareIndia.value, '%'),
  mumbaiPipelineShare: formatNumber(derived.mumbaiPipelineShare.value, '%'),
  overhead: formatNumber(derived.overhead.value, 'MW'),
  perWattVsMumbai: formatNumber(derived.vsMumbai.value, '%'),
  perWatt: `US$${formatNumber(derived.perWatt.value, null)}`,
  perWattUnit: formatNumber(derived.perWatt.value, 'USD/W'),
  benchmarkShare: formatNumber(derived.benchmarkShare.value, '%'),
  gates: String(states.gates.value),
  conditions: String(states.conditions.value),
};
const fill = (text, v = values) => text.replace(/\{(\w+)\}/g, (_, k) => {
  if (!(k in v)) throw new Error(`view: no value for {${k}}`);
  return v[k];
});

// ---- hero -------------------------------------------------------------------------
/** The hero stat strip: three announced figures, two counts, the implied cost. */
export const heroStats = () => [
  { key: 'capacity', caption: 'Announced capacity', claim: facts.itCapacity },
  { key: 'investment', caption: 'Announced investment', claim: facts.investment },
  { key: 'renewable', caption: 'Renewable target', claim: facts.renewable },
  { key: 'gates', caption: 'Gates open', claim: states.gates },
  { key: 'conditions', caption: 'Conditions', claim: states.conditions },
  { key: 'perWatt', caption: 'Implied by announcement', claim: derived.perWatt },
];

/** Latest source date, for the "evidence as of" line. Deterministic: no clock. */
export const evidenceAsOf = () => researchSources.map((s) => s.asOf).sort().at(-1);

// ---- charts ------------------------------------------------------------------------
function chartClaim(id, label, points, basis) {
  const provenance = weakest(points.map((p) => p.provenance));
  const evidence = [...new Set(points.flatMap((p) => p.evidence.filter((e) => e.citable).map((e) => e.id)))];
  return claim({ id, label: provenance === 'ILLUSTRATIVE_SCENARIO' && !/illustrative/i.test(label) ? `${label} (illustrative)` : label, value: null, unit: null, provenance, evidence, basis });
}

const CHARTS = {
  readinessByDomain() {
    const domains = Object.keys(DOMAIN_LABEL).filter((d) => R.readiness.some((r) => r.domain === d));
    const bars = domains.map((d) => ({
      label: DOMAIN_LABEL[d],
      segments: ['FID_GATE', 'FID_CONDITION'].map((cls) => ({ state: cls, claim: count(`t.v.chart.rdy_${d}_${cls}`, `${CLASS_LABEL[cls]}s in ${DOMAIN_LABEL[d]}`, R.readiness.filter((r) => r.domain === d && r.decisionClass === cls).length, null, READINESS_BASIS) })).filter((x) => x.claim.value > 0),
    }));
    return { kind: 'stackedBars', bars, claim: chartClaim('t.v.chart.readiness_by_domain', 'The twelve readiness items by domain and decision class', bars.flatMap((b) => b.segments.map((s) => s.claim)), READINESS_BASIS) };
  },
  mumbaiPipeline() {
    const bars = [
      { label: 'Mumbai operational', claim: facts.mumbaiOperational },
      { label: 'Mumbai pipeline', claim: facts.mumbaiPipeline },
    ];
    return { kind: 'bars', bars, reference: { label: 'Trentar', claim: facts.itCapacity },
      claim: chartClaim('t.v.chart.mumbai_pipeline', 'Mumbai data centre capacity, operational and upcoming, against Trentar’s announced capacity', [...bars.map((b) => b.claim), facts.itCapacity], 'Cushman & Wakefield India Data Centre H1 2026 Update (23 Sep 2026); announced capacity from the Trentar release.') };
  },
  intakeVsLoad() {
    const bars = [{ label: 'Announced IT load', claim: facts.itCapacity }, { label: 'Grid intake', claim: derived.intake, mark: true }];
    return { kind: 'hbars', bars,
      claim: chartClaim('t.v.chart.intake_vs_load', 'Announced IT load against illustrative grid intake', bars.map((b) => b.claim), 'Announced capacity from the Trentar release; intake is illustrative (500 MW × PUE 1.35), reading the 500 MW as IT load.') };
  },
  approvalPath() {
    const steps = R.approvals.map((a) => ({ label: a.label, stage: a.stage }));
    const support = [facts.greenPark, facts.elecDuty];
    const sequence = claim({ id: 't.v.chart.approval_sequence', label: 'Consenting sequence for a data centre campus in Maharashtra', value: null, unit: null, provenance: 'EAIQ_ANALYSIS',
      basis: 'EAiQ’s reading of the consenting sequence: each approval follows its prerequisites (land and title, then land use, then environmental, grid, building and telecom, then electrical and fire, then commissioning). Structure only; no dates are stated.' });
    return { kind: 'path', steps, policy: support,
      claim: chartClaim('t.v.chart.approval_path', 'The approval sequence, with the 2026 state support already public', [sequence, ...support], 'Sequence by EAiQ; support from the June 2026 green-park GR (IBA; Power Peak Digest) and the 22 June 2026 electricity duty notification.') };
  },
  coolingTradeoff() {
    const level = { plus: 0, watch: 1, minus: 2 };
    const points = R.cooling.map((t, i) => ({
      label: t.label, water: level[t.water], power: level[t.power],
      claim: claim({ id: `t.v.chart.cooling_${i}`, label: t.label, value: null, unit: null, provenance: 'EAIQ_ANALYSIS', basis: `Placed from its definition: “${t.definition}” Ordinal (lower, middle, higher), not measured values.` }),
    }));
    return { kind: 'tradeoff', points,
      claim: chartClaim('t.v.chart.cooling_tradeoff', 'Cooling options: water draw against power overhead (ordinal)', points.map((p) => p.claim), 'Relative positions only, from the cooling definitions. No PUE or WUE values are plotted, because none is sourced for these options.') };
  },
  costPerWatt() {
    const bars = [...facts.perWattByCountry.map((c) => ({ label: c.short, claim: c.claim })), { label: 'Trentar', claim: derived.perWatt, mark: true }];
    return { kind: 'bars', bars, sortBy: 'value',
      claim: chartClaim('t.v.chart.cost_per_watt', 'Development cost per watt by market, with Trentar’s implied figure', bars.map((b) => b.claim), 'Market figures from the Kotak Mutual Fund report (Tribune India / ANI); Trentar’s figure is US$3.3 bn ÷ 500 MW.') };
  },
};

// ---- per card ------------------------------------------------------------------------
const mint = (id, f) => claim({
  id,
  label: fill(f.text),
  emphasis: fill(f.emphasis),
  value: null,
  unit: null,
  provenance: f.provenance,
  evidence: f.evidence ?? [],
  basis: f.basis ? fill(f.basis) : null,
});

const PLURAL = {
  PUBLIC_FACT: ['public fact', 'public facts'],
  EAIQ_ANALYSIS: ['EAiQ analysis', 'EAiQ analyses'],
  ILLUSTRATIVE_SCENARIO: ['illustrative', 'illustrative'],
};

const cache = new Map();

/**
 * Everything one card shows, face and drill-down.
 *   headline       one figure with its caption
 *   chart          the card's exhibit
 *   insight        the card's action title
 *   answer         the drill-down's one-line answer
 *   brief          at most four one-line findings
 *   openQuestions  at most three gaps, stated as findings
 *   detail         the longer findings, for Evidence
 *   evidenceBase   what the card rests on, by provenance, as count claims
 * @param {string} id
 */
export function cardFor(id) {
  if (cache.has(id)) return cache.get(id);
  const def = card(id);
  const h = def.headline;
  const headline = { caption: h.caption, claim: h.fact ? facts[h.fact] : states[h.count] };
  const chart = CHARTS[def.chart]();
  const insight = mint(`t.v.insight.${id}`, def.insight);
  const answer = mint(`t.v.answer.${id}`, def.answer);
  const brief = def.brief.map((f) => mint(`t.v.${f.id}`, f));
  const openQuestions = def.openQuestions.map((f) => mint(`t.v.${f.id}`, f));
  const detail = def.findings.map((f) => ({ view: Boolean(f.view), claim: mint(`t.v.${f.id}`, { ...f, emphasis: f.emphasis }) }));

  // What the card face rests on: the headline figure, the insight, and the
  // chart. A chart of figures counts each figure it plots; a structural chart
  // (readiness by domain, the approval sequence, the cooling trade-off)
  // counts once as one analysis, plus any public facts it marks.
  const chartPoints = chart.kind === 'bars' || chart.kind === 'hbars'
    ? [...chart.bars.map((b) => b.claim), ...(chart.reference ? [chart.reference.claim] : [])]
    : [chart.claim.provenance === 'PUBLIC_FACT' ? null : claim({ id: `${chart.claim.id}.analysis`, label: chart.claim.label, value: null, unit: null, provenance: chart.kind === 'path' ? 'EAIQ_ANALYSIS' : chart.claim.provenance, basis: chart.claim.basis }),
      ...(chart.kind === 'path' ? chart.policy : [])].filter(Boolean);
  const shown = new Map([headline.claim, insight, ...chartPoints].map((c) => [c.id, c]));
  const by = (p) => [...shown.values()].filter((c) => c.provenance === p).length;
  const evidenceBase = ['PUBLIC_FACT', 'EAIQ_ANALYSIS', 'ILLUSTRATIVE_SCENARIO']
    .map((p) => ({ p, n: by(p) }))
    .filter(({ n }) => n > 0)
    .map(({ p, n }) => ({ provenance: p, claim: count(`t.v.base.${id}.${p}`, `${PLURAL[p][1]} this card rests on`, n, PLURAL[p][n === 1 ? 0 : 1],
      `Count of the distinct ${PROV_WORD[p]} items on the card face: the headline figure, the insight, and the chart (each plotted figure, or the chart itself where it is structural).`) }));

  const model = { id, ordinal: def.ordinal, title: def.title, question: def.question, headline, chart, insight, answer, brief, openQuestions, detail, evidenceBase };
  cache.set(id, model);
  return model;
}
const PROV_WORD = { PUBLIC_FACT: 'public-fact', EAIQ_ANALYSIS: 'EAiQ-analysis', ILLUSTRATIVE_SCENARIO: 'illustrative' };

/** Every source a card cites, deduplicated, newest first, with what it supports. */
export function sourcesFor(id) {
  const m = cardFor(id);
  const claims = [m.headline.claim, m.chart.claim, m.insight, m.answer, ...m.brief, ...m.openQuestions, ...m.detail.map((d) => d.claim)];
  const seen = new Map();
  for (const c of claims) for (const e of c.evidence) {
    if (!e.citable) continue;
    if (!seen.has(e.id)) seen.set(e.id, { source: e, cites: [] });
    seen.get(e.id).cites.push(c);
  }
  return [...seen.values()].sort((a, b) => (a.source.asOf < b.source.asOf ? 1 : -1));
}

export const CLAIMS_FOR_TEST = { facts, derived, states, pueAssumption };
