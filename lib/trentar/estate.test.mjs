// The estate knowledge graph view: reads the estate ontology only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ESTATE_GROUPS, estateCoverage, domainTile, domainTree, searchClasses, metrics, rules, domains } from './estate.js';
import { isClaim } from './claim.js';
import * as E from './estate-ontology.js';

test('the counter strip: 28 domains, 619 classes, 97 relations, 234 attributes, 75 metrics, all claims', () => {
  const c = Object.fromEntries(estateCoverage().map((x) => [x.key, x.claim]));
  assert.ok(Object.values(c).every(isClaim));
  assert.deepEqual([c.domains.value, c.classes.value, c.relations.value, c.attributes.value, c.metrics.value], [28, 619, 97, 234, 75]);
});

test('the five headings place every domain exactly once', () => {
  const placed = ESTATE_GROUPS.flatMap((g) => g.domains);
  assert.equal(placed.length, 28);
  assert.deepEqual([...placed].sort(), domains.map((d) => d.id).sort());
});

test('each domain tile carries its scope and class count; trees list every class once', () => {
  let total = 0;
  for (const d of domains) {
    const t = domainTile(d.id);
    assert.ok(t.scope && isClaim(t.classes), d.id);
    const tree = domainTree(d.id);
    assert.equal(tree.length, t.classes.value, d.id);
    assert.equal(new Set(tree.map((c) => c.id)).size, tree.length, d.id);
    total += tree.length;
  }
  assert.equal(total, E.classes.length);
});

test('search runs across all classes', () => {
  const r = searchClasses('chiller');
  assert.ok(r.length > 0 && r.every((c) => c.trail.length >= 1 && c.domainLabel));
  assert.equal(searchClasses('   ').length, 0);
});

test('metrics and rules come straight from the data', () => {
  assert.equal(metrics.length, 75);
  assert.equal(rules.length, E.rules.length);
  assert.ok(metrics.every((m) => m.label && m.formula));
});

test('the estate view never reads the FID decision model', () => {
  const src = readFileSync(new URL('./estate.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /from '\.\/ontology\.js'/);
});

test('graph: domains, classes and path relationships, every edge resolving to real nodes', async () => {
  const { estateGraph, nodeDetail, edgeLabel } = await import('./estate.js');
  const g = estateGraph();
  assert.equal(g.nodes.length, 28 + 619);
  const ids = new Set(g.nodes.map((n) => n.id));
  for (const l of g.links) assert.ok(ids.has(l.source) && ids.has(l.target), `${l.source} -> ${l.target}`);
  const rel = g.links.filter((l) => l.kind === 'relation');
  assert.ok(rel.length >= 20, `${rel.length} relationship edges`);
  for (const l of rel) assert.ok(E.paths.some((p) => p.steps.includes(l.relation)), `${l.relation} comes from a path`);
  const chiller = g.nodes.find((n) => n.label === 'Chiller');
  const d = nodeDetail(chiller.id);
  assert.ok(d.out.length + d.in.length > 0);
  assert.match(edgeLabel('exhausts_to', [{ text: 'heat rejection', relation: 'water_supplied_by' }]), /exhausts to .* heat rejection .*/);
});

test('impact: two-step reach over relationships, paths answered, siblings and kinds beneath', async () => {
  const { estateGraph, nodeImpact } = await import('./estate.js');
  const chiller = estateGraph().nodes.find((n) => n.label === 'Chiller');
  const i = nodeImpact(chiller.id);
  assert.ok(i.reach.length > 0 && i.reach.every((r) => r.cls && (r.hop === 1 || r.through)));
  assert.equal(new Set(i.reach.map((r) => r.cls.id)).size, i.reach.length);
  assert.ok(i.answers.length > 0 && i.answers.every((a) => a.answers));
  assert.ok(!i.siblings.some((s) => s.id === chiller.id));
  assert.deepEqual(nodeImpact('dom:COOLING').reach, []);
  assert.ok(i.metrics.some((m) => m.label === 'Chiller COP'));
  // a class no metric or rule names borrows its nearest named ancestor's, and says so
  const alloc = nodeImpact(estateGraph().nodes.find((n) => n.label === 'Allocation rule').id);
  assert.equal(alloc.inheritedFrom?.label, 'Attribution');
  assert.ok(alloc.rules.length > 0 && alloc.metrics.length > 0);
});
