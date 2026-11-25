'use client';
// Estate knowledge graph: the Trentar Estate Ontology as a browsable model.
// Opens in place over the cockpit, like a card's drill-down. Four things:
// the coverage counter strip, the 28 domains as tiles under five headings,
// a domain's classes as an indented list (searchable across every class),
// and the Metrics and Rules sheets as plain tables. No network diagram: a
// 619-node graph is unreadable, so the model is shown as lists and tables.
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Boxes, Search, Network } from 'lucide-react';
import EstateGraph from './EstateGraph';
import { ESTATE_GROUPS, estateCoverage, domainTile, domainTree, searchClasses, domainLabel, metrics, rules } from '@/lib/trentar/estate';
import { useTrentarSession } from '@/lib/trentar/session';
import ClaimValue from '../ClaimValue';
import { C, elevation, kpmg } from '../tokens';

const TABS = [
  { id: 'domains', label: 'Domains and classes' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'rules', label: 'Rules' },
];
const GROUP_HUE = { land: kpmg.purple, facility: kpmg.lightBlue, it: kpmg.cobalt, running: kpmg.teal, business: kpmg.blue };
const box = { border: `1px solid ${C.border}`, borderRadius: 16, background: '#FFFFFF' };

function Tile({ id, hue, on, onClick }) {
  const t = domainTile(id);
  return (
    <button type="button" onClick={onClick} aria-pressed={on} title={t.scope}
      className="text-left flex flex-col min-w-0 rounded-xl hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      style={{ height: 74, padding: '9px 12px', background: on ? '#EEF3FC' : '#FFFFFF', border: `1.5px solid ${on ? hue : C.border}`, boxShadow: on ? `inset 4px 0 0 ${hue}` : 'none' }}>
      <span className="flex items-baseline justify-between gap-2 min-w-0">
        <span className="truncate" style={{ fontSize: 14, fontWeight: 650, color: kpmg.ink }}>{t.label}</span>
        <span className="flex-shrink-0 rounded-full" title={`${t.classes.value} ${t.classes.unit}`} style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', background: hue, padding: '1px 8px' }}><ClaimValue claim={t.classes} variant="numeral" /></span>
      </span>
      <span style={{ fontSize: 12.5, lineHeight: 1.3, color: kpmg.ink2, marginTop: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.scope}</span>
    </button>
  );
}

function Attributes({ list }) {
  if (!list.length) return null;
  return (
    <span className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
      {list.map((a) => (
        <span key={a.id} title={a.definition} className="inline-flex items-center gap-1 rounded-md"
          style={{ fontSize: 12, padding: '2px 8px', background: '#F1F5FB', border: `1px solid ${a.required ? '#BBD0EE' : C.border}`, color: kpmg.ink }}>
          <span style={{ fontWeight: 600 }}>{a.label}</span>
          <span style={{ color: kpmg.muted }}>{a.datatype.replace(/^enum:/, 'one of ')}{a.unit ? `, ${a.unit}` : ''}</span>
        </span>
      ))}
    </span>
  );
}

function ClassRow({ c, depth = 0, trail }) {
  return (
    <li style={{ padding: '10px 0 10px', borderBottom: `1px solid ${C.border}`, paddingLeft: depth * 22 }}>
      <div className="flex items-baseline gap-2 flex-wrap">
        {depth > 0 && <span aria-hidden style={{ color: '#B6C3D6' }}>└</span>}
        <span style={{ fontSize: 15.5, fontWeight: 650, color: kpmg.ink }}>{c.label}</span>
        {c.synonyms && <span style={{ fontSize: 12.5, color: kpmg.muted }}>also {c.synonyms}</span>}
      </div>
      {trail && <p style={{ fontSize: 12.5, color: kpmg.cobalt, marginTop: 2 }}>{trail}</p>}
      <p style={{ fontSize: 13.5, color: kpmg.ink2, lineHeight: 1.45, marginTop: 3, paddingLeft: depth > 0 ? 18 : 0 }}>{c.definition}</p>
      <div style={{ paddingLeft: depth > 0 ? 18 : 0 }}><Attributes list={c.attributes} /></div>
    </li>
  );
}

function Explorer({ domain, query }) {
  const results = useMemo(() => searchClasses(query), [query]);
  const tree = useMemo(() => domainTree(domain), [domain]);
  const t = domainTile(domain);
  const searching = Boolean(query.trim());
  return (
    <section className="flex flex-col min-h-0" style={{ ...box, padding: '18px 22px' }} aria-label="Classes">
      {searching ? (
        <header style={{ paddingBottom: 10, borderBottom: `2px solid ${kpmg.blue}` }}>
          <h3 style={{ fontSize: 19, fontWeight: 650, color: kpmg.ink }}>Classes matching “{query.trim()}”</h3>
          <p style={{ fontSize: 13.5, color: kpmg.ink2, marginTop: 2 }}>Across all domains, by name, synonym and definition.</p>
        </header>
      ) : (
        <header style={{ paddingBottom: 10, borderBottom: `2px solid ${kpmg.blue}` }}>
          <h3 className="flex items-baseline gap-3" style={{ fontSize: 20, fontWeight: 650, color: kpmg.ink }}>
            {t.label}<span style={{ fontSize: 14, fontWeight: 600, color: kpmg.cobalt }}><ClaimValue claim={t.classes} variant="inline" /></span>
          </h3>
          <p style={{ fontSize: 14, color: kpmg.ink2, marginTop: 2 }}>{t.scope}</p>
        </header>
      )}
      <ul className="flex-1 min-h-0 overflow-auto" style={{ paddingRight: 6 }}>
        {searching
          ? (results.length ? results.map((c) => <ClassRow key={c.id} c={c} trail={`${c.domainLabel} · ${c.trail.join(' › ')}`} />)
            : <li style={{ padding: '16px 0', fontSize: 14, color: kpmg.ink2 }}>No class matches.</li>)
          : tree.map((c) => <ClassRow key={c.id} c={c} depth={c.depth} />)}
      </ul>
    </section>
  );
}

function DomainsTab({ query }) {
  const [domain, setDomain] = useState(() => estateSelection ?? 'ESTATE');
  const pick = (id) => { estateSelection = id; setDomain(id); };
  return (
    <div className="h-full grid gap-6 min-h-0" style={{ gridTemplateColumns: 'minmax(0, 58fr) minmax(0, 42fr)' }}>
      <div className="flex flex-col min-h-0 overflow-auto" style={{ gap: 12 }} aria-label="Domains">
        {ESTATE_GROUPS.map((g) => (
          <div key={g.id} className="flex gap-4 min-w-0">
            <div className="flex-shrink-0" style={{ width: 128, paddingTop: 8 }}>
              <p className="uppercase" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.7, color: GROUP_HUE[g.id], lineHeight: 1.3 }}>{g.label}</p>
            </div>
            <div className="flex-1 grid gap-2 min-w-0" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
              {g.domains.map((id) => <Tile key={id} id={id} hue={GROUP_HUE[g.id]} on={id === domain} onClick={() => pick(id)} />)}
            </div>
          </div>
        ))}
      </div>
      <Explorer domain={domain} query={query} />
    </div>
  );
}
let estateSelection = null;

