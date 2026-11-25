import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claim, claimProblems, isClaim, assertClaim, derive, ClaimError } from './claim.js';
import { displayOf, formatAsOf } from './format.js';
import {
  allClaims, getClaim, provenanceCounts, cardSubgraph, readiness, inputsRequired,
  evidenceGaps, claimFromNode, CARD_IDS, sources, isCitable,
} from './index.js';
import { trentarStore, initialSession } from './session.js';

const base = { id: 'x', label: 'X', value: null, provenance: 'EAIQ_ANALYSIS', basis: 'stated logic' };

// ── the seed set ────────────────────────────────────────────────────────────

test('every ontology node mints a valid claim at load', () => {
  const all = allClaims();
  assert.equal(all.length, 162);
  assert.ok(all.every(isClaim));
  assert.deepEqual(provenanceCounts(), { PUBLIC_FACT: 14, EAIQ_ANALYSIS: 49, ILLUSTRATIVE_SCENARIO: 2, TRENTAR_INPUT_REQUIRED: 97 });
});

test('every public fact resolves to a dated, linked source', () => {
  const facts = allClaims().filter((c) => c.provenance === 'PUBLIC_FACT');
  assert.equal(facts.length, 14);
  for (const c of facts) {
    assert.ok(c.evidence.length > 0, c.id);
    for (const e of c.evidence) {
      assert.ok(e.citable && e.url.startsWith('https://') && /^\d{4}-\d{2}-\d{2}$/.test(e.asOf), `${c.id} → ${e.id}`);
    }
  }
});

test('the public anchors carry the confirmed values', () => {
  assert.equal(getClaim('t.prj.it_capacity').value, 500);
  assert.equal(getClaim('t.fin.announced_investment').value, 30000);
  const re = getClaim('t.pwr.re_commitment');
  assert.equal(re.value, 51);
  assert.equal(displayOf(re).text, '≥51%');
  // the release is silent on these, so they stay required inputs
  for (const id of ['t.esg.matching_basis', 't.prj.capacity_basis', 't.site.selected', 't.prj.cod', 't.pwr.firm_capacity', 't.fin.capex', 't.fin.irr', 't.fin.funding', 't.pty.tenant']) {
    assert.equal(getClaim(id).provenance, 'TRENTAR_INPUT_REQUIRED', id);
    assert.equal(getClaim(id).value, null, id);
  }
  // capex is not the announced figure
  assert.notEqual(getClaim('t.fin.capex').provenance, getClaim('t.fin.announced_investment').provenance);
});

test('candidate micro-markets are never public facts', () => {
  for (const id of ['t.site.mm_navi_mumbai', 't.site.mm_thane_airoli', 't.site.mm_panvel']) {
    assert.equal(getClaim(id).provenance, 'EAIQ_ANALYSIS', id);
    assert.match(getClaim(id).label, /candidate/i);
  }
});

test('self-citation applies only to register sources', () => {
  assert.deepEqual(getClaim('t.ev.prnewswire').evidence.map((e) => e.id), ['t.ev.prnewswire']);
  const impostor = { id: 't.ev.blog', classId: 'evd.public_source', label: 'A blog', provenance: 'PUBLIC_FACT', value: null, unit: null, basis: null, evidence: [], status: null, owner: null, decisionClass: null };
  assert.throws(() => claimFromNode(impostor), ClaimError);
});

test('readiness matrix: 12 rows, 8 gates and 4 conditions, no score', () => {
  const rows = readiness();
  assert.equal(rows.length, 12);
  assert.equal(rows.filter((r) => r.decisionClass === 'FID_GATE').length, 8);
  assert.equal(rows.filter((r) => r.decisionClass === 'FID_CONDITION').length, 4);
  assert.ok(rows.every((r) => r.value === null));
});

test('each card derives a non-empty subgraph of claims ending at FID', () => {
  for (const card of CARD_IDS) {
    const g = cardSubgraph(card);
    assert.ok(g.traversals.length > 0, card);
    assert.ok(g.claims.length > 0 && g.claims.every(isClaim), card);
    assert.ok(g.traversals.every((t) => t.path.at(-1) === 't.fid'), card);
    const ids = new Set(g.claims.map((c) => c.id));
    assert.ok(g.edges.every((e) => ids.has(e.from) && ids.has(e.to)), card);
  }
  assert.throws(() => cardSubgraph('seventh'), ClaimError);
});

test('required inputs and gaps are countable', () => {
  assert.equal(inputsRequired().length, 97);
  assert.equal(evidenceGaps().length, 5);
});

test('sources: two, both citable', () => {
  assert.equal(sources.length, 2);
  assert.ok(sources.every((s) => isCitable(s.id)));
  assert.equal(isCitable('t.ev.requirement'), false);
});

// ── the four invariants ─────────────────────────────────────────────────────

test('PUBLIC_FACT needs citable evidence', () => {
  assert.throws(() => claim({ ...base, provenance: 'PUBLIC_FACT', evidence: [] }), /at least one evidence/);
  assert.throws(() => claim({ ...base, provenance: 'PUBLIC_FACT', evidence: ['t.ev.requirement'] }), /not a citable source/);
  assert.ok(isClaim(claim({ ...base, provenance: 'PUBLIC_FACT', evidence: ['t.ev.prnewswire'] })));
});

