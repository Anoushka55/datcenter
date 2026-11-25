// lib/trentar/estate.js — the estate knowledge graph view model.
//
// Reads lib/trentar/estate-ontology.js only (the Trentar Estate Ontology: what
// exists in a data centre estate and how it connects). It does not read the
// FID decision model (ontology.js). Counts reach the screen as claims, like
// every other figure in the cockpit; definitions, formulas and rule
// statements are model text and render as text.
import { claim } from './claim.js';
import * as E from './estate-ontology.js';

export const { metrics, rules, domains } = E;

/** The five headings the 28 domains sit under, in reading order. */
export const ESTATE_GROUPS = [
  { id: 'land', label: 'Land and buildings', domains: ['ESTATE', 'SITE', 'BUILDING', 'SPACE', 'WHITESPACE'] },
  { id: 'facility', label: 'Facility', domains: ['GRID', 'POWER', 'BACKUP', 'COOLING', 'WATER', 'MECHANICAL'] },
  { id: 'it', label: 'IT and applications', domains: ['NETWORK', 'COMPUTE', 'STORAGE', 'PLATFORM', 'APPLICATION', 'SERVICE', 'DATA'] },
  { id: 'running', label: 'Running it', domains: ['TELEMETRY', 'OPERATIONS', 'MAINTENANCE', 'CHANGE', 'CAPACITY', 'TWIN'] },
  { id: 'business', label: 'Business', domains: ['COMMERCIAL', 'SUSTAIN', 'ORG', 'SECURITY'] },
];

const BASIS = (what) => `Count of ${what} in the Trentar Estate Ontology (lib/trentar/estate-ontology.js).`;
const count = (id, label, value, unit, what) => claim({ id, label, value, unit, basis: BASIS(what), provenance: 'EAIQ_ANALYSIS' });

const domainById = new Map(E.domains.map((d) => [d.id, d]));
const byDomain = E.classesByDomain();

let coverageCache;
/** The counter strip: domains, classes, relations, attributes, metrics. */
export function estateCoverage() {
  if (coverageCache) return coverageCache;
  const c = E.coverage();
  coverageCache = [
    { key: 'domains', claim: count('t.e.domains', 'Domains', c.domains, 'domains', 'domains') },
    { key: 'classes', claim: count('t.e.classes', 'Classes', c.classes, 'classes', 'classes') },
    { key: 'relations', claim: count('t.e.relations', 'Relations', c.relations, 'relations', 'relation types') },
    { key: 'attributes', claim: count('t.e.attributes', 'Attributes', c.attributes, 'attributes', 'attributes') },
    { key: 'metrics', claim: count('t.e.metrics', 'Metrics', c.metrics, 'metrics', 'metrics') },
  ];
  return coverageCache;
}

const tiles = new Map();
/** A domain tile: name, scope line, and its class count as a claim. */
export function domainTile(id) {
  if (tiles.has(id)) return tiles.get(id);
  const d = domainById.get(id);
  if (!d) throw new Error(`Unknown estate domain "${id}"`);
  const n = (byDomain[id] ?? []).length;
  const t = { id, label: d.label, scope: d.scope, classes: count(`t.e.dom.${id}`, `${d.label} classes`, n, n === 1 ? 'class' : 'classes', `classes in the ${d.label} domain`) };
  tiles.set(id, t);
  return t;
}

/**
 * A domain's classes as an indented list: each root, then its children,
 * depth-first, with definition and attributes.
 */
export function domainTree(id) {
  const inDomain = byDomain[id] ?? [];
  const ids = new Set(inDomain.map((c) => c.id));
  const kids = new Map();
  for (const c of inDomain) {
    const p = c.parent && ids.has(c.parent) ? c.parent : null;
    if (!kids.has(p)) kids.set(p, []);
    kids.get(p).push(c);
  }
  const out = [];
  const walk = (parent, depth) => {
    for (const c of kids.get(parent) ?? []) {
      out.push({ ...c, depth, attributes: E.attributesOf(c.id) });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/** Path from the domain root to a class, as labels. */
export function breadcrumb(classId) {
  const trail = [];
  for (let c = E.getClass(classId); c; c = c.parent ? E.getClass(c.parent) : null) trail.unshift(c.label);
  return trail;
}

/** Case-insensitive search across every class: label, synonyms, definition. */
export function searchClasses(q, limit = 60) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const hit = (c) => c.label.toLowerCase().includes(s) || (c.synonyms ?? '').toLowerCase().includes(s) || (c.definition ?? '').toLowerCase().includes(s);
  const rank = (c) => (c.label.toLowerCase().startsWith(s) ? 0 : c.label.toLowerCase().includes(s) ? 1 : 2);
  return E.classes.filter(hit).sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label)).slice(0, limit)
    .map((c) => ({ ...c, domainLabel: domainById.get(c.domain)?.label ?? c.domain, trail: breadcrumb(c.id), attributes: E.attributesOf(c.id) }));
}

