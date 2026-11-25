// Secondary net behind the runtime guard. The real enforcement is claim() and
// assertClaim(); this scan catches the obvious slip of typing a figure into a
// page. Scoped to JSX *text positions* only, so viewBox, grid spans, style
// numbers and props never trip it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIRS = ['components/trentar', 'app/cockpit/trentar'];

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(jsx|js)$/.test(f) ? [p] : [];
  });
}
const UI = DIRS.flatMap((d) => files(join(ROOT, d)));

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');

/** Figures typed as JSX text, e.g. <span>76%</span>, >500 MW<, >{0.76}<, >{'1.35'}< */
export function textFigures(src) {
  const s = stripComments(src);
  const hits = [];
  for (const m of s.matchAll(/>([^<>{}=&|]*\d[^<>{}=&|]*)</g)) hits.push(m[1].trim());
  for (const m of s.matchAll(/>\s*\{\s*(['"`]?-?\d[\d.,%\s]*\w*['"`]?)\s*\}/g)) hits.push(m[1].trim());
  return hits;
}

test('the scan itself catches typed figures and ignores layout numbers', () => {
  assert.deepEqual(textFigures('<span>76% ready</span>'), ['76% ready']);
  assert.deepEqual(textFigures('<b>{0.76}</b>'), ['0.76']);
  assert.deepEqual(textFigures("<b>{'1.35'}</b>"), ["'1.35'"]);
  assert.deepEqual(textFigures('<svg viewBox="0 0 24 16"><rect width="24" /></svg>'), []);
  assert.deepEqual(textFigures('<div style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} size={18} />'), []);
  assert.deepEqual(textFigures('{items.length > 0 && <p>x</p>}'), []);
});

test('Trentar UI files type no figures into JSX text', () => {
  assert.ok(UI.length >= 8, `scan found only ${UI.length} files`);
  for (const f of UI) {
    assert.deepEqual(textFigures(readFileSync(f, 'utf8')), [], relative(ROOT, f));
  }
});

test('Trentar UI never imports raw ontology nodes', () => {
  for (const f of UI) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /from\s+['"][^'"]*lib\/trentar\/(ontology|registry)(\.js)?['"]/, relative(ROOT, f));
  }
});

// The cockpit has no runtime dependency on the generated ontology. Follow
// every import from every cockpit UI file (relative and '@/' paths, through
// lib and data) and fail if the ontology, its evidence register or the
// registry built on them is reachable.
const FORBIDDEN = ['lib/trentar/ontology.js', 'lib/trentar/evidence.js', 'lib/trentar/registry.js'];
function resolveImport(from, spec) {
  let base;
  if (spec.startsWith('@/')) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) base = join(from, '..', spec);
  else return null; // a package, not ours
  for (const cand of [base, `${base}.js`, `${base}.jsx`, `${base}.mjs`, join(base, 'index.js'), join(base, 'index.jsx')]) {
    try { if (statSync(cand).isFile()) return cand; } catch { /* next */ }
  }
  return null;
}
export function reachable(entries) {
  const seen = new Set();
  const stack = [...entries];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    const src = stripComments(readFileSync(f, 'utf8'));
    for (const m of src.matchAll(/(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g)) {
      const r = resolveImport(f, m[1]);
      if (r) stack.push(r);
    }
  }
  return [...seen].map((f) => relative(ROOT, f).split('\\').join('/'));
}

test('no cockpit component reaches ontology.js, evidence.js or the registry, directly or through lib', () => {
  const graph = reachable(UI);
  assert.ok(graph.includes('lib/trentar/view.js'), 'walk should reach the view layer');
  assert.ok(graph.includes('data/cockpit/trentar.js'), 'walk should reach the curated content');
  for (const f of FORBIDDEN) assert.ok(!graph.includes(f), `${f} is reachable from the cockpit UI`);
});
