import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreTrentar, THRESHOLD } from './matcher.js';
import { matchCockpit, explainMatch } from '../cockpit/trigger.js';

const CANONICAL = 'Trentar Private Limited wants to assess the investment readiness of its proposed 500 MW AI-ready green hyperscale data center campus in Maharashtra, considering FID readiness, site and power feasibility, regulatory and ESG requirements, strategic partnerships, and commercial viability.';

// Differently worded: different verbs, different asset words, different intent words.
const MUST_TRIGGER = [
  CANONICAL,
  "Is Trentar ready for FID on its Maharashtra campus?",
  "Can Trentar's 500 MW data centre reach a final investment decision?",
  'How investable is the Trentar hyperscale project right now?',
  'trentar dc — feasibility and bankability check',
  "Should Dorf Ketal's Trentar go/no-go on the AI campus?",
  'Trentar FID readiness',
];

const MUST_NOT_TRIGGER = [
  // right asset and intent, no client: a generic question stays in the Guide
  'What is the investment readiness of a 500 MW data centre campus in Maharashtra?',
  // right client and asset, no investment intent
  'Trentar Private Limited data centre news',
  // client and a loose investment word, nothing about the asset: below threshold
  'Is Trentar a good investment?',
  'Who are Trentar competitors in hyperscale?',
  'Trentar campus',
];

test('seven differently worded questions all open the Trentar cockpit', () => {
  for (const q of MUST_TRIGGER) {
    const r = scoreTrentar(q);
    assert.ok(r.fires, `${q} → ${JSON.stringify(r)}`);
    assert.equal(matchCockpit(q), 'trentar', q);
  }
});

test('near-misses do not', () => {
  for (const q of MUST_NOT_TRIGGER) {
    assert.equal(scoreTrentar(q).fires, false, `${q} → ${JSON.stringify(scoreTrentar(q))}`);
    assert.notEqual(matchCockpit(q), 'trentar', q);
  }
});

test('the canonical requirement scores full marks and shows its working', () => {
  const r = scoreTrentar(CANONICAL);
  assert.equal(r.score, 1);
  assert.ok(r.groups.entity.matched.includes('trentar private limited'));
  assert.ok(r.groups.asset.matched.includes('hyperscale'));
  assert.ok(r.groups.intent.matched.includes('investment readiness'));
});

test('the threshold sits exactly at entity plus a full-strength intent', () => {
  const r = scoreTrentar('Trentar FID readiness');
  assert.equal(r.score, THRESHOLD);
  assert.equal(r.groups.asset.score, 0);
});

test('Tata Power prompts are unaffected', () => {
  assert.equal(matchCockpit('Tata Power is evaluating entry into datacentre power infrastructure in India. We want to understand the investment opportunity across captive renewable power, battery storage and grid infrastructure serving hyperscale datacentres.'), 'tata-power');
  assert.equal(scoreTrentar('Tata Power datacenter opportunity India').fires, false);
});

test('precedence: of the cockpits that fire, the highest score wins', () => {
  const fake = (score) => ({ trigger: { score: () => ({ score, fires: true, threshold: 0.5, groups: {} }) } });
  assert.equal(matchCockpit('anything', { a: fake(0.8), b: fake(0.9) }), 'b');
  assert.equal(matchCockpit('anything', { a: fake(0.9), b: fake(0.8) }), 'a');
  // a non-firing cockpit never wins, whatever its score
  const quiet = { trigger: { score: () => ({ score: 0.99, fires: false, threshold: 1, groups: {} }) } };
  assert.equal(matchCockpit('anything', { a: fake(0.6), q: quiet }), 'a');
});

test('a tie at the top falls through to the normal Guide response', () => {
  const fake = (score) => ({ trigger: { score: () => ({ score, fires: true, threshold: 0.5, groups: {} }) } });
  assert.equal(matchCockpit('anything', { a: fake(0.9), b: fake(0.9) }), null);
  assert.equal(matchCockpit('anything', { a: fake(0.9), b: fake(0.9), c: fake(0.5) }), null);
  // real registry: a prompt that fully satisfies both cockpits ties at 1.0
  const both = 'Tata Power and Trentar: data centre investment readiness, FID and feasibility of hyperscale power infrastructure in India';
  const ex = explainMatch(both);
  assert.deepEqual(ex.filter((h) => h.fires).map((h) => h.score), [1, 1]);
  assert.equal(matchCockpit(both), null);
});

test('scoring is deterministic', () => {
  for (const q of [...MUST_TRIGGER, ...MUST_NOT_TRIGGER]) assert.deepEqual(scoreTrentar(q), scoreTrentar(q));
});
