'use client';
// Estate knowledge graph, full view: the whole Trentar Estate Ontology as a
// force-directed graph (react-force-graph-2d, d3 forces; both already in the
// project). 28 domain hubs, 619 classes clustered by the five groups, the
// class hierarchy as faint "kind of" edges, and the ontology's relationship
// paths as animated arrows. Click a node for its relationship map; pick a
// path to light its chain across the estate.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { forceX, forceY, forceCollide } from 'd3';
import { ArrowLeft, Search, Scan, ArrowRight, X, Maximize2, Minimize2 } from 'lucide-react';
import { ESTATE_GROUPS, estateGraph, nodeDetail, nodeImpact, edgeLabel, searchClasses } from '@/lib/trentar/estate';
import ClaimValue from '../ClaimValue';
import { kpmg } from '../tokens';

// SSR-safe: the graph needs the browser canvas (same pattern as the ontology page).
const ForceGraph2D = typeof window !== 'undefined' ? require('react-force-graph-2d').default : null;

const HUE = { land: '#9D8CFF', facility: '#2BC8F5', it: '#5B9BFF', running: '#19D3C5', business: '#C9A8FF' };
// Relationships: glowing silver on the canvas, cobalt on the white panel.
const SILVER = '#E4ECF8';
const REL = kpmg.cobalt;
const REL_TEXT = '#BFD8FF';
const LINKED = '#7FD4FF';
const BG = 'radial-gradient(ellipse at 50% 40%, #0E2A66 0%, #081A44 45%, #040D26 100%)';
const ANCHOR_R = 660;
const CARD_W = 400;
const anchors = Object.fromEntries(ESTATE_GROUPS.map((g, i) => {
  const a = (i / ESTATE_GROUPS.length) * Math.PI * 2 - Math.PI / 2;
  return [g.id, { x: Math.cos(a) * ANCHOR_R, y: Math.sin(a) * ANCHOR_R * 0.72 }];
}));
const SEARCH_LIMIT = 8;
// Level of detail: the deeper a class sits under its domain, the closer you
// must zoom to see it. Relationship endpoints, the selection's neighbourhood
// and a highlighted path are always shown.
const LEVELS = [
  { maxDepth: 1, minZoom: 0, label: 'Domains and their main classes' },
  { maxDepth: 2, minZoom: 1.4, label: 'Third-level classes' },
  { maxDepth: 9, minZoom: 2.4, label: 'Every class' },
];
// Node size: a graph-space size when zoomed in, but never below a screen
// size, so when zoomed out the class dots stay visible next to the domain
// rings (domains about twice a class, not five times).
const nodeRadius = (n, scale) => (n.kind === 'domain'
  ? Math.max(9, 7 / scale)
  : Math.max(n.root ? 4.2 : 2.8, (n.root ? 4.6 : 3.6) / scale));
const levelFor = (k) => LEVELS.reduce((acc, l, i) => (k >= l.minZoom ? i : acc), 0);
const end = (x) => (typeof x === 'object' ? x.id : x);

function useSize(ref) {
  const [size, setSize] = useState({ w: 800, h: 600 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function Chip({ children, onClick, hue, title }) {
  return (
    <button type="button" onClick={onClick} title={title} className="inline-flex items-center gap-1 rounded-full hover:brightness-95"
      style={{ fontSize: 12.5, fontWeight: 600, padding: '3px 10px', background: '#F1F5FB', border: `1px solid ${hue ?? '#D5E0F0'}`, color: kpmg.ink }}>
      {children}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 16 }}>
      <h4 className="uppercase" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8, color: kpmg.cobalt, marginBottom: 6 }}>{title}</h4>
      {children}
    </section>
  );
}

