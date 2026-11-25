import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CARD_DEFS, CARD_IDS, cardView, allowedHeadlineIds, fidStates, anchors, askFirst, modelPosition, evidenceAsOf, isClaim, displayOf,
  ANCHORS, ASK_FIRST,
} from './index.js';

test('six cards, in the requirement order, each with a question and a takeaway', () => {
  assert.deepEqual(CARD_DEFS.map((d) => d.id), CARD_IDS);
  assert.deepEqual(CARD_DEFS.map((d) => d.ordinal), ['01', '02', '03', '04', '05', '06']);
  for (const d of CARD_DEFS) assert.ok(d.question.endsWith('?'), d.id);
});

test('authored card text carries no figures: figures only arrive as claims', () => {
  const texts = [
    ...CARD_DEFS.flatMap((d) => [d.title, d.question, d.takeaway, d.visual, ...d.headline.map((h) => h.caption)]),
    ...ANCHORS.map((a) => a.caption),
    ...ASK_FIRST.map((a) => a.caption),
  ];
  for (const t of texts) assert.doesNotMatch(t, /\d/, t);
});

test('headlines come from the card graph or one edge from it', () => {
  for (const d of CARD_DEFS) {
    const allowed = allowedHeadlineIds(d.id);
    for (const h of d.headline) assert.ok(allowed.has(h.id), `${d.id} headlines ${h.id}, which its graph does not reach`);
  }
});

test('every card view holds only claims, three to four headlines', () => {
  for (const id of CARD_IDS) {
    const v = cardView(id);
    assert.ok(v.headline.length >= 3 && v.headline.length <= 4, id);
    assert.ok(v.headline.every((h) => isClaim(h.claim)), id);
    assert.ok(isClaim(v.needsInput), id);
    assert.equal(Object.values(v.position).reduce((a, b) => a + b, 0), v.total, id);
    assert.equal(v.needsInput.value, v.position.TRENTAR_INPUT_REQUIRED, id);
    for (const [p, c] of Object.entries(v.positionClaims)) {
      assert.ok(isClaim(c), `${id} ${p}`);
      assert.equal(c.value, v.position[p], `${id} ${p}`);
    }
  }
});

test('FID states are counts, not a score', () => {
  const s = fidStates();
  assert.equal(s.gates.value, 8);
  assert.equal(s.conditions.value, 4);
  assert.equal(s.postFid.value, 0);
  for (const c of Object.values(s)) {
    assert.equal(c.provenance, 'EAIQ_ANALYSIS');
    assert.doesNotMatch(`${c.unit} ${c.label}`, /%|score/i);
  }
  assert.equal(displayOf(s.gates).text, '8 gates open');
});

test('anchors are public facts and ask-first items are required inputs', () => {
  assert.ok(anchors().every((a) => a.claim.provenance === 'PUBLIC_FACT'));
  assert.deepEqual(askFirst().map((a) => a.claim.provenance), ['TRENTAR_INPUT_REQUIRED', 'TRENTAR_INPUT_REQUIRED']);
});

test('model position counts reconcile with the seed set', () => {
  const p = modelPosition();
  assert.deepEqual(Object.values(p).map((c) => c.value), [14, 49, 2, 97]);
  assert.equal(evidenceAsOf(), '2026-10-07');
});
