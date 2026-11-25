import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isClaim, siteModel, powerModel, regulatoryModel, esgModel, commercialModel, CRITERIA, SOURCING, COOLING,
  getClass, edges, reaches, downstreamOf,
} from './index.js';
import { VALIDATE_FIRST } from './site.js';
import { NAMED_RISKS } from './commercial.js';
import { trentarStore } from './session.js';

/** Every claim reachable from a model object, to check nothing un-minted slips through. */
function claimsIn(obj, out = []) {
  if (isClaim(obj)) { out.push(obj); return out; }
  if (Array.isArray(obj)) obj.forEach((x) => claimsIn(x, out));
  else if (obj && typeof obj === 'object') Object.values(obj).forEach((x) => claimsIn(x, out));
  return out;
}
/** Numbers in a model that are not inside a claim (layout keys aside). */
function looseNumbers(obj, path = '', out = []) {
  if (isClaim(obj)) return out;
  if (typeof obj === 'number' && !/(stage|stageCount)$/.test(path)) out.push(path);
  else if (Array.isArray(obj)) obj.forEach((x, i) => looseNumbers(x, `${path}[${i}]`, out));
  else if (obj && typeof obj === 'object') Object.entries(obj).forEach(([k, v]) => looseNumbers(v, `${path}.${k}`, out));
  return out;
}
const MODELS = { site: siteModel, power: powerModel, regulatory: regulatoryModel, esg: esgModel, commercial: commercialModel };

for (const [name, model] of Object.entries(MODELS)) {
  test(`${name}: four to six metrics, all claims; no loose figure in the model`, () => {
    const m = model();
    const metrics = Object.values(m.metrics);
    assert.ok(metrics.length >= 4 && metrics.length <= 6, `${metrics.length} metrics`);
    assert.ok(metrics.every(isClaim));
    assert.deepEqual(looseNumbers(m), [], 'every number in a drill model travels inside a claim');
    for (const c of claimsIn(m)) {
      if (c.provenance === 'PUBLIC_FACT') assert.ok(c.evidence.length > 0, c.id);
      else assert.ok(c.basis && c.basis.trim().length > 0, `${c.id} has no basis`);
    }
  });
}

test('site: weights from the ontology sum to one hundred', () => {
  const total = siteModel().criteria.reduce((s, c) => s + c.weight.value, 0);
  assert.equal(total, 100);
  assert.ok(siteModel().criteria.every((c) => c.weight.provenance === 'EAIQ_ANALYSIS'));
});

test('site: every criterion score is a required input, never zero; no winner can be named', () => {
  const m = siteModel();
  assert.equal(m.candidates.length, 3);
  for (const cand of m.candidates) {
    assert.equal(cand.total.value, null, cand.name);
    assert.equal(cand.total.provenance, 'TRENTAR_INPUT_REQUIRED');
    assert.equal(cand.scores.length, CRITERIA.length);
    for (const s of cand.scores) {
      assert.equal(s.claim.value, null, s.claim.id);
      assert.equal(s.claim.provenance, 'TRENTAR_INPUT_REQUIRED');
      assert.match(s.claim.basis, /Not computable until Trentar supplies/);
    }
    assert.ok(!('rank' in cand) && !('preferred' in cand) && !('winner' in cand));
  }
  assert.equal(m.metrics.scored.value, 0);
  assert.equal(m.metrics.selected.provenance, 'TRENTAR_INPUT_REQUIRED');
});

test('site: criterion evidence and the validate-first steps are real site, power or policy nodes', () => {
  for (const c of siteModel().criteria) assert.ok(c.evidence.length > 0 && c.evidence.every((e) => /^t\.(site|pwr|reg)\./.test(e.id)), c.key);
  assert.ok(VALIDATE_FIRST.some((v) => v.ids.includes('t.pwr.firm_capacity')), 'HT feasibility is a validate-first step');
});