export const domainLabel = (id) => domainById.get(id)?.label ?? id;

// ---------------------------------------------------------------------------
// Graph model for the full view.
//
//   nodes  the 28 domains (hubs) and the 619 classes
//   links  domain -> root class, parent -> child ("kind of"), and relationship
//          edges taken from the ontology's paths: each path is a chain of
//          class names joined by relation ids, and every consecutive pair
//          whose names resolve to classes becomes an edge labelled with that
//          relation. Names are resolved by label, synonym, plural or
//          acronym ("PDU" -> Power distribution unit); a step that resolves to
//          no class is skipped, never guessed.
// ---------------------------------------------------------------------------
const groupOf = Object.fromEntries(ESTATE_GROUPS.flatMap((g) => g.domains.map((d) => [d, g.id])));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const acronym = (s) => norm(s).split(' ').filter((w) => !['and', 'of', 'or', 'the', 'to'].includes(w)).map((w) => w[0]).join('');

let classIndex;
function resolveStep(text) {
  if (!classIndex) {
    classIndex = new Map();
    const put = (k, c) => { if (k && !classIndex.has(k)) classIndex.set(k, c); };
    for (const c of E.classes) {
      for (const k of [c.label, ...(c.synonyms ? c.synonyms.split(/[,;]/) : [])]) { put(norm(k), c); put(`${norm(k)}s`, c); }
    }
    for (const c of E.classes) { const a = acronym(c.label); if (a.length >= 3) put(a, c); }
  }
  for (const part of text.split(/\bor\b/i)) {
    const c = classIndex.get(norm(part));
    if (c) return c;
  }
  return null;
}

/** Depth below the domain: top-level classes are 0. */
function depthOf(id) { let d = 0; for (let c = E.getClass(id); c && c.parent; c = E.getClass(c.parent)) d++; return d; }

let graphCache;
/** Nodes, links and the resolved paths for the force-directed full view. */
export function estateGraph() {
  if (graphCache) return graphCache;
  const nodes = [
    ...E.domains.map((d) => ({ id: `dom:${d.id}`, kind: 'domain', label: d.label, domain: d.id, group: groupOf[d.id], scope: d.scope })),
    ...E.classes.map((c) => ({ id: c.id, kind: 'class', label: c.label, domain: c.domain, group: groupOf[c.domain], parent: c.parent, root: !c.parent, depth: depthOf(c.id) })),
  ];
  const links = [];
  for (const c of E.classes) {
    if (c.parent) links.push({ source: c.parent, target: c.id, kind: 'subclass' });
    else links.push({ source: `dom:${c.domain}`, target: c.id, kind: 'domain' });
  }
  const seen = new Map();
  const resolvedPaths = E.paths.map((p) => {
    const chain = [];
    for (let i = 0; i < p.steps.length; i += 2) chain.push({ text: p.steps[i], cls: resolveStep(p.steps[i]), relation: p.steps[i + 1] ?? null });
    // Join each resolved class to the next resolved class in the chain. Where
    // generic steps sit between them ("device", "asset"), the edge is kept and
    // says so: "hosted on (via device)". Nothing is invented: the relation is
    // the path's own, and the skipped steps are named.
    const edges = [];
    for (let i = 0; i < chain.length; i++) {
      const a = chain[i];
      if (!a.cls) continue;
      let j = i + 1;
      const via = [];
      while (j < chain.length && !chain[j].cls) { via.push({ text: chain[j].text, relation: chain[j].relation }); j++; }
      if (j >= chain.length) break;
      const b = chain[j];
      if (a.cls.id === b.cls.id || via.length > 2) continue;
      const key = `${a.cls.id}|${a.relation}|${b.cls.id}`;
      if (!seen.has(key)) {
        const link = { source: a.cls.id, target: b.cls.id, kind: 'relation', relation: a.relation, via, paths: [] };
        seen.set(key, link);
        links.push(link);
      }
      seen.get(key).paths.push(p.id);
      edges.push(key);
    }
    return { id: p.id, label: p.label, answers: p.answers, steps: p.steps, chain, edges, nodeIds: [...new Set(chain.filter((s) => s.cls).map((s) => s.cls.id))] };
  });
  graphCache = { nodes, links, paths: resolvedPaths };
  return graphCache;
}

