// The cockpit's view layer: curated, sourced content minted into claims, with
// no dependency on the generated ontology.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARD_IDS, cardFor, sourcesFor, heroStats, readinessItems, isClaim, CLAIMS_FOR_TEST } from './view.js';
import { research } from '../../data/cockpit/trentar.js';
import { researchSources } from './research-sources.js';

const sentences = (m) => [m.insight, m.answer, ...m.brief, ...m.openQuestions, ...m.detail.map((d) => d.claim)];
const all = () => CARD_IDS.flatMap((id) => sentences(cardFor(id)));

test('six cards, each with one headline figure, one chart, an insight, an answer and an evidence base', () => {
  assert.deepEqual(CARD_IDS, ['fid', 'site', 'power', 'regulatory', 'esg', 'commercial']);
  for (const id of CARD_IDS) {
    const m = cardFor(id);
    assert.ok(isClaim(m.headline.claim) && isClaim(m.chart.claim) && isClaim(m.insight) && isClaim(m.answer), id);
    assert.ok(m.evidenceBase.length >= 1 && m.evidenceBase.every((b) => isClaim(b.claim) && b.claim.value > 0), id);
  }
});

test('nothing on screen is an input-required claim: gaps arrive as findings', () => {
  for (const id of CARD_IDS) {
    const m = cardFor(id);
    const shown = [m.headline.claim, m.chart.claim, ...sentences(m), ...m.evidenceBase.map((b) => b.claim)];
    for (const c of shown) assert.notEqual(c.provenance, 'TRENTAR_INPUT_REQUIRED', c.id);
    assert.ok(m.evidenceBase.every((b) => b.provenance !== 'TRENTAR_INPUT_REQUIRED'), id);
  }
  for (const s of heroStats()) assert.notEqual(s.claim.provenance, 'TRENTAR_INPUT_REQUIRED', s.key);
});

test('public facts cite a dated, linked source from the cockpit register', () => {
  const ids = new Set(researchSources.map((s) => s.id));
  for (const s of researchSources) assert.ok(s.url.startsWith('https://') && /^\d{4}-\d{2}-\d{2}$/.test(s.asOf), s.id);
  for (const c of all()) {
    if (c.provenance === 'PUBLIC_FACT') assert.ok(c.evidence.length > 0, c.id);
    for (const e of c.evidence) assert.ok(e.citable && ids.has(e.id), `${c.id} cites ${e.id}`);
  }
});

test('derived numbers are computed from the public figures, with the weakest-input rule', () => {
  const { derived } = CLAIMS_FOR_TEST;
  assert.equal(derived.shareOperational.value, 56, '500 / 890 MW operational (C&W H1 2026)');
  assert.equal(derived.sharePipeline.value, 29, '500 / 1,726 MW pipeline');
  assert.equal(derived.mumbaiShareIndia.value, 50, '890 / 1,789 MW');
  assert.equal(derived.mumbaiPipelineShare.value, 45, '1,726 / 3,860 MW');
  assert.equal(derived.intake.value, 675);
  assert.equal(derived.intake.provenance, 'ILLUSTRATIVE_SCENARIO');
  assert.equal(derived.overhead.value, 175);
  assert.equal(derived.overhead.provenance, 'ILLUSTRATIVE_SCENARIO');
  assert.equal(derived.perWatt.value, 6.6);
  assert.equal(derived.benchmarkShare.value, 94);
  assert.equal(derived.vsMumbai.value, 99, '6.6 / 6.64 US$/W');
});

test('the hero strip: three announced figures, two counts, and the implied cost per watt', () => {
  const h = heroStats();
  assert.deepEqual(h.map((s) => s.key), ['capacity', 'investment', 'renewable', 'gates', 'conditions', 'perWatt']);
  assert.equal(h.find((s) => s.key === 'perWatt').caption, 'Implied by announcement');
  assert.equal(h.find((s) => s.key === 'gates').claim.value, 8);
  assert.equal(h.find((s) => s.key === 'conditions').claim.value, 4);
});

test('readiness items are curated content: twelve, gates first, each with a class and a domain', () => {
  const items = readinessItems();
  assert.equal(items.length, 12);
  assert.equal(research.readiness.length, 12);
  assert.ok(items.every((r) => ['FID_GATE', 'FID_CONDITION'].includes(r.decisionClass) && r.domain && r.why));
  assert.equal(items[0].decisionClass, 'FID_GATE');
});

test('anything resting on the illustrative PUE says illustrative', () => {
  for (const c of all()) if (c.provenance === 'ILLUSTRATIVE_SCENARIO') assert.match(c.label, /illustrative/i, c.id);
});

test('every sentence sets one phrase from itself in bold', () => {
  for (const c of all()) assert.ok(c.emphasis && c.label.includes(c.emphasis), c.id);
});

test('sources for a card are deduplicated', () => {
  for (const id of CARD_IDS) {
    const s = sourcesFor(id);
    assert.equal(new Set(s.map((x) => x.source.id)).size, s.length, id);
  }
});

test('sources are current: nothing older than 2025, and market figures are H1 2026', () => {
  for (const src of researchSources) assert.ok(src.asOf >= '2025-01-01', `${src.id} is dated ${src.asOf}`);
  assert.match(research.facts.mumbaiOperational.label, /H1 2026/);
  assert.ok(!researchSources.some((x) => x.id === 'src.aim' || x.id === 'src.cam'), 'superseded sources are retired');
});

test('the green-park policy finding replaces the superseded Zone-I reading', () => {
  const text = CARD_IDS.flatMap((id) => sentences(cardFor(id)).map((c) => c.label)).join(' ');
  assert.doesNotMatch(text, /does not apply inside MMR|unavailable at all three/);
  assert.match(cardFor('regulatory').insight.label, /green-park threshold/);
});