test('power: each sourcing cell says only what the option basis says', () => {
  for (const row of powerModel().sourcing) {
    for (const [dim, cell] of Object.entries(row.cells)) {
      assert.ok(row.option.basis.toLowerCase().includes(cell.phrase.toLowerCase()), `${row.option.id}/${dim}: "${cell.phrase}" not in basis`);
      assert.equal(cell.claim.provenance, 'EAIQ_ANALYSIS');
      assert.equal(cell.claim.basis, row.option.basis);
    }
  }
  assert.equal(powerModel().sourcing.length, SOURCING.length);
});

test('power: ladder is a public floor and an unvalued direction, with no invented step', () => {
  const l = powerModel().ladder;
  assert.equal(l.floor.provenance, 'PUBLIC_FACT');
  assert.equal(l.floor.unit, '% (floor)');
  assert.equal(l.year3, undefined);
  assert.equal(l.direction.value, null);
  assert.equal(l.matching.provenance, 'TRENTAR_INPUT_REQUIRED');
});

test('power: the AI-design chain follows real edges', () => {
  const chain = powerModel().chain;
  assert.ok(chain.slice(1).every((s) => s.via), chain.map((s) => s.claim.id).join(' > '));
  assert.equal(chain.at(-1).claim.id, 't.pwr.firm_capacity');
});

test('regulatory: public support is kept apart from unverified eligibility', () => {
  const m = regulatoryModel();
  assert.ok(m.support.every((c) => c.provenance === 'PUBLIC_FACT'));
  assert.ok(m.eligibility.every((c) => c.provenance !== 'PUBLIC_FACT'));
  assert.ok(m.incentives.every((i) => i.claim.provenance === 'TRENTAR_INPUT_REQUIRED' && !i.verified));
  assert.ok(m.incentives.every((i) => /eligibility validation required/i.test(i.claim.basis)), 'every incentive is "potentially applicable"');
  assert.equal(m.incentiveValue.value, null);
});

test('regulatory: approval stages respect every precedes edge; commissioning gates COD', () => {
  const m = regulatoryModel();
  const stage = Object.fromEntries(m.approvals.map((a) => [a.id, a.stage]));
  for (const e of edges.filter((x) => x.relation === 'precedes' && x.from in stage && x.to in stage)) assert.ok(stage[e.from] < stage[e.to], `${e.from} → ${e.to}`);
  assert.equal(stage['t.reg.land_title'], 0);
  assert.ok(m.approvals.find((a) => a.id === 't.reg.commissioning').gates.some((c) => c.id === 't.prj.cod'));
  assert.ok(m.approvals.every((a) => a.status === 'Not started'));
});

test('esg: every cooling cell says only what its class definition says', () => {
  for (const row of esgModel().cooling) {
    const def = getClass(row.cls).definition.toLowerCase();
    for (const [dim, cell] of Object.entries(row.cells)) assert.ok(def.includes(cell.phrase.toLowerCase()), `${row.cls}/${dim}`);
  }
  assert.equal(esgModel().cooling.length, COOLING.length);
  assert.equal(esgModel().selected.provenance, 'TRENTAR_INPUT_REQUIRED');
});

test('esg: KPIs connect to consequences, PUE stays illustrative', () => {
  const m = esgModel();
  assert.equal(m.kpis.length, 10);
  for (const k of m.kpis) assert.ok(Object.values(k.channels).some((v) => v.length > 0), `${k.name} reaches no consequence`);
  assert.ok(m.kpis.find((k) => k.name === 'Material Scope 3').channels.bankability.length > 0);
  assert.ok(m.kpis.find((k) => k.name === 'Water withdrawal').channels.approvals.includes('t.reg.environment'));
  assert.equal(m.metrics.pue.provenance, 'ILLUSTRATIVE_SCENARIO');
  assert.ok(!downstreamOf('t.esg.pue').includes('t.dsn.cooling'), 'PUE is downstream of cooling, not upstream');
});

