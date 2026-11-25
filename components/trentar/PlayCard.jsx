'use client';
// One of the six play cards on the base cockpit. The cards are the
// navigation: a click anywhere (or "Open", Enter or Space) opens the card's
// drill-down; clicking it again closes it.
//
// Five things only: icon, title and Open; the question; one headline figure
// with its source chip beside the card's illustration (the chart itself is in
// the drill-down); one action-title insight;
// the evidence-base line (what the card rests on). Findings, open questions
// and sources live in the drill-down; nothing on the card draws a gap.
//
// In place of an illustration, the card's own icon is set very large and
// faint in the bottom-right corner, clipped at the card edge.
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cardFor } from '@/lib/trentar/view';
import { useTrentarSession } from '@/lib/trentar/session';
import ClaimValue from './ClaimValue';
import EvidenceBase from './EvidenceBase';
import CardArt from './illustrations/CardArt';
import { CARD_ICONS, cardHue, elevation, kpmg } from './tokens';

export default function PlayCard({ cardId, delay = 0 }) {
  const v = cardFor(cardId);
  const Icon = CARD_ICONS[cardId];
  const hue = cardHue[cardId];
  const selected = useTrentarSession((s) => s.selectedCard === cardId);
  const expanded = useTrentarSession((s) => s.openCard === cardId);
  const toggle = useTrentarSession((s) => s.toggle);
  const r = v;
  const { headline } = v;

  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(cardId); }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, boxShadow: elevation.cardHover, transition: { duration: 0.15 } }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-expanded={expanded}
      data-card={cardId}
      aria-label={`${v.title}. ${v.question} Press Enter to ${expanded ? 'close' : 'open'} its detail.`}
      onClick={() => toggle(cardId)}
      onKeyDown={onKeyDown}
      className="relative flex flex-col min-w-0 min-h-0 overflow-hidden cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      style={{
        background: `linear-gradient(125deg, #FFFFFF 0%, #FFFFFF 42%, ${hue.wash} 100%)`,
        borderRadius: 18,
        border: `1px solid ${expanded ? hue.hue : 'rgba(226,233,242,0.9)'}`,
        boxShadow: expanded ? `0 0 0 1px ${hue.hue}, 0 0 0 5px ${hue.tint}, ${elevation.cardHover}` : elevation.card,
        padding: '22px 26px 20px',
      }}
    >
      {/* Illustration where the reference puts its picture: right-hand side, bleeding off the card. */}
      <CardArt cardId={cardId} className="absolute pointer-events-none" style={{ right: -10, top: 74, width: 250, height: 190 }} />

      <header className="relative flex items-center gap-3.5">
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 13, background: hue.tint, color: hue.ink }}>
          <Icon size={23} strokeWidth={1.9} aria-hidden />
        </span>
        <h3 className="min-w-0 truncate" style={{ fontSize: 24, fontWeight: 650, color: kpmg.ink, letterSpacing: -0.4 }}>{v.title}</h3>
        <button type="button" tabIndex={-1} title={expanded ? 'Close the detail' : 'Open the detail'} aria-hidden="true"
          onClick={(e) => { e.stopPropagation(); toggle(cardId); }}
          className="ml-auto flex-shrink-0 inline-flex items-center gap-0.5 rounded-full hover:brightness-95"
          style={{ fontSize: 14, fontWeight: 600, color: kpmg.cobalt, background: '#FFFFFF', border: '1px solid #C9DAF0', padding: '5px 13px', boxShadow: '0 1px 2px rgba(0,51,141,0.08)' }}>
          {expanded ? 'Close' : 'Open'} <ArrowUpRight size={13} aria-hidden style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }} />
        </button>
      </header>
      <p className="relative truncate" style={{ fontSize: 16.5, color: kpmg.ink2, margin: '4px 0 0 58px', maxWidth: 'calc(100% - 58px)' }}>{v.question}</p>

      {/* One headline figure with its label and source chip. */}
      <div className="relative flex-1 min-h-0 flex items-center" style={{ margin: '8px -10px 6px' }}>
        <div className="min-w-0" style={{ flex: '0 0 54%' }}>
          <ClaimValue claim={headline.claim} variant="figure" size="display" caption={headline.caption} quiet />
        </div>
      </div>

      <ClaimValue claim={r.insight} variant="insight" size="md" className="relative" />
      <footer className="relative" style={{ marginTop: 12 }}>
        <EvidenceBase items={v.evidenceBase} size={14.5} />
      </footer>
    </motion.article>
  );
}
