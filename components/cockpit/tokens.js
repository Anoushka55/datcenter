// Design tokens for presentation cockpits (KPMG navy and blue on white).
import { BarChart3, TrendingUp, Zap, Leaf, Target, Star } from 'lucide-react';

export const C = {
  pageBg: '#F4F7FB',
  shell: '#0C2847',
  shellDeep: '#081F3A',
  panel: '#FFFFFF',
  navy: '#0F2D52',
  navyBlue: '#1E3A8A',
  blue: '#2563EB',
  accent: '#3B82F6',
  light: '#7DB4F0',
  pale: '#C7DCF5',
  tint: '#EFF5FD',
  green: '#10B981',
  greenDeep: '#059669',
  greenTint: '#ECFDF5',
  violet: '#7C6CF0',
  text: '#0F2D52',
  text2: '#5B7290',
  muted: '#8FA8C8',
  onDark: '#FFFFFF',
  onDarkDim: '#A8C4E0',
  border: '#E2E9F2',
};

export const ICONS = { bars: BarChart3, trend: TrendingUp, zap: Zap, leaf: Leaf, target: Target, star: Star };

export const TINTS = {
  blue: { bg: '#E3EDFC', fg: C.blue, card: C.tint },
  green: { bg: '#D9F5EA', fg: C.greenDeep, card: C.greenTint },
};

export const FONT = "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";

// Entrance timing: KPI strip, then row 1, then row 2.
export const ENTER = { kpiStart: 0.15, kpiStep: 0.06, row1Start: 0.5, row1Step: 0.08, row2Start: 0.85, row2Step: 0.08 };
export const enter = (delay) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

// ---------------------------------------------------------------------------
// Additions for the Trentar cockpit. Nothing above this line changes, so the
// Tata Power cockpit renders exactly as before.
// ---------------------------------------------------------------------------

// Abstract hero band: gradient field, faint line motif, right-edge scrim.
// KPMG brand palette (core blues, purple and teal) for the Trentar cockpit.
export const kpmg = {
  blue: '#00338D',
  cobalt: '#005EB8',
  lightBlue: '#0091DA',
  purple: '#483698',
  violet: '#470A68',
  teal: '#00A3A1',
  darkBlue: '#0C233C',
  ink: '#0C233C',
  ink2: '#43536B',
  muted: '#7A8AA3',
};

export const hero = {
  stops: ['#06173F', '#00338D', '#005EB8'],
  glow: 'rgba(0,145,218,0.32)',
  motif: 'rgba(170,205,255,0.16)',
  motifStrong: 'rgba(170,205,255,0.26)',
  scrim: 'linear-gradient(90deg, rgba(10,27,58,1) 0%, rgba(10,27,58,0.92) 38%, rgba(10,27,58,0.35) 72%, rgba(10,27,58,0) 100%)',
  ink: '#FFFFFF',
  inkMuted: 'rgba(255,255,255,0.80)',
  inkDim: 'rgba(214,228,250,0.72)',
};

// Glass chips on the hero.
export const glass = {
  fill: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.16)',
  blur: 12,
  highlight: 'inset 0 1px 0 rgba(255,255,255,0.14)',
  tile: 'rgba(255,255,255,0.10)',
  // Lit stat chips: brighter fill and edge, a top-edge highlight, a soft lift.
  chipFill: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
  chipBorder: 'rgba(255,255,255,0.22)',
  chipShadow: 'inset 0 1px 0 rgba(255,255,255,0.30), inset 0 0 18px rgba(147,197,253,0.10), 0 10px 26px rgba(4,12,32,0.28)',
  chipTile: 'linear-gradient(180deg, rgba(147,197,253,0.34) 0%, rgba(96,165,250,0.20) 100%)',
  chipTileBorder: 'rgba(191,219,254,0.40)',
};

// One hue per Trentar card: hue for accents, tint for the icon tile, ink for the glyph.
export const cardHue = {
  fid: { hue: '#00338D', tint: '#E3EAF6', ink: '#00338D', wash: '#EEF2FB' },
  site: { hue: '#483698', tint: '#ECE8F7', ink: '#483698', wash: '#F2EFFB' },
  power: { hue: '#0091DA', tint: '#E0F2FB', ink: '#0077B6', wash: '#ECF7FD' },
  regulatory: { hue: '#6D2077', tint: '#F1E7F3', ink: '#5E1A68', wash: '#F6F0F8' },
  esg: { hue: '#00A3A1', tint: '#DDF4F3', ink: '#00807E', wash: '#EBF8F7' },
  commercial: { hue: '#005EB8', tint: '#E1EDF8', ink: '#005EB8', wash: '#EDF4FB' },
};

export const elevation = {
  card: '0 1px 2px rgba(15,45,82,0.04), 0 6px 18px rgba(15,45,82,0.06)',
  cardHover: '0 2px 4px rgba(15,45,82,0.06), 0 14px 32px rgba(15,45,82,0.12)',
  modal: '0 24px 64px rgba(8,20,44,0.28), 0 4px 12px rgba(8,20,44,0.10)',
};

// Provenance line styles: solid, dotted, hatched, dashed. Shared by figures,
// the provenance meter and the drill-down matrix, so all three read alike in
// greyscale as well as in colour.
export const provenance = {
  PUBLIC_FACT: { label: 'Evidenced', ink: '#0F2D52', fill: { background: '#0F5C4A' }, dot: { background: '#0F5C4A' } },
  EAIQ_ANALYSIS: {
    label: 'Assessed', ink: '#46648A', underline: '#8EA6C6',
    fill: { background: 'radial-gradient(circle, #1D4ED8 1.1px, #C9DAFB 1.3px) 0 0 / 4px 4px' },
    dot: { background: 'radial-gradient(circle, #1D4ED8 0.9px, #DCE7FD 1.1px) 0 0 / 3px 3px', border: '1px solid #1D4ED8' },
  },
  ILLUSTRATIVE_SCENARIO: {
    label: 'Illustrative', ink: '#5B4A8B',
    field: 'repeating-linear-gradient(135deg, rgba(109,40,217,0.10) 0 5px, rgba(109,40,217,0) 5px 11px)',
    fill: { background: 'repeating-linear-gradient(135deg, #7C5CD6 0 2px, #EEE8FD 2px 5px)' },
    dot: { background: 'repeating-linear-gradient(135deg, #7C5CD6 0 1.5px, #FFFFFF 1.5px 3.5px)', border: '1px solid #7C5CD6' },
  },
  TRENTAR_INPUT_REQUIRED: {
    label: 'Input required', ink: '#6B7F99', slot: '1.5px dashed #AEBBCD',
    fill: { background: '#FFFFFF', border: '1px dashed #8C9DB5' },
    dot: { background: '#FFFFFF', border: '1.5px dashed #8C9DB5' },
  },
};
