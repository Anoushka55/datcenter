'use client';
// Hero band for the Trentar cockpit. Abstract by design: there is no site and
// no Trentar imagery, so a campus picture would misrepresent the project. A
// gradient field with faint contour lines takes the photograph's place and
// fades out where the mockup fades its image.
import { motion } from 'framer-motion';
import { MapPin, PlugZap, Coins, Leaf, DoorOpen, ClipboardCheck, Calculator, BadgeCheck, Sigma, Boxes } from 'lucide-react';
import { useTrentarSession } from '@/lib/trentar/session';
import { heroStats, evidenceAsOf, formatAsOf } from '@/lib/trentar/view';
import { KPMG_MARK } from '@/components/cockpit/kpmg-mark';
import ClaimValue from '../ClaimValue';
import { EvidencePanel, PROVENANCE_STYLE, usePopover } from '../ProvenanceBadge';
import { hero, glass } from '../tokens';

const STAT_ICONS = { capacity: PlugZap, investment: Coins, renewable: Leaf, gates: DoorOpen, conditions: ClipboardCheck, perWatt: Calculator };

// Contour lines: deterministic, so every render and screenshot is identical.
const CONTOURS = Array.from({ length: 15 }, (_, i) => {
  const base = 18 + i * 21;
  const pts = Array.from({ length: 41 }, (_, k) => {
    const x = k * 25;
    const y = base + 13 * Math.sin(k * 0.36 + i * 0.55) + 7 * Math.sin(k * 0.13 - i * 0.8) + 4 * Math.cos(k * 0.71 + i);
    return `${k === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return { d: pts.join(' '), strong: i % 4 === 1 };
});

function Motif() {
  return (
    <div aria-hidden className="absolute inset-y-0 right-0 pointer-events-none" style={{ width: '62%', maskImage: 'linear-gradient(90deg, transparent 0%, #000 45%, #000 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 45%, #000 100%)' }}>
      <div className="absolute" style={{ right: '8%', top: '-30%', width: 620, height: 620, borderRadius: '50%', background: `radial-gradient(circle, ${hero.glow} 0%, rgba(96,165,250,0) 65%)` }} />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 340" preserveAspectRatio="none">
        {CONTOURS.map((c) => <path key={c.d} d={c.d} fill="none" stroke={c.strong ? hero.motifStrong : hero.motif} strokeWidth={c.strong ? 1.2 : 0.8} vectorEffect="non-scaling-stroke" />)}
      </svg>
      <svg className="absolute" style={{ right: 70, top: 46, opacity: 0.5 }} width="260" height="150" viewBox="0 0 260 150">
        {Array.from({ length: 7 }, (_, r) => Array.from({ length: 12 }, (_, k) => (
          <circle key={`${r}-${k}`} cx={10 + k * 22} cy={10 + r * 22} r="1.3" fill={hero.motifStrong} />
        )))}
      </svg>
    </div>
  );
}

function StatChip({ stat, index }) {
  const pop = usePopover();
  const Icon = STAT_ICONS[stat.key];
  const c = stat.claim;
  const Mark = c.provenance === 'PUBLIC_FACT' ? BadgeCheck : Sigma;
  return (
    <motion.div ref={pop.ref} className="relative min-w-0"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}>
      <button type="button" onClick={() => pop.setOpen((o) => !o)} aria-expanded={pop.open} aria-controls={pop.panelId}
        title={c.provenance === 'PUBLIC_FACT' ? 'Public fact: show sources' : 'EAiQ count: show how it is counted'}
        className="w-full flex items-center gap-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 hover:bg-white/[0.04]"
        style={{ height: 70, borderRadius: 14, padding: '0 18px', background: glass.chipFill, border: `1px solid ${glass.chipBorder}`, boxShadow: glass.chipShadow, backdropFilter: `blur(${glass.blur}px)`, WebkitBackdropFilter: `blur(${glass.blur}px)` }}>
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 12, background: glass.chipTile, border: `1px solid ${glass.chipTileBorder}`, color: hero.ink, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
          <Icon size={21} strokeWidth={1.7} aria-hidden />
        </span>
        <span className="min-w-0 flex flex-col">
          <ClaimValue claim={c} variant="inline" className="truncate" />
          <span className="inline-flex items-center gap-1" style={{ fontSize: 13, color: hero.inkMuted, marginTop: 2 }}>
            {stat.caption}<Mark size={11} strokeWidth={2} aria-hidden style={{ opacity: 0.8 }} />
          </span>
        </span>
      </button>
      {pop.open && <EvidencePanel id={pop.panelId} claim={c} style={PROVENANCE_STYLE[c.provenance]} onClose={() => pop.setOpen(false)} />}
    </motion.div>
  );
}

export default function Hero() {
  const openEstate = useTrentarSession((s) => s.openEstate);
  return (
    <header className="relative flex-shrink-0 overflow-hidden" style={{ background: `linear-gradient(115deg, ${hero.stops[0]} 0%, ${hero.stops[1]} 55%, ${hero.stops[2]} 100%)`, padding: '22px 32px 20px' }}>
      <Motif />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={KPMG_MARK} alt="KPMG" style={{ height: 30, width: 'auto' }} />
            <span className="w-px h-6" style={{ background: 'rgba(255,255,255,0.28)' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/eaiq-logo-white.svg" alt="EAiQ" style={{ height: 26, width: 'auto' }} />
            <span style={{ fontSize: 13, color: hero.inkDim, marginLeft: 6 }}>Preliminary Investment Intelligence</span>
          </div>
          <span className="ml-auto" style={{ fontSize: 11.5, color: hero.inkDim, letterSpacing: 0.3, marginRight: 16 }}>KPMG Confidential</span>
          {/* Supporting asset, so secondary styling: outline, no fill. */}
          <button type="button" onClick={openEstate} className="inline-flex items-center gap-1.5 rounded-full hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            style={{ fontSize: 13, fontWeight: 600, color: hero.inkMuted, border: `1px solid ${glass.border}`, padding: '6px 14px' }}>
            <Boxes size={15} aria-hidden /> Estate knowledge graph
          </button>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 600, color: hero.ink, letterSpacing: -0.8, lineHeight: 1.15, marginTop: 12 }}>
          Trentar AI-ready Green Hyperscale Campus
        </h1>
        <p className="inline-flex items-center gap-1.5" style={{ fontSize: 17, color: hero.inkMuted, marginTop: 2 }}>
          <MapPin size={17} strokeWidth={1.8} aria-hidden /> Maharashtra
        </p>
        <div className="flex items-center gap-4" style={{ marginTop: 8 }}>
          <span className="rounded-full" style={{ fontSize: 12.5, color: hero.ink, border: '1px solid rgba(255,255,255,0.32)', padding: '5px 14px' }}>
            Preliminary Investment Readiness View
          </span>
          <span style={{ fontSize: 12, color: hero.inkDim }}>
            From public evidence to {formatAsOf(evidenceAsOf())}. Preliminary intelligence, not diligence.
          </span>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', marginTop: 16, fontSize: 26, fontWeight: 600, color: hero.ink, letterSpacing: -0.3, lineHeight: 1.15 }}>
          {heroStats().map((s, i) => <StatChip key={s.key} stat={s} index={i} />)}
        </div>
      </div>
    </header>
  );
}