const th = { fontSize: 13.5, fontWeight: 650, color: kpmg.ink2, padding: '11px 14px', textAlign: 'left', background: '#F3F6FB', position: 'sticky', top: 0, zIndex: 1 };
const td = { fontSize: 14, color: kpmg.ink, padding: '10px 14px', borderTop: `1px solid ${C.border}`, verticalAlign: 'top', lineHeight: 1.45 };

function MetricsTab() {
  return (
    <section className="h-full min-h-0 overflow-auto" style={box} aria-label="Metrics">
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead><tr><th style={th}>Metric</th><th style={th}>Domain</th><th style={th}>Unit</th><th style={th}>Formula</th><th style={th}>Used for</th></tr></thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.id}>
              <td style={{ ...td, fontWeight: 650, width: '19%' }}>{m.label}</td>
              <td style={{ ...td, color: kpmg.cobalt, whiteSpace: 'nowrap' }}>{domainLabel(m.domain)}</td>
              <td style={{ ...td, color: kpmg.ink2, whiteSpace: 'nowrap' }}>{m.unit}</td>
              <td style={{ ...td, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, color: '#1F3A64', width: '30%' }}>{m.formula}</td>
              <td style={{ ...td, color: kpmg.ink2 }}>{m.usedFor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const KIND_HUE = { provenance: kpmg.blue, capacity: kpmg.cobalt, resilience: kpmg.purple, control: '#6D2077', sustainability: kpmg.teal, operations: kpmg.lightBlue, modelling: '#43536B' };

function RulesTab() {
  return (
    <section className="h-full min-h-0 overflow-auto" style={box} aria-label="Rules">
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead><tr><th style={th}>Rule</th><th style={th}>Kind</th><th style={th}>Statement</th></tr></thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <td style={{ ...td, fontWeight: 650, width: '24%' }}>{r.label}</td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                <span className="inline-flex rounded-full" style={{ fontSize: 12.5, fontWeight: 600, padding: '2px 10px', color: '#FFFFFF', background: KIND_HUE[r.kind] ?? kpmg.blue }}>{r.kind}</span>
              </td>
              <td style={{ ...td, color: kpmg.ink2 }}>{r.statement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Panel() {
  const close = useTrentarSession((s) => s.closeEstate);
  const [tab, setTab] = useState('domains');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('browse'); // 'browse' | 'graph'
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <section role="dialog" aria-modal="true" aria-label="Estate knowledge graph" data-estate-panel
      className="relative w-full h-full flex flex-col bg-white overflow-hidden" style={{ borderRadius: 20, boxShadow: elevation.modal, borderTop: `2px solid ${kpmg.blue}` }}>
      <header className="flex-shrink-0 flex items-center gap-6" style={{ background: 'linear-gradient(180deg, #F3F6FD 0%, #F8FAFE 100%)', borderBottom: `1px solid ${C.border}`, padding: '20px 28px' }}>
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 58, height: 58, borderRadius: 16, background: '#FFFFFF', border: `1px solid ${C.border}`, color: kpmg.blue }}>
          <Boxes size={30} strokeWidth={1.6} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 style={{ fontSize: 30, fontWeight: 650, color: kpmg.ink, letterSpacing: -0.5, lineHeight: 1.15 }}>Estate knowledge graph</h2>
          <p style={{ fontSize: 16.5, color: kpmg.ink2, marginTop: 3 }}>The Trentar Estate Ontology: what exists in a data centre estate and how it connects.</p>
        </div>
        <ul className="flex items-stretch gap-2.5 flex-shrink-0" aria-label="Coverage">
          {estateCoverage().map(({ key, claim: c }) => (
            <li key={key} className="bg-white flex flex-col justify-center" style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 18px', minWidth: 118 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: kpmg.blue, letterSpacing: -0.4, lineHeight: 1.05 }}><ClaimValue claim={c} variant="numeral" /></span>
              <span style={{ fontSize: 13.5, color: kpmg.ink2, marginTop: 4 }}>{c.label}</span>
            </li>
          ))}
        </ul>
        {mode === 'browse' && (
          <button type="button" onClick={() => setMode('graph')} className="self-center flex-shrink-0 inline-flex items-center gap-2 rounded-full hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{ fontSize: 14.5, fontWeight: 650, color: '#FFFFFF', background: `linear-gradient(135deg, ${kpmg.cobalt} 0%, ${kpmg.blue} 100%)`, padding: '11px 18px', boxShadow: '0 6px 16px rgba(0,51,141,0.28)' }}>
            <Network size={17} aria-hidden /> Full view
          </button>
        )}
        <button type="button" onClick={close} aria-label="Close" className="self-start flex-shrink-0 rounded-full hover:bg-slate-200/60 flex items-center justify-center" style={{ width: 36, height: 36, color: C.text }}>
          <X size={20} />
        </button>
      </header>

      {mode === 'graph' ? (
        <div className="flex-1 min-h-0"><EstateGraph onBack={() => setMode('browse')} /></div>
      ) : (<>
      <nav className="flex-shrink-0 flex items-center justify-between gap-4" style={{ padding: '14px 28px 0' }}>
        <div role="tablist" aria-label="Estate knowledge graph sections" className="inline-flex items-center gap-1" style={{ background: '#F1F4FA', borderRadius: 12, padding: 4 }}>
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => setTab(t.id)}
                className="rounded-[9px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{ fontSize: 15.5, fontWeight: on ? 600 : 500, padding: '9px 22px', color: on ? '#FFFFFF' : kpmg.ink2, background: on ? kpmg.blue : 'transparent', boxShadow: on ? '0 2px 6px rgba(0,51,141,0.30)' : 'none' }}>
                {t.label}
              </button>
            );
          })}
        </div>
        {tab === 'domains' && (
          <label className="flex items-center gap-2 rounded-xl bg-white" style={{ border: `1px solid ${C.border}`, padding: '8px 14px', width: 420 }}>
            <Search size={17} style={{ color: kpmg.muted }} aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all classes" aria-label="Search all classes"
              className="flex-1 outline-none bg-transparent" style={{ fontSize: 15, color: kpmg.ink }} />
          </label>
        )}
      </nav>

      <div className="flex-1 min-h-0" style={{ padding: '14px 28px 24px' }} role="tabpanel">
        {tab === 'domains' && <DomainsTab query={query} />}
        {tab === 'metrics' && <MetricsTab />}
        {tab === 'rules' && <RulesTab />}
      </div>
      </>)}
    </section>
  );
}

export default function EstateOverlay() {
  const open = useTrentarSession((s) => s.estateOpen);
  const close = useTrentarSession((s) => s.closeEstate);
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="estate-overlay" className="absolute inset-0 z-40 flex items-center justify-center" style={{ padding: '30px 40px' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0" onClick={close} aria-hidden style={{ background: 'rgba(8,20,44,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
          <motion.div className="relative w-full h-full" style={{ maxWidth: 1760 }}
            initial={{ scale: 0.98 }} animate={{ scale: 1 }} exit={{ scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <Panel />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
