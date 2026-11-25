'use client';
// Drill-down for one card: its contents. DrillOverlay presents it as a popup
// over the cockpit. Escape or the close control closes it.
//
// Assessment only, answer first. Three tabs:
//   Assessment      the answer to the card's question (one line), at most four
//                   one-line findings, the card's chart at full size; for FID
//                   Readiness, the twelve readiness items by decision class
//   Open questions  at most three gaps, each stated as a finding
//   Evidence        the longer findings and every source the card cites
// Nothing is drawn as an empty field, and there is no status chip: there is
// no composite status to show.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { cardFor, sourcesFor, readinessItems, heroStats, formatAsOf, DOMAIN_LABEL, CLASS_LABEL } from '@/lib/trentar/view';
import { useTrentarSession } from '@/lib/trentar/session';
import ClaimValue from '../ClaimValue';
import EvidenceBase from '../EvidenceBase';
import { EvidencePanel, PROVENANCE_STYLE, usePopover } from '../ProvenanceBadge';
import ResearchChart from '../research/ResearchChart';
import { C, CARD_ICONS, elevation, kpmg } from '../tokens';

const TABS = [
  { id: 'assessment', label: 'Assessment' },
  { id: 'questions', label: 'Open questions' },
  { id: 'evidence', label: 'Evidence' },
];
const box = { border: `1px solid ${C.border}`, borderRadius: 16 };

function Chip({ claim, label }) {
  const pop = usePopover();
  return (
    <div ref={pop.ref} className="relative">
      <button type="button" onClick={() => pop.setOpen((o) => !o)} aria-expanded={pop.open} aria-controls={pop.panelId} title="Source or basis"
        className="h-full flex flex-col justify-center bg-white text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 22px', minWidth: 160 }}>
        <ClaimValue claim={claim} variant="inline" className="leading-none" />
        <span style={{ fontSize: 14.5, color: kpmg.ink2, fontWeight: 500, marginTop: 6 }}>{label}</span>
      </button>
      {pop.open && <EvidencePanel id={pop.panelId} claim={claim} style={PROVENANCE_STYLE[claim.provenance]} onClose={() => pop.setOpen(false)} align="right" />}
    </div>
  );
}

const CLASS_PILL = {
  FID_GATE: { background: '#0F2D52', color: '#FFFFFF', border: '1px solid #0F2D52' },
  FID_CONDITION: { background: '#FFFFFF', color: '#1D4ED8', border: '1px solid #93B4F5' },
};