test('EAIQ_ANALYSIS needs a basis', () => {
  assert.throws(() => claim({ ...base, basis: '  ' }), /needs a basis/);
});

test('ILLUSTRATIVE_SCENARIO needs a basis and says so in its label', () => {
  assert.throws(() => claim({ ...base, provenance: 'ILLUSTRATIVE_SCENARIO', label: 'PUE 1.3' }), /illustrative/);
  assert.throws(() => claim({ ...base, provenance: 'ILLUSTRATIVE_SCENARIO', label: 'PUE (illustrative)', basis: null }), /needs a basis/);
  assert.ok(isClaim(claim({ ...base, provenance: 'ILLUSTRATIVE_SCENARIO', label: 'PUE (illustrative)' })));
});

test('TRENTAR_INPUT_REQUIRED carries no value, and renders as "Input required"', () => {
  assert.throws(() => claim({ ...base, provenance: 'TRENTAR_INPUT_REQUIRED', value: 0 }), /value null/);
  assert.throws(() => claim({ ...base, provenance: 'TRENTAR_INPUT_REQUIRED', value: '76%' }), /value null/);
  const c = claim({ ...base, provenance: 'TRENTAR_INPUT_REQUIRED', value: null });
  assert.deepEqual(displayOf(c), { kind: 'required', text: 'Input required' });
});

test('values must be finite numbers, strings or null', () => {
  for (const value of [NaN, Infinity, {}, [], undefined]) assert.ok(claimProblems({ ...base, value }).length, String(value));
});

// ── the tag ─────────────────────────────────────────────────────────────────

test('only minted claims pass the render guard', () => {
  const c = getClaim('t.prj.it_capacity');
  assert.equal(assertClaim(c), c);
  const forgeries = [{ ...c }, JSON.parse(JSON.stringify(c)), structuredClone({ ...c }), { id: 'x', value: 0.76, provenance: 'EAIQ_ANALYSIS' }, 0.76, '76%', null, undefined];
  for (const f of forgeries) assert.throws(() => assertClaim(f), ClaimError);
  assert.throws(() => displayOf({ ...c }), ClaimError);
});

test('claims are frozen', () => {
  const c = getClaim('t.prj.it_capacity');
  assert.throws(() => { c.value = 600; }, TypeError);
  assert.throws(() => { c.evidence[0].url = 'x'; }, TypeError);
});

// ── derivation inherits the weakest input ───────────────────────────────────

test('derived claims are never stronger than their weakest input', () => {
  const it = getClaim('t.prj.it_capacity'); // PUBLIC_FACT 500 MW
  const pue = claim({ id: 'pue', label: 'Design PUE (illustrative)', value: 1.35, provenance: 'ILLUSTRATIVE_SCENARIO', basis: 'illustrative target' });
  const intake = derive({ id: 'intake', label: 'Grid intake', unit: 'MW', inputs: [it, pue], logic: 'intake = IT x PUE.', compute: ([a, b]) => a * b });
  assert.equal(intake.provenance, 'ILLUSTRATIVE_SCENARIO');
  assert.equal(intake.value, 675);
  assert.match(intake.label, /illustrative/);

  let ran = false;
  const irr = derive({ id: 'irr', label: 'IRR', inputs: [it, getClaim('t.fin.capex')], logic: 'IRR from cash flows.', compute: () => { ran = true; return 0.14; } });
  assert.equal(irr.provenance, 'TRENTAR_INPUT_REQUIRED');
  assert.equal(irr.value, null);
  assert.equal(ran, false, 'compute must not run on missing inputs');

  const half = derive({ id: 'half', label: 'Half', inputs: [it], logic: 'IT / 2.', compute: ([a]) => a / 2 });
  assert.equal(half.provenance, 'EAIQ_ANALYSIS', 'a computation over public facts is analysis, not fact');
  assert.throws(() => derive({ id: 'bad', label: 'Bad', inputs: [{ ...it }], logic: 'x', compute: () => 1 }), ClaimError);
});

test('formatting', () => {
  assert.equal(displayOf(getClaim('t.fin.announced_investment')).text, '₹30,000 Cr');
  assert.equal(displayOf(getClaim('t.prj.it_capacity')).text, '500 MW');
  assert.equal(displayOf(getClaim('t.site.crit_power')).text, '30%');
  assert.deepEqual(displayOf(getClaim('t.site.state')), { kind: 'statement', text: 'Maharashtra' });
  assert.equal(formatAsOf('2026-10-06'), '6 Oct 2026');
});

// ── session ─────────────────────────────────────────────────────────────────

test('closing a view keeps the selected card', () => {
  const s = trentarStore.getState();
  s.reset();
  s.select('site');
  s.open('power');
  assert.equal(trentarStore.getState().openCard, 'power');
  trentarStore.getState().close();
  assert.equal(trentarStore.getState().openCard, null);
  assert.equal(trentarStore.getState().selectedCard, 'power');
  assert.throws(() => trentarStore.getState().select('graph'));
  trentarStore.getState().reset();
  assert.deepEqual({ ...trentarStore.getState(), ...{} }.selectedCard, initialSession.selectedCard);
});