const relationById = new Map(E.relations.map((r) => [r.id, r]));
export const relationLabel = (id) => relationById.get(id)?.label ?? id.replace(/_/g, ' ');

/** An edge's relation as read along its path: "exhausts to → heat rejection → water supplied by". */
export const edgeLabel = (relation, via = []) =>
  [relationLabel(relation), ...via.flatMap((v) => [v.text, relationLabel(v.relation)])].join(' → ');

/**
 * What a class touches: classes it reaches through relationships within two
 * steps (either direction), the questions its paths answer, and where it sits
 * (parent and siblings). Read from the ontology only; nothing is scored.
 */
export function nodeImpact(id) {
  const g = estateGraph();
  if (id.startsWith('dom:')) return { reach: [], answers: [], siblings: [], descendants: [], metrics: E.metrics.filter((m) => m.domain === id.slice(4)), rules: [], inheritedFrom: null, domainMetrics: [] };
  const rel = g.links.filter((l) => l.kind === 'relation');
  const end = (x) => (typeof x === 'object' ? x.id : x);
  const seen = new Set([id]);
  const reach = [];
  let frontier = [id];
  for (let hop = 1; hop <= 2; hop++) {
    const next = [];
    for (const x of frontier) {
      for (const l of rel) {
        const s = end(l.source); const t = end(l.target);
        const o = s === x ? t : t === x ? s : null;
        if (!o || seen.has(o)) continue;
        seen.add(o); next.push(o);
        reach.push({ cls: E.getClass(o), hop, through: hop > 1 ? E.getClass(x) : null });
      }
    }
    frontier = next;
  }
  const c = E.getClass(id);
  const siblings = E.classes.filter((x) => x.id !== id && x.domain === c.domain && (x.parent ?? null) === (c.parent ?? null));
  const descendants = [];
  const walk = (p) => { for (const k of E.childrenOf(p)) { descendants.push(k); walk(k.id); } };
  walk(id);
  const answers = g.paths.filter((p) => p.nodeIds.includes(id)).map((p) => ({ id: p.id, label: p.label, answers: p.answers }));
  // Metrics and rules that name this class (label or synonym) in their text.
  // A class none of them name borrows from its nearest ancestor that is named,
  // and says so (inheritedFrom). The domain's own metrics are the last resort.
  let own = mentions(c);
  let inheritedFrom = null;
  for (let p = c.parent ? E.getClass(c.parent) : null; p && !own.metrics.length && !own.rules.length; p = p.parent ? E.getClass(p.parent) : null) {
    const m = mentions(p);
    if (m.metrics.length || m.rules.length) { own = m; inheritedFrom = p; }
  }
  const domainMetrics = own.metrics.length ? [] : E.metrics.filter((m) => m.domain === c.domain);
  return { reach, answers, siblings, descendants, metrics: own.metrics, rules: own.rules, inheritedFrom, domainMetrics };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function mentions(c) {
  const terms = [c.label, ...(c.synonyms ? c.synonyms.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [])];
  const re = new RegExp(`\\b(${terms.map(escapeRe).join('|')})s?\\b`, 'i');
  return {
    metrics: E.metrics.filter((m) => re.test(`${m.label} ${m.formula} ${m.usedFor ?? ''}`)),
    rules: E.rules.filter((r) => re.test(`${r.label} ${r.statement}`)),
  };
}

/** Everything the side panel shows for a node. */
export function nodeDetail(id) {
  const g = estateGraph();
  if (id.startsWith('dom:')) {
    const d = id.slice(4);
    return { kind: 'domain', id, label: domainLabel(d), domain: d, scope: domainById.get(d)?.scope, tile: domainTile(d), roots: (byDomain[d] ?? []).filter((c) => !c.parent) };
  }
  const c = E.getClass(id);
  const rel = g.links.filter((l) => l.kind === 'relation');
  const end = (x) => (typeof x === 'object' ? x.id : x);
  return {
    kind: 'class', id, label: c.label, domain: c.domain, domainLabel: domainLabel(c.domain), definition: c.definition, synonyms: c.synonyms,
    trail: breadcrumb(id), parent: c.parent ? E.getClass(c.parent) : null, children: E.childrenOf(id), attributes: E.attributesOf(id),
    out: rel.filter((l) => end(l.source) === id).map((l) => ({ relation: l.relation, via: l.via, other: E.getClass(end(l.target)) })),
    in: rel.filter((l) => end(l.target) === id).map((l) => ({ relation: l.relation, via: l.via, other: E.getClass(end(l.source)) })),
    paths: g.paths.filter((p) => p.nodeIds.includes(id)),
  };
}