function Readiness() {
  const th = { fontSize: 13.5, fontWeight: 600, color: kpmg.ink2, padding: '10px 14px', textAlign: 'left', background: '#F3F6FB', position: 'sticky', top: 0 };
  const td = { fontSize: 14.5, color: kpmg.ink, padding: '10px 14px', borderTop: `1px solid ${C.border}`, verticalAlign: 'top' };
  return (
    <section className="bg-white min-h-0 flex flex-col" style={{ ...box, padding: '16px 20px' }} aria-label="Readiness items">
      <h3 style={{ fontSize: 19, fontWeight: 650, color: kpmg.ink, marginBottom: 12 }}>The twelve readiness items</h3>
      <div className="flex-1 min-h-0 overflow-auto" style={{ border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead><tr><th style={th}>Item</th><th style={th}>Class</th><th style={th}>Domain</th><th style={th}>Why it decides FID</th><th style={th}>Proposed owner</th></tr></thead>
          <tbody>
            {readinessItems().map((r) => (
              <tr key={r.id}>
                <td style={{ ...td, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.label}</td>
                <td style={td}><span className="inline-flex rounded-full" style={{ fontSize: 12.5, fontWeight: 600, padding: '2px 10px', ...CLASS_PILL[r.decisionClass] }}>{CLASS_LABEL[r.decisionClass]}</span></td>
                <td style={{ ...td, color: C.text2, whiteSpace: 'nowrap' }}>{DOMAIN_LABEL[r.domain]}</td>
                <td style={{ ...td, color: C.text2, maxWidth: 560 }}><span className="block truncate" title={r.why}>{r.why}</span></td>
                <td style={{ ...td, color: C.text2 }}><span className="block truncate" style={{ maxWidth: 300 }} title={r.owner}>{r.owner}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AssessmentTab({ cardId }) {
  const m = cardFor(cardId);
  const fid = cardId === 'fid';
  return (
    <div className="h-full grid gap-5 min-h-0" style={{ gridTemplateRows: fid ? 'minmax(0, 430px) minmax(0, 1fr)' : 'minmax(0, 1fr)' }}>
      <div className="grid gap-6 min-h-0" style={{ gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)' }}>
        <section className="bg-white flex flex-col min-h-0 overflow-auto" style={{ ...box, padding: '26px 30px' }} aria-label="Answer and findings">
          <p className="uppercase" style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: 0.9, color: kpmg.cobalt }}>{m.question}</p>
          <div style={{ marginTop: 10 }}><ClaimValue claim={m.answer} variant="insight" size="lg" /></div>
          <ul className="flex flex-col flex-1" style={{ marginTop: 22, justifyContent: fid ? 'flex-start' : 'space-evenly', gap: fid ? 12 : 0 }}>
            {m.brief.map((c) => <li key={c.id} style={{ padding: fid ? 0 : '14px 0', borderTop: fid ? 'none' : `1px solid ${C.border}` }}><ClaimValue claim={c} variant="finding" size="lg" /></li>)}
          </ul>
          <div style={{ paddingTop: 16 }}><EvidenceBase items={m.evidenceBase} size={15.5} /></div>
        </section>
        <section className="min-h-0 flex flex-col justify-center" style={{ ...box, padding: '24px 28px', background: 'linear-gradient(160deg, #FFFFFF 0%, #F3F7FD 100%)' }} aria-label="Exhibit">
          <ResearchChart cardId={cardId} chart={m.chart} compact={false} height={fid ? 290 : 520} />
        </section>
      </div>
      {fid && <Readiness />}
    </div>
  );
}

function QuestionsTab({ cardId }) {
  const m = cardFor(cardId);
  return (
    <section className="h-full flex flex-col min-h-0" aria-label="Open questions">
      <div style={{ ...box, padding: '20px 28px', background: 'linear-gradient(160deg, #F3F7FD 0%, #EAF1FB 100%)' }}>
        <p className="uppercase" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.9, color: kpmg.cobalt }}>Where we stand</p>
        <div style={{ marginTop: 6 }}><ClaimValue claim={m.answer} variant="insight" size="lg" /></div>
      </div>
      <p style={{ fontSize: 18, color: kpmg.ink2, marginTop: 20 }}>What the public record does not settle, and what that means for the decision.</p>
      <ol className="flex-1 min-h-0 grid gap-4" style={{ marginTop: 14, gridTemplateRows: `repeat(${m.openQuestions.length}, minmax(0, 1fr))` }}>
        {m.openQuestions.map((c, i) => (
          <li key={c.id} className="flex items-center gap-6 bg-white" style={{ ...box, padding: '22px 30px', borderLeft: `6px solid ${[kpmg.blue, kpmg.cobalt, kpmg.lightBlue][i % 3]}` }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: [kpmg.blue, kpmg.cobalt, kpmg.lightBlue][i % 3], letterSpacing: -1, minWidth: 56 }}>{String(i + 1).padStart(2, '0')}</span>
            <ClaimValue claim={c} variant="finding" size="xl" className="flex-1" />
          </li>
        ))}
      </ol>
    </section>
  );
}

function EvidenceTab({ cardId }) {
  const m = cardFor(cardId);
  const cited = (c) => c.emphasis ?? c.label;
  return (
    <div className="h-full grid gap-6 min-h-0" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)' }}>
      <section className="bg-white overflow-auto" style={{ ...box, padding: '18px 22px' }} aria-label="Detailed findings">
        <h3 style={{ fontSize: 21, fontWeight: 650, color: kpmg.ink, marginBottom: 14 }}>Detailed findings</h3>
        <ul className="flex flex-col gap-5">
          {m.detail.map((d) => <li key={d.claim.id}><ClaimValue claim={d.claim} variant="finding" size="lg" /></li>)}
        </ul>
      </section>
      <section className="bg-white overflow-auto" style={{ ...box, padding: '18px 20px' }} aria-label="Sources">
        <h3 style={{ fontSize: 21, fontWeight: 650, color: kpmg.ink, marginBottom: 14 }}>Sources cited on this card</h3>
        <ul className="flex flex-col gap-5">
          {sourcesFor(cardId).map(({ source: s, cites }) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 hover:underline" style={{ fontSize: 16.5, fontWeight: 600, color: kpmg.cobalt }}>
                {s.label}<ExternalLink size={12} className="mt-1 flex-shrink-0" aria-hidden />
              </a>
              <p style={{ fontSize: 15, color: kpmg.ink2, marginTop: 2 }}>{s.publisher} · {formatAsOf(s.asOf)}</p>
              <p style={{ fontSize: 15, color: kpmg.ink, marginTop: 4 }}><span style={{ color: C.muted }}>Supports </span>{[...new Set(cites.map(cited))].join('; ')}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function DrillPanel({ cardId, accent, fill = false }) {
  const m = cardFor(cardId);
  const Icon = CARD_ICONS[cardId];
  const close = useTrentarSession((s) => s.close);
  const [tab, setTab] = useState('assessment');
  const stats = Object.fromEntries(heroStats().map((s) => [s.key, s]));
  const chips = cardId === 'fid'
    ? [{ claim: stats.gates.claim, label: 'Gates open' }, { claim: stats.conditions.claim, label: 'Conditions' }]
    : [{ claim: m.headline.claim, label: m.headline.caption }];

  useEffect(() => { setTab('assessment'); }, [cardId]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('[role="dialog"][aria-label]:not([aria-modal])')) close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <section role="dialog" aria-modal="true" aria-label={`${m.title} drill-down`} tabIndex={-1} data-drill-panel={cardId}
      className="relative w-full flex flex-col bg-white overflow-hidden outline-none"
      style={{ height: fill ? '100%' : 820, borderRadius: 20, boxShadow: fill ? elevation.modal : elevation.card, border: `1px solid ${C.border}`, borderTop: accent ? `2px solid ${accent}` : undefined }}>
      <motion.div key={cardId} className="flex-1 min-h-0 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
        <header className="flex-shrink-0 flex items-center gap-6" style={{ background: 'linear-gradient(180deg, #F3F6FD 0%, #F8FAFE 100%)', borderBottom: `1px solid ${C.border}`, padding: '22px 28px' }}>
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <span className="flex items-center justify-center flex-shrink-0" style={{ width: 60, height: 60, borderRadius: 16, background: '#FFFFFF', border: `1px solid ${C.border}`, color: accent }}>
              <Icon size={30} strokeWidth={1.6} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 style={{ fontSize: 30, fontWeight: 650, color: kpmg.ink, letterSpacing: -0.5, lineHeight: 1.15 }}>{m.title}</h2>
              <p style={{ fontSize: 17.5, color: kpmg.ink2, marginTop: 4 }}>{m.question}</p>
            </div>
          </div>
          <div className="flex items-stretch gap-3 flex-shrink-0" style={{ fontSize: 28, fontWeight: 700, color: kpmg.ink, letterSpacing: -0.4 }}>
            {chips.map((c) => <Chip key={c.claim.id} claim={c.claim} label={c.label} />)}
          </div>
          <button type="button" onClick={close} aria-label="Close" className="self-start flex-shrink-0 rounded-full hover:bg-slate-200/60 flex items-center justify-center"
            style={{ width: 36, height: 36, color: C.text }}>
            <X size={20} />
          </button>
        </header>

        <nav className="flex-shrink-0" style={{ padding: '16px 28px 0' }}>
          <div role="tablist" aria-label="Drill-down sections" className="inline-flex items-center gap-1" style={{ background: '#F1F4FA', borderRadius: 12, padding: 4 }}>
            {TABS.map((t) => {
              const on = t.id === tab;
              return (
                <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => setTab(t.id)}
                  className="rounded-[9px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  style={{ fontSize: 15.5, fontWeight: on ? 600 : 500, padding: '10px 24px', color: on ? '#FFFFFF' : kpmg.ink2, background: on ? kpmg.blue : 'transparent', boxShadow: on ? '0 2px 6px rgba(0,51,141,0.30)' : 'none' }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-h-0 flex flex-col" style={{ padding: '18px 28px 26px' }} role="tabpanel">
          {tab === 'assessment' && <AssessmentTab key={cardId} cardId={cardId} />}
          {tab === 'questions' && <QuestionsTab cardId={cardId} />}
          {tab === 'evidence' && <EvidenceTab cardId={cardId} />}
        </div>
      </motion.div>
    </section>
  );
}
