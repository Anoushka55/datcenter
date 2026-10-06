import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchCockpit, isCockpitShortcut } from './trigger.js';
import { tataPower } from '../../data/cockpit/tata-power.js';

const FULL = 'Tata Power is evaluating entry into datacentre power infrastructure in India. We want to understand the investment opportunity across captive renewable power, battery storage and grid infrastructure serving hyperscale datacentres.';

test('the full trigger paragraph opens the Tata Power cockpit', () => {
  assert.equal(matchCockpit(FULL), 'tata-power');
});

test('short and fumbled wordings still match', () => {
  for (const p of ['Tata Power datacenter opportunity India', 'tata power — data centre investment in india?', 'TATA POWER: Data Center grid & storage opportunity']) {
    assert.equal(matchCockpit(p), 'tata-power', p);
  }
});

test('unrelated or partial prompts do not match', () => {
  for (const p of ['Where can I put 30 racks at 40kW in Mumbai?', 'Tata Power share price', 'datacentre power investment opportunity in India', 'Tata Power datacentre', 'tata powerhouse data centre india investment']) {
    assert.equal(matchCockpit(p), null, p);
  }
});

test('/cockpit alone is the shortcut', () => {
  assert.ok(isCockpitShortcut('/cockpit'));
  assert.ok(isCockpitShortcut('  /Cockpit '));
  assert.ok(!isCockpitShortcut('/cockpit please'));
});

test('the figures reconcile', () => {
  const g = tataPower.market.growth;
  const cagr = (g.at(-1).sizeBn / g[0].sizeBn) ** (1 / (g.length - 1)) - 1;
  assert.equal(Math.round(cagr * 100), 24);
  assert.equal(Math.round(g.slice(0, 3).reduce((s, x) => s + x.sizeBn, 0)), 22);
  const segs = tataPower.segments.items;
  assert.equal(Math.round(segs.reduce((s, x) => s + x.valueBn, 0) * 10) / 10, g.at(-1).sizeBn);
  assert.equal(segs.reduce((s, x) => s + x.share, 0), 100);
  const rows = tataPower.opportunities.rows.reduce((s, r) => s + Number(r.value.replace(/[$Bn]/g, '')), 0);
  assert.equal(Math.round(rows * 10) / 10, 14);
});