test('commercial: eleven capability slots, none named, every one to be confirmed', () => {
  const m = commercialModel();
  assert.equal(m.slots.length, 11);
  assert.ok(m.slots.every((s) => !s.named && s.claim.provenance === 'TRENTAR_INPUT_REQUIRED'));
  assert.equal(m.metrics.named.value, 0);
  assert.deepEqual(m.owners.map((o) => o.id), ['t.pty.trentar']);
  assert.ok(m.owners.every((o) => o.provenance === 'PUBLIC_FACT'));
});

test('commercial: every delivery risk feeds cost of delay; named risks exist', () => {
  const m = commercialModel();
  assert.equal(m.risks.length, 12);
  assert.ok(m.risks.every((r) => r.claim.confidence === 'Low'), 'risks carry low confidence');
  assert.equal(m.risks.find((r) => r.claim.id === 't.rsk.specialist_capacity').threatens.id, 't.pty.epc');
  assert.ok(m.risks.every((r) => r.costOfDelay), 'cost of delay is the common channel');
  for (const id of Object.keys(NAMED_RISKS)) assert.ok(m.risks.some((r) => r.claim.id === id), id);
  assert.ok(reaches('t.prj.longlead_transformer', 'schedule').length > 0);
});

test('authored drill text carries no figures', () => {
  const texts = [
    ...CRITERIA.flatMap((c) => [c.name, c.drill]),
    ...VALIDATE_FIRST.map((v) => v.step),
    ...SOURCING.flatMap((s) => Object.values(s.cells).map((c) => c.text)),
    ...COOLING.flatMap((s) => Object.values(s.cells).map((c) => c.text)),
    ...Object.values(NAMED_RISKS),
  ];
  for (const t of texts) assert.doesNotMatch(t, /\d/, t);
});

test('each drill keeps its own focus across leaving and returning', () => {
  const s = trentarStore.getState();
  s.reset();
  s.open('site'); s.setFocus('site', 'panvel'); s.close();
  s.open('regulatory'); s.setFocus('regulatory', 't.reg.grid'); s.close();
  s.open('site');
  assert.equal(trentarStore.getState().focus.site, 'panvel');
  assert.equal(trentarStore.getState().focus.regulatory, 't.reg.grid');
  s.reset();
});

test('drill-down model: FID shows all twelve rows; counts are claims; no status', async () => {
  const { drillModel, readinessRows, CARD_IDS, isClaim } = await import('./index.js');
  assert.equal(drillModel('fid').rows.length, readinessRows().length);
  for (const id of CARD_IDS) {
    const m = drillModel(id);
    assert.ok(m.rows.length > 0, `${id} has no readiness rows`);
    for (const c of Object.values(m.chips)) assert.ok(isClaim(c), id);
    assert.equal(m.chips.gates.value, m.rows.filter((r) => r.state === 'FID_GATE').length, id);
    assert.ok(m.columns.length > 0 && m.columns.every((d) => m.rows.some((r) => r.domains[d.id].claims.length)), id);
    assert.ok(m.inputs.every((c) => c.provenance === 'TRENTAR_INPUT_REQUIRED'), id);
    assert.ok(m.sources.every((s) => s.source.url && s.source.asOf), id);
    assert.equal('status' in m.chips, false, id);
  }
});

test('card click toggles its panel; another card swaps it; one panel at a time', async () => {
  const { trentarStore } = await import('./session.js');
  const s = () => trentarStore.getState();
  s().reset();
  s().toggle('power');
  assert.equal(s().openCard, 'power');
  s().toggle('esg');
  assert.equal(s().openCard, 'esg');
  assert.equal(s().selectedCard, 'esg');
  s().toggle('esg');
  assert.equal(s().openCard, null);
  assert.equal(s().selectedCard, 'esg', 'closing keeps the selection');
  s().reset();
});