function Legend({ paths, activePath, setActivePath }) {
  return (
    <>
      <h3 style={{ fontSize: 19, fontWeight: 650, color: kpmg.ink }}>Reading the graph</h3>
      <ul className="flex flex-col gap-1.5" style={{ marginTop: 10, fontSize: 13.5, color: kpmg.ink2 }}>
        {ESTATE_GROUPS.map((g) => (
          <li key={g.id} className="flex items-center gap-2"><span className="inline-block rounded-full" style={{ width: 11, height: 11, background: HUE[g.id], boxShadow: `0 0 8px ${HUE[g.id]}` }} />{g.label}</li>
        ))}
        <li className="flex items-center gap-2" style={{ marginTop: 4 }}><span className="inline-block rounded-full" style={{ width: 16, height: 16, border: '2px solid #5B9BFF', background: '#0E2A66' }} />Large rings are the domains</li>
        <li className="flex items-center gap-2"><span className="inline-block" style={{ width: 22, height: 2, background: '#9FB6E8', opacity: 0.6 }} />Faint lines: “is a kind of”</li>
        <li className="flex items-center gap-2"><span className="inline-block rounded-full" style={{ width: 22, height: 3, background: '#AFC0DA', boxShadow: '0 0 6px #AFC0DA' }} />Glowing silver lines: relationships from the ontology’s paths</li>
        <li style={{ marginTop: 4, color: kpmg.muted }}>Hover a node for a preview; click to pin it.</li>
      </ul>
      <Section title="Relationship paths">
        <p style={{ fontSize: 13, color: kpmg.ink2, marginBottom: 8 }}>Pick one to light its chain across the estate.</p>
        <ul className="flex flex-col gap-1.5">
          {paths.map((p) => {
            const on = p.id === activePath;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => setActivePath(on ? null : p.id)} className="w-full text-left rounded-lg hover:bg-slate-50"
                  style={{ padding: '7px 10px', border: `1px solid ${on ? REL : '#E2E9F2'}`, background: on ? '#EEF3FE' : '#FFFFFF' }}>
                  <span className="block" style={{ fontSize: 13.5, fontWeight: 650, color: kpmg.ink }}>{p.label}</span>
                  {on && <span className="block" style={{ fontSize: 12.5, color: kpmg.ink2, marginTop: 3 }}>{p.answers}</span>}
                  {on && <span className="block" style={{ fontSize: 12, color: REL, marginTop: 4 }}>{p.chain.map((s) => s.text).join(' → ')}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}

function Detail({ id, onSelect, setActivePath }) {
  const d = nodeDetail(id);
  const group = ESTATE_GROUPS.find((g) => g.domains.includes(d.domain))?.id;
  if (d.kind === 'domain') {
    return (
      <>
        <span className="inline-flex rounded-full" style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', color: '#FFFFFF', background: HUE[group] }}>Domain</span>
        <h3 style={{ fontSize: 22, fontWeight: 650, color: kpmg.ink, marginTop: 8 }}>{d.label}</h3>
        <p style={{ fontSize: 14, color: kpmg.ink2, marginTop: 4 }}>{d.scope}</p>
        <p style={{ fontSize: 13.5, color: kpmg.cobalt, marginTop: 6, fontWeight: 600 }}><ClaimValue claim={d.tile.classes} variant="inline" /></p>
        <Section title="Top-level classes">
          <div className="flex flex-wrap gap-1.5">{d.roots.map((c) => <Chip key={c.id} hue={HUE[group]} onClick={() => onSelect(c.id)}>{c.label}</Chip>)}</div>
        </Section>
      </>
    );
  }
  return (
    <>
      <button type="button" onClick={() => onSelect(`dom:${d.domain}`)} className="inline-flex rounded-full hover:brightness-110" style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', color: '#FFFFFF', background: HUE[group] }}>{d.domainLabel}</button>
      <h3 style={{ fontSize: 22, fontWeight: 650, color: kpmg.ink, marginTop: 8, lineHeight: 1.2 }}>{d.label}</h3>
      <p style={{ fontSize: 12.5, color: kpmg.cobalt, marginTop: 3 }}>{d.trail.join(' › ')}</p>
      <p style={{ fontSize: 14.5, color: kpmg.ink2, marginTop: 8, lineHeight: 1.5 }}>{d.definition}</p>
      {d.synonyms && <p style={{ fontSize: 13, color: kpmg.muted, marginTop: 4 }}>Also called {d.synonyms}</p>}

      {(d.out.length > 0 || d.in.length > 0) && (
        <Section title="Relationships">
          <ul className="flex flex-col gap-1.5">
            {d.out.map((r) => (
              <li key={`o${r.relation}${r.other.id}`} className="rounded-lg" style={{ padding: '7px 10px', background: '#EEF3FE', border: '1px solid #C9D8F7', fontSize: 13.5 }}>
                <span style={{ fontWeight: 650, color: kpmg.ink }}>{d.label}</span>
                <span style={{ color: kpmg.ink2 }}> {edgeLabel(r.relation, r.via)} </span>
                <button type="button" onClick={() => onSelect(r.other.id)} className="hover:underline" style={{ fontWeight: 650, color: kpmg.cobalt }}>{r.other.label}</button>
              </li>
            ))}
            {d.in.map((r) => (
              <li key={`i${r.relation}${r.other.id}`} className="rounded-lg" style={{ padding: '7px 10px', background: '#F4F7FD', border: '1px solid #DCE5F3', fontSize: 13.5 }}>
                <button type="button" onClick={() => onSelect(r.other.id)} className="hover:underline" style={{ fontWeight: 650, color: kpmg.cobalt }}>{r.other.label}</button>
                <span style={{ color: kpmg.ink2 }}> {edgeLabel(r.relation, r.via)} </span>
                <span style={{ fontWeight: 650, color: kpmg.ink }}>{d.label}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Hierarchy">
        <div className="flex flex-col gap-2" style={{ fontSize: 13.5, color: kpmg.ink2 }}>
          <div className="flex items-center gap-2 flex-wrap">Kind of {d.parent ? <Chip hue={HUE[group]} onClick={() => onSelect(d.parent.id)}>{d.parent.label}</Chip> : <Chip hue={HUE[group]} onClick={() => onSelect(`dom:${d.domain}`)}>{d.domainLabel}</Chip>}</div>
          {d.children.length > 0 && <div className="flex items-center gap-1.5 flex-wrap">Kinds: {d.children.map((c) => <Chip key={c.id} hue={HUE[group]} onClick={() => onSelect(c.id)}>{c.label}</Chip>)}</div>}
        </div>
      </Section>

      {d.attributes.length > 0 && (
        <Section title="Attributes">
          <ul className="flex flex-col gap-1">
            {d.attributes.map((a) => (
              <li key={a.id} style={{ fontSize: 13.5, color: kpmg.ink }}>
                <span style={{ fontWeight: 650 }}>{a.label}</span>
                <span style={{ color: kpmg.muted }}> {a.datatype.replace(/^enum:/, 'one of ')}{a.unit ? `, ${a.unit}` : ''}{a.required ? ', required' : ''}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {d.paths.length > 0 && (
        <Section title="Appears in paths">
          <div className="flex flex-col gap-1.5">
            {d.paths.map((p) => (
              <button key={p.id} type="button" onClick={() => setActivePath(p.id)} className="text-left rounded-lg hover:bg-blue-50 inline-flex items-center gap-2"
                style={{ fontSize: 13.5, padding: '6px 10px', border: '1px solid #C9D8F7', color: kpmg.ink }}>
                <ArrowRight size={14} style={{ color: REL }} aria-hidden />{p.label}
              </button>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

const MAX_RELS = 4;
const MAX_REACH = 6;
const MAX_NAMES = 5;
const CardLabel = ({ children, color = REL_TEXT }) => (
  <p className="uppercase" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color }}>{children}</p>
);

// Dark glass card beside a node. Hovering shows it as a preview; clicking pins
// it (then names inside it are clickable and the close button appears).
function InfoCard({ id, pinned, onClose, onSelect }) {
  const d = nodeDetail(id);
  const imp = nodeImpact(id);
  const group = ESTATE_GROUPS.find((g) => g.domains.includes(d.domain))?.id;
  const hue = HUE[group] ?? SILVER;
  const rels = d.kind === 'class' ? [
    ...d.out.map((r) => ({ key: `o${r.relation}${r.other.id}`, from: d.label, rel: edgeLabel(r.relation, r.via), to: r.other, dir: 'out' })),
    ...d.in.map((r) => ({ key: `i${r.relation}${r.other.id}`, from: r.other, rel: edgeLabel(r.relation, r.via), to: d.label, dir: 'in' })),
  ] : [];
  const far = imp.reach.filter((r) => r.through);
  const link = (c) => (pinned
    ? <button type="button" onClick={() => onSelect(c.id)} className="hover:underline" style={{ fontWeight: 650, color: LINKED }}>{c.label}</button>
    : <span style={{ fontWeight: 650, color: LINKED }}>{c.label}</span>);
  const names = (list) => (
    <>{list.slice(0, MAX_NAMES).map((c, i) => <span key={c.id}>{i > 0 && ', '}{link(c)}</span>)}{list.length > MAX_NAMES && ' and more'}</>
  );
  return (
    <div className="rounded-2xl" style={{ background: 'linear-gradient(160deg, rgba(14,34,82,0.95), rgba(5,14,40,0.95))', border: `1px solid ${hue}`, boxShadow: `0 14px 44px rgba(0,0,0,0.5), 0 0 26px ${hue}40`, padding: '15px 17px', backdropFilter: 'blur(10px)', color: '#E8F0FF' }}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full" style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', color: '#06173F', background: hue }}>{d.kind === 'domain' ? 'Domain' : d.domainLabel}</span>
          <h4 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginTop: 6, lineHeight: 1.2 }}>{d.label}</h4>
          {d.kind === 'class' && <p style={{ fontSize: 12, color: '#9FC3FF', marginTop: 2 }}>{d.trail.join(' › ')}</p>}
        </div>
        {pinned
          ? <button type="button" onClick={onClose} aria-label="Close" className="rounded-full hover:bg-white/10" style={{ padding: 4, color: '#BFD2F5' }}><X size={16} /></button>
          : <span style={{ fontSize: 11, color: '#8FA9D6', whiteSpace: 'nowrap', marginTop: 3 }}>Click to pin</span>}
      </div>

      <div style={{ marginTop: 11 }}><CardLabel>Definition</CardLabel></div>
      <p style={{ fontSize: 14, color: '#E0EAFF', lineHeight: 1.5, marginTop: 3 }}>{d.kind === 'domain' ? d.scope : d.definition}</p>
      {d.kind === 'class' && d.synonyms && <p style={{ fontSize: 12.5, color: '#9FB6E0', marginTop: 3 }}>Also called {d.synonyms}</p>}

      {d.kind === 'class' && (
        <div style={{ marginTop: 11 }}>
          <CardLabel>Relationships</CardLabel>
          {rels.length ? (
            <ul className="flex flex-col gap-1" style={{ marginTop: 4 }}>
              {rels.slice(0, MAX_RELS).map((r) => (
                <li key={r.key} style={{ fontSize: 13.5, lineHeight: 1.4 }}>
                  {r.dir === 'out' ? <span style={{ fontWeight: 650, color: '#FFFFFF' }}>{r.from}</span> : link(r.from)}
                  <span style={{ color: '#C9D6EC', fontStyle: 'italic' }}> {r.rel} </span>
                  {r.dir === 'out' ? link(r.to) : <span style={{ fontWeight: 650, color: '#FFFFFF' }}>{r.to}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 13.5, color: '#C9D6EC', marginTop: 3, lineHeight: 1.45 }}>
              {d.parent ? <>Kind of {link(d.parent)}</> : <>Top-level class in {d.domainLabel}</>}
              {imp.siblings.length > 0 && <>, alongside {names(imp.siblings)}</>}.
              <span style={{ color: '#8FA9D6' }}> No relationship path in the ontology runs through it yet.</span>
            </p>
          )}
        </div>
      )}

      {(d.kind === 'domain' ? imp.metrics.length : true) && (
        <div className="rounded-xl" style={{ marginTop: 11, padding: '9px 11px', background: 'rgba(127,212,255,0.08)', border: '1px solid rgba(127,212,255,0.25)' }}>
          <CardLabel color={LINKED}>Impact</CardLabel>
          {imp.inheritedFrom && (
            <p style={{ fontSize: 12.5, color: '#9FB6E0', marginTop: 3 }}>Through its parent {link(imp.inheritedFrom)}:</p>
          )}
          {imp.answers.slice(0, 2).map((a) => (
            <p key={a.id} style={{ fontSize: 13, color: '#E0EAFF', marginTop: 4, lineHeight: 1.4 }}>Helps answer: <span style={{ fontWeight: 600 }}>{a.answers}</span></p>
          ))}
          {imp.metrics.slice(0, 2).map((m) => (
            <p key={m.id} style={{ fontSize: 13, color: '#E0EAFF', marginTop: 4, lineHeight: 1.4 }}>
              {d.kind === 'domain' ? 'Measured by' : 'Feeds the metric'} <span style={{ fontWeight: 650, color: '#FFFFFF' }}>{m.label}</span>
              <span style={{ color: '#9FB6E0' }}> ({m.formula})</span>{m.usedFor && <span style={{ color: '#C9D6EC' }}>, used for {m.usedFor.replace(/\.$/, '').replace(/^./, (x) => x.toLowerCase())}</span>}.
            </p>
          ))}
          {imp.rules.slice(0, 1).map((r) => (
            <p key={r.id} style={{ fontSize: 13, color: '#E0EAFF', marginTop: 4, lineHeight: 1.4 }}>Governed by the rule <span style={{ fontWeight: 650, color: '#FFFFFF' }}>{r.label}</span>.</p>
          ))}
          {far.length > 0 && (
            <p style={{ fontSize: 13, color: '#C9D6EC', marginTop: 4, lineHeight: 1.4 }}>A change here ripples on to {names(far.slice(0, MAX_REACH).map((r) => r.cls))}.</p>
          )}
          {imp.descendants.length > 0 && (
            <p style={{ fontSize: 13, color: '#C9D6EC', marginTop: 4, lineHeight: 1.4 }}>Carries down to its kinds: {names(imp.descendants)}.</p>
          )}
          {!imp.metrics.length && imp.domainMetrics.length > 0 && (
            <p style={{ fontSize: 13, color: '#C9D6EC', marginTop: 4, lineHeight: 1.4 }}>Its domain is measured by {imp.domainMetrics.slice(0, 3).map((m) => m.label).join(', ')}.</p>
          )}
          {!imp.metrics.length && !imp.rules.length && !imp.answers.length && !far.length && !imp.descendants.length && !imp.domainMetrics.length && (
            <p style={{ fontSize: 13, color: '#8FA9D6', marginTop: 4 }}>No metric, rule or path in the ontology names it yet.</p>
          )}
        </div>
      )}

      {d.kind === 'class' && rels.length > 0 && d.parent && (
        <p style={{ marginTop: 10, fontSize: 13, color: '#BFD2F5' }}>Kind of {link(d.parent)}</p>
      )}
      {d.kind === 'domain' && (
        <p style={{ marginTop: 10, fontSize: 13.5, color: '#C9D6EC' }}>Top-level classes: {names(d.roots)}</p>
      )}
      {d.kind === 'class' && d.attributes.length > 0 && (
        <p style={{ marginTop: 8, fontSize: 12.5, color: '#9FC3FF' }}>Attributes: {d.attributes.map((a) => a.label).join(', ')}</p>
      )}
    </div>
  );
}

export default function EstateGraph({ onBack }) {
  const data = useMemo(() => {
    const g = estateGraph();
    // react-force-graph mutates its data; give it its own copy
    return { nodes: g.nodes.map((n) => ({ ...n })), links: g.links.map((l) => ({ ...l })) };
  }, []);
  const paths = estateGraph().paths;
  const fg = useRef(null);
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [hidden, setHidden] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const fitted = useRef(false);
  const [level, setLevel] = useState(0);
  const card = useRef(null);
  const [cardOpen, setCardOpen] = useState(false);
  const root = useRef(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.()?.catch?.(() => {});
    else root.current?.requestFullscreen?.()?.catch?.(() => {}); // refused (e.g. embedded without permission): stay in the panel
  }, []);
  // The card follows the hovered node as a preview, else the pinned selection.
  const cardId = hover ?? (cardOpen ? selected : null);
  const cardPinned = cardId != null && cardId === selected && cardOpen;

  const adjacency = useMemo(() => {
    const m = new Map();
    for (const l of data.links) {
      const s = end(l.source); const t = end(l.target);
      if (!m.has(s)) m.set(s, new Set());
      if (!m.has(t)) m.set(t, new Set());
      m.get(s).add(t); m.get(t).add(s);
    }
    return m;
  }, [data]);

  const pathSet = useMemo(() => {
    const p = paths.find((x) => x.id === activePath);
    if (!p) return null;
    return { nodes: new Set(p.nodeIds), edges: new Set(p.edges) };
  }, [activePath, paths]);

  const focusId = hover ?? selected;
  const focusSet = useMemo(() => {
    if (!focusId) return null;
    return new Set([focusId, ...(adjacency.get(focusId) ?? [])]);
  }, [focusId, adjacency]);

  // Cluster the five groups around their own anchors; hubs push harder.
  useEffect(() => {
    const g = fg.current;
    if (!g) return;
    // Spread out: stronger repulsion, longer links and a collision radius so
    // labels have room, while the groups still hold their own region.
    g.d3Force('charge').strength((n) => (n.kind === 'domain' ? -700 : -60)).distanceMax(520);
    g.d3Force('link').distance((l) => (l.kind === 'relation' ? 140 : l.kind === 'domain' ? 60 : 30)).strength((l) => (l.kind === 'relation' ? 0.03 : 0.75));
    g.d3Force('collide', forceCollide((n) => (n.kind === 'domain' ? 48 : n.root ? 12 : 8)).strength(0.9));
    g.d3Force('x', forceX((n) => anchors[n.group]?.x ?? 0).strength(0.045));
    g.d3Force('y', forceY((n) => anchors[n.group]?.y ?? 0).strength(0.045));
    g.d3ReheatSimulation();
  }, [w]);

  const focusNode = useCallback((id) => {
    setSelected(id);
    setCardOpen(true);
    fitted.current = true; // the reader has chosen a node: do not refit over it
    const n = data.nodes.find((x) => x.id === id);
    if (n && fg.current && Number.isFinite(n.x)) {
      fg.current.centerAt(n.x, n.y, 700);
      fg.current.zoom(n.kind === 'domain' ? 2.0 : 3.2, 700);
    }
  }, [data]);

  const relationEnds = useMemo(() => new Set(data.links.filter((l) => l.kind === 'relation').flatMap((l) => [end(l.source), end(l.target)])), [data]);
  const visible = useCallback((n) => {
    if (hidden.has(n.group)) return false;
    if (n.kind === 'domain') return true;
    if (n.depth <= LEVELS[level].maxDepth) return true;
    return relationEnds.has(n.id) || (focusSet && focusSet.has(n.id)) || (pathSet && pathSet.nodes.has(n.id));
  }, [hidden, level, relationEnds, focusSet, pathSet]);
  const nodeById = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data]);

  // Keep the info card pinned beside its node through zoom, pan and layout.
  const placeCard = useCallback(() => {
    const el = card.current; const g = fg.current;
    if (!el || !g || !cardId) return;
    const n = nodeById.get(cardId);
    if (!n || !Number.isFinite(n.x)) return;
    const pt = g.graph2ScreenCoords(n.x, n.y);
    // right of the node, or left of it when there is no room on the right
    const gap = Math.max(34, n.label.length * 3.4 + 12); // clear of the node's own label
    const left = pt.x + gap + CARD_W < w - 12 ? pt.x + gap : Math.max(12, pt.x - gap - CARD_W);
    const top = Math.min(Math.max(pt.y - 40, 64), h - el.offsetHeight - 12);
    el.style.transform = `translate(${left}px, ${top}px)`;
  }, [cardId, nodeById, w, h]);
  useLayoutEffect(() => { placeCard(); }, [placeCard]);

  const drawNode = useCallback((n, ctx, scale) => {
    const lit = (pathSet && pathSet.nodes.has(n.id)) || (focusSet && focusSet.has(n.id));
    const dim = (pathSet && !pathSet.nodes.has(n.id) && !(focusSet && focusSet.has(n.id))) || (!pathSet && focusSet && !focusSet.has(n.id));
    const hue = HUE[n.group] ?? '#9FB6E8';
    // never smaller than a few screen pixels, so hubs stay readable when zoomed out
    const r = nodeRadius(n, scale);
    ctx.globalAlpha = dim ? 0.13 : 1;
    ctx.shadowColor = hue;
    ctx.shadowBlur = lit || n.kind === 'domain' ? 18 : scale > 1.2 ? 6 : 0;
    ctx.beginPath();
    ctx.arc(n.x, n.y, lit && n.kind !== 'domain' ? r * 1.6 : r, 0, 2 * Math.PI);
    ctx.fillStyle = n.kind === 'domain' ? '#0E2A66' : hue;
    ctx.fill();
    if (n.kind === 'domain') {
      ctx.lineWidth = Math.max(2.4, 2 / scale);
      ctx.strokeStyle = hue;
      ctx.stroke();
    }
    if (n.id === selected || n.id === hover) {
      // a soft pulsing halo on the selected / hovered node
      const t = (performance.now() % 1800) / 1800;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * (2 + t * 1.6), 0, 2 * Math.PI);
      ctx.lineWidth = 1.6 / scale;
      ctx.strokeStyle = `rgba(235,242,255,${0.85 * (1 - t)})`;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 2, 0, 2 * Math.PI);
      ctx.lineWidth = 1.6 / scale;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    const showLabel = n.kind === 'domain' || lit || scale > 2.4;
    if (showLabel) {
      // constant on-screen size: 15px for domains, 11.5px for classes
      const size = n.kind === 'domain' ? 15 / scale : 11.5 / scale;
      ctx.font = `${n.kind === 'domain' || lit ? 600 : 500} ${size}px 'DM Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = n.kind === 'domain' ? '#FFFFFF' : lit ? '#FFFFFF' : 'rgba(225,235,255,0.85)';
      // dark halo so labels stay legible over the dots behind them
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3.5 / scale;
      ctx.strokeStyle = 'rgba(4,13,38,0.9)';
      ctx.strokeText(n.label, n.x, n.y + r + 3);
      ctx.fillText(n.label, n.x, n.y + r + 3);
    }
    ctx.globalAlpha = 1;
  }, [focusSet, pathSet, selected, hover]);

  const linkLit = useCallback((l) => {
    const s = end(l.source); const t = end(l.target);
    if (pathSet) return l.kind === 'relation' && pathSet.edges.has(`${s}|${l.relation}|${t}`);
    if (focusId) return s === focusId || t === focusId;
    return false;
  }, [pathSet, focusId]);

  // Relationship edges: a silver line with a soft glow and a slow shimmer
  // travelling along it. Widths are in screen pixels at every zoom.
  const drawRelation = useCallback((l, ctx, scale) => {
    const s = l.source; const t = l.target;
    if (typeof s !== 'object' || !Number.isFinite(s.x) || !Number.isFinite(t.x)) return;
    const lit = linkLit(l);
    const dim = (pathSet || focusId) && !lit;
    ctx.save();
    ctx.globalAlpha = dim ? 0.18 : 1;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
    ctx.strokeStyle = lit ? 'rgba(200,225,255,0.22)' : 'rgba(190,210,240,0.10)';
    ctx.lineWidth = (lit ? 10 : 6) / scale;
    ctx.stroke();
    ctx.shadowColor = 'rgba(225,236,255,0.95)';
    ctx.shadowBlur = lit ? 14 : 7;
    ctx.strokeStyle = lit ? 'rgba(245,249,255,0.95)' : 'rgba(208,220,238,0.62)';
    ctx.lineWidth = (lit ? 2.2 : 1.3) / scale;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([10 / scale, 26 / scale]);
    ctx.lineDashOffset = -((performance.now() / 28) % 36) / scale;
    ctx.strokeStyle = lit ? '#FFFFFF' : 'rgba(255,255,255,0.75)';
    ctx.lineWidth = (lit ? 2.4 : 1.4) / scale;
    ctx.stroke();
    ctx.restore();
  }, [linkLit, pathSet, focusId]);

  const results = useMemo(() => searchClasses(query, SEARCH_LIMIT), [query]);

  return (
    <div ref={root} className="h-full grid min-h-0" style={{ gridTemplateColumns: 'minmax(0, 1fr) 440px', background: '#FFFFFF', height: full ? '100vh' : undefined }}>
      <div ref={wrap} className="relative min-h-0 overflow-hidden" style={{ background: BG, borderRadius: full ? 0 : '0 0 0 20px', cursor: 'grab' }}>
        {ForceGraph2D && (
          <ForceGraph2D
            ref={fg}
            width={w}
            height={h}
            graphData={data}
            backgroundColor="rgba(0,0,0,0)"
            nodeId="id"
            nodeVisibility={visible}
            linkVisibility={(l) => visible(typeof l.source === 'object' ? l.source : nodeById.get(l.source)) && visible(typeof l.target === 'object' ? l.target : nodeById.get(l.target))}
            nodeCanvasObject={drawNode}
            nodePointerAreaPaint={(n, color, ctx, scale) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, nodeRadius(n, scale) + 3 / scale, 0, 2 * Math.PI); ctx.fill(); }}
            nodeLabel={() => ''}
            autoPauseRedraw={false}
            linkCanvasObjectMode={(l) => (l.kind === 'relation' ? 'replace' : undefined)}
            linkCanvasObject={drawRelation}
            linkColor={(l) => (linkLit(l) ? '#EAF1FF' : l.kind === 'domain' ? 'rgba(205,218,240,0.26)' : 'rgba(205,218,240,0.13)')}
            linkWidth={(l) => (linkLit(l) ? 1.8 : 0.6)}
            linkDirectionalArrowLength={(l) => (l.kind === 'relation' ? 4.5 : 0)}
            linkDirectionalArrowRelPos={0.9}
            linkDirectionalArrowColor={() => SILVER}
            linkDirectionalParticles={(l) => (linkLit(l) ? (l.kind === 'relation' ? 3 : 1) : 0)}
            linkDirectionalParticleWidth={(l) => (l.kind === 'relation' ? 3 : 2)}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleColor={() => '#FFFFFF'}
            onNodeHover={(n) => { setHover(n ? n.id : null); if (wrap.current) wrap.current.style.cursor = n ? 'pointer' : 'grab'; }}
            onNodeClick={(n) => focusNode(n.id)}
            onBackgroundClick={() => { setSelected(null); setCardOpen(false); }}
            onZoom={({ k }) => { const l = levelFor(k); setLevel((cur) => (cur === l ? cur : l)); placeCard(); }}
            onEngineTick={placeCard}
            warmupTicks={140}
            cooldownTicks={260}
            onEngineStop={() => { if (!fitted.current && fg.current) { fitted.current = true; fg.current.zoomToFit(700, 70); } }}
          />
        )}

        {/* info card beside the selected node */}
        {cardId && (
          <div ref={card} className={`absolute left-0 top-0 ${cardPinned ? 'pointer-events-auto' : 'pointer-events-none'}`} style={{ width: CARD_W, zIndex: 4, willChange: 'transform' }}>
            <InfoCard key={cardId} id={cardId} pinned={cardPinned} onClose={() => setCardOpen(false)} onSelect={focusNode} />
          </div>
        )}

        {/* level of detail */}
        <div className="absolute left-4 bottom-4 pointer-events-none rounded-xl" style={{ background: 'rgba(4,13,38,0.72)', border: '1px solid rgba(255,255,255,0.16)', padding: '10px 14px', backdropFilter: 'blur(8px)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: '#9FC3FF', textTransform: 'uppercase' }}>Showing</p>
          <ol className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
            {LEVELS.map((l, i) => (
              <li key={l.label} className="rounded-full" style={{ width: 26, height: 6, background: i <= level ? '#2BC8F5' : 'rgba(255,255,255,0.18)' }} />
            ))}
          </ol>
          <p style={{ fontSize: 13.5, color: '#FFFFFF', marginTop: 6, fontWeight: 600 }}>{level === 0 ? LEVELS[0].label : `Down to ${LEVELS[level].label.toLowerCase()}`}</p>
          {level < LEVELS.length - 1 && <p style={{ fontSize: 12.5, color: '#BFD2F5', marginTop: 2 }}>Zoom in to reveal {LEVELS[level + 1].label.toLowerCase()}</p>}
        </div>

        {/* toolbar */}
        <div className="absolute left-4 right-4 top-4 flex items-start gap-3 pointer-events-none">
          <button type="button" onClick={onBack} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full hover:bg-white/15"
            style={{ fontSize: 13.5, fontWeight: 600, color: '#FFFFFF', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', padding: '7px 14px', backdropFilter: 'blur(8px)' }}>
            <ArrowLeft size={15} aria-hidden /> Browse view
          </button>
          <div className="pointer-events-auto relative" style={{ width: 340 }}>
            <label className="flex items-center gap-2 rounded-full" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', padding: '7px 14px', backdropFilter: 'blur(8px)' }}>
              <Search size={15} style={{ color: '#BFD2F5' }} aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a class" aria-label="Find a class"
                className="flex-1 bg-transparent outline-none placeholder:text-blue-200/70" style={{ fontSize: 14, color: '#FFFFFF' }} />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear"><X size={14} style={{ color: '#BFD2F5' }} /></button>}
            </label>
            {results.length > 0 && (
              <ul className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden bg-white shadow-xl" style={{ zIndex: 5 }}>
                {results.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => { setQuery(''); focusNode(c.id); }} className="w-full text-left hover:bg-slate-50" style={{ padding: '8px 12px' }}>
                      <span className="block" style={{ fontSize: 14, fontWeight: 650, color: kpmg.ink }}>{c.label}</span>
                      <span className="block" style={{ fontSize: 12, color: kpmg.cobalt }}>{c.domainLabel} · {c.trail.join(' › ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="pointer-events-auto flex flex-wrap gap-1.5 ml-auto">
            {ESTATE_GROUPS.map((g) => {
              const off = hidden.has(g.id);
              return (
                <button key={g.id} type="button" aria-pressed={!off}
                  onClick={() => setHidden((s) => { const n = new Set(s); if (n.has(g.id)) n.delete(g.id); else n.add(g.id); return n; })}
                  className="inline-flex items-center gap-1.5 rounded-full"
                  style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 12px', color: off ? 'rgba(255,255,255,0.45)' : '#FFFFFF', background: off ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)', border: `1px solid ${off ? 'rgba(255,255,255,0.12)' : HUE[g.id]}`, backdropFilter: 'blur(8px)' }}>
                  <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: HUE[g.id], opacity: off ? 0.35 : 1 }} />{g.label}
                </button>
              );
            })}
            <button type="button" onClick={() => fg.current?.zoomToFit(600, 70)} title="Fit the graph to the screen" aria-label="Fit the graph to the screen" className="inline-flex items-center rounded-full hover:bg-white/15"
              style={{ padding: '6px 10px', color: '#FFFFFF', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)' }}>
              <Scan size={14} aria-hidden />
            </button>
            <button type="button" onClick={toggleFull} className="inline-flex items-center gap-1.5 rounded-full hover:bg-white/20"
              style={{ fontSize: 12.5, fontWeight: 650, padding: '6px 12px', color: '#06173F', background: SILVER, border: '1px solid #FFFFFF', boxShadow: '0 0 12px rgba(228,236,248,0.45)' }}>
              {full ? <Minimize2 size={14} aria-hidden /> : <Maximize2 size={14} aria-hidden />}{full ? 'Exit full screen' : 'Full screen'}
            </button>
          </div>
        </div>
      </div>

      <aside className="min-h-0 overflow-auto bg-white" style={{ padding: '20px 22px', borderLeft: '1px solid #E2E9F2', borderRadius: full ? 0 : '0 0 20px 0' }} aria-label="Node detail">
        {selected
          ? <Detail id={selected} onSelect={focusNode} setActivePath={setActivePath} />
          : <Legend paths={paths} activePath={activePath} setActivePath={setActivePath} />}
        {selected && (
          <button type="button" onClick={() => setSelected(null)} className="hover:underline" style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: kpmg.cobalt }}>
            Back to the legend and paths
          </button>
        )}
      </aside>
    </div>
  );
}
