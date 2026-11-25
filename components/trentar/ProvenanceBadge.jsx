'use client';
// Provenance badge: sits beside every Trentar claim. Four states, distinct in
// colour, icon AND border style so they read in greyscale. Clicking opens the
// claim's evidence (public fact) or basis (everything else).
import { useEffect, useId, useRef, useState } from 'react';
import { BadgeCheck, Sigma, PenLine, CircleDashed, ExternalLink, X } from 'lucide-react';
import { assertClaim, formatAsOf } from '@/lib/trentar/view';

export const PROVENANCE_STYLE = {
  PUBLIC_FACT: { label: 'Public', long: 'Public fact', icon: BadgeCheck, fg: '#047857', bg: '#ECFDF5', border: '1px solid #A7F3D0' },
  EAIQ_ANALYSIS: { label: 'EAiQ', long: 'EAiQ analysis', icon: Sigma, fg: '#1D4ED8', bg: '#EFF6FF', border: '1px solid #BFDBFE' },
  ILLUSTRATIVE_SCENARIO: { label: 'Illustrative', long: 'Illustrative scenario', icon: PenLine, fg: '#6D28D9', bg: '#F5F3FF', border: '1px solid #A78BFA' },
  TRENTAR_INPUT_REQUIRED: { label: 'Input', long: 'Trentar input required', icon: CircleDashed, fg: '#B45309', bg: '#FFFBEB', border: '1px dotted #D97706' },
};

/** Open state for a claim's evidence panel: Escape and outside clicks close it. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);
  return { open, setOpen, ref, panelId };
}

export default function ProvenanceBadge({ claim, compact = false }) {
  const c = assertClaim(claim, 'ProvenanceBadge');
  const s = PROVENANCE_STYLE[c.provenance];
  const Icon = s.icon;
  const { open, setOpen, ref, panelId } = usePopover();

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        onDoubleClick={(e) => e.stopPropagation()}
        aria-expanded={open}
        aria-controls={panelId}
        title={`${s.long} — click for ${c.provenance === 'PUBLIC_FACT' ? 'sources' : 'basis'}`}
        className="inline-flex items-center gap-1 rounded-full whitespace-nowrap hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        style={{ color: s.fg, background: s.bg, border: s.border, fontSize: 10.5, fontWeight: 600, lineHeight: 1, padding: compact ? '3px 5px' : '3px 7px' }}
      >
        <Icon size={11} strokeWidth={2.25} aria-hidden />
        {compact ? <span className="sr-only">{s.long}</span> : s.label}
      </button>
      {open && <EvidencePanel id={panelId} claim={c} style={s} onClose={() => setOpen(false)} />}
    </span>
  );
}

export function EvidencePanel({ id, claim: c, style: s, onClose, align = 'left' }) {
  return (
    <div
      id={id}
      role="dialog"
      aria-label={`${s.long}: ${c.label}`}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 z-50 w-80 max-w-[85vw] rounded-lg bg-white text-left shadow-lg`}
      style={{ border: '1px solid #E2E9F2', padding: '12px 14px', fontSize: 12.5, color: '#0F2D52' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span style={{ color: s.fg, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>{s.long}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
      </div>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{c.label}</p>

      {c.evidence.length > 0 && (
        <ul className="space-y-2">
          {c.evidence.map((e) => (
            <li key={e.id}>
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 hover:underline" style={{ color: '#1D4ED8' }}>
                <span>{e.label}</span><ExternalLink size={11} className="mt-0.5 flex-shrink-0" aria-hidden />
              </a>
              <div style={{ color: '#5B7290', fontSize: 11.5 }}>{e.publisher} · {formatAsOf(e.asOf)}</div>
            </li>
          ))}
        </ul>
      )}

      {c.provenance !== 'PUBLIC_FACT' && c.basis && (
        <>
          <div style={{ color: '#5B7290', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
            {c.provenance === 'TRENTAR_INPUT_REQUIRED' ? 'Why it is needed' : 'Basis'}
          </div>
          <p style={{ lineHeight: 1.45 }}>{c.basis}</p>
        </>
      )}
      {c.confidence && <p style={{ color: '#5B7290', fontSize: 11.5, marginTop: 6 }}>Confidence: <strong style={{ color: '#0F2D52' }}>{c.confidence}</strong></p>}
      {c.owner && <p style={{ color: '#5B7290', fontSize: 11.5, marginTop: c.confidence ? 2 : 6 }}>Owner: {c.owner}</p>}
    </div>
  );
}
