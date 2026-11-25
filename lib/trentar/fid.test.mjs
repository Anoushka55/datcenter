import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readinessRows, fidMetrics, fidStates, upstreamOf, DOMAINS, stateRule, isClaim, allClaims, getClaim } from './index.js';
import { trentarStore } from './session.js';

test('twelve rows, gates first, then conditions', () => {
  const rows = readinessRows();
  assert.equal(rows.length, 12);
  assert.deepEqual(rows.map((r) => r.state), [...Array(8).fill('FID_GATE'), ...Array(4).fill('FID_CONDITION')]);
});

test('each row carries the six things the requirement asks for, as claims', () => {
  for (const r of readinessRows()) {
    assert.ok(isClaim(r.item), r.id); // issue
    assert.ok(stateRule(r.state).statement.length > 0, r.id); // classification
    assert.ok(r.why.length > 0 && !r.why.startsWith('Classified by'), r.id); // why it matters
    assert.equal(r.measured.length, 1, r.id); // evidence required
    assert.ok([...r.measured, ...r.upstream, ...r.requiredInputs, ...r.gaps].every(isClaim), r.id);
    assert.ok(r.requiredInputs.every((c) => c.provenance === 'TRENTAR_INPUT_REQUIRED'), r.id);
    assert.ok(typeof r.status === 'string' && r.status.length > 0, r.id); // status
    assert.ok(typeof r.decisionOwner === 'string' && r.decisionOwner.length > 0, `${r.id}: owner`); // owner
    assert.match(r.ownerNote ?? '', /to be confirmed by Trentar/, `${r.id}: the owner is a proposal`);
    assert.doesNotMatch(r.why, /Owner is the accountable function/, `${r.id}: owner sentence moved out of "why"`);
    assert.equal(r.confidence, 'Medium', r.id);
  }
});

test('upstream follows influence, not just adjacency', () => {
  const cooling = upstreamOf('t.dsn.cooling');
  for (const id of ['t.dsn.density', 't.site.water_stress', 't.site.water_source', 't.dsn.workload_mix']) assert.ok(cooling.includes(id), id);
  assert.ok(!cooling.includes('t.esg.pue'), 'PUE is downstream of cooling, not upstream');
  assert.deepEqual(new Set(upstreamOf('t.pwr.firm_capacity')), new Set(['t.pty.discom', 't.pwr.evacuation']));
  // passive relations are reversed: intake is gated_by firm capacity, so firm capacity is upstream of intake
  assert.ok(upstreamOf('t.prj.intake', 1).includes('t.pwr.firm_capacity'));
});

test('named gaps attach to the rows they block', () => {
  const byId = Object.fromEntries(readinessRows().map((r) => [r.id, r]));
  assert.deepEqual(byId['t.rdy.firm_grid'].gaps.map((g) => g.id), ['t.ev.gap_firm_capacity']);
  assert.deepEqual(byId['t.rdy.firm_grid'].evidenceFrom, ['Trentar / DISCOM']);
  assert.ok(byId['t.rdy.renewable_strategy'].gaps.some((g) => g.id === 't.ev.gap_matching_basis'));
});

test('matrix domains are real ontology domains, and every row touches at least one', () => {
  for (const r of readinessRows()) {
    assert.deepEqual(Object.keys(r.domains), DOMAINS.map((d) => d.id));
    assert.ok(DOMAINS.some((d) => r.presentIn(d.id).length > 0), r.id);
  }
  const renewable = readinessRows().find((r) => r.id === 't.rdy.renewable_strategy');
  assert.ok(renewable.presentIn('ESG').includes('PUBLIC_FACT'), 'the public 51% floor shows alongside what is missing');
  assert.ok(renewable.presentIn('ESG').includes('TRENTAR_INPUT_REQUIRED'));
});

test('metrics are counts with stated rules, recomputed independently', () => {
  const m = fidMetrics();
  const gateInputs = new Set(readinessRows().filter((r) => r.state === 'FID_GATE').flatMap((r) => r.requiredInputs.map((c) => c.id)));
  assert.equal(m.inputsBehindGates.value, gateInputs.size);
  assert.ok(m.inputsBehindGates.value > 0);
  assert.equal(m.gapsNamed.value, 5);
  assert.equal(m.owners.value, 12);
  assert.equal(m.irr.provenance, 'TRENTAR_INPUT_REQUIRED');
  assert.equal(m.irr.value, null);
  for (const c of [m.inputsBehindGates, m.gapsNamed, m.owners, ...Object.values(fidStates())]) {
    assert.equal(c.provenance, 'EAIQ_ANALYSIS');
    assert.ok(c.basis.length > 40, c.id);
    assert.doesNotMatch(`${c.label} ${c.unit}`, /%|score|ready/i, `${c.id}: counts only, no readiness score`);
  }
});

test('every claim in the model resolves to evidence or a basis', () => {
  for (const c of allClaims()) {
    if (c.provenance === 'PUBLIC_FACT') assert.ok(c.evidence.length > 0 && c.evidence.every((e) => e.citable), c.id);
    else assert.ok(typeof c.basis === 'string' && c.basis.trim().length > 0, `${c.id} (${c.provenance}) has no basis`);
  }
  assert.ok(getClaim('t.fin.irr').basis.includes('not modelled') || getClaim('t.fin.irr').basis.includes('invention'));
});

test('the focused row survives leaving and returning to the FID view', () => {
  const s = trentarStore.getState();
  s.reset();
  s.open('fid');
  s.setFocus('fid', 't.rdy.water_source');
  s.close();
  s.open('fid');
  assert.equal(trentarStore.getState().focus.fid, 't.rdy.water_source');
  s.reset();
});
