'use client';
// The only component permitted to render a Trentar figure. Throws if handed
// anything that did not come out of claim(): a raw number, a node, a copy.
// A required input renders as "Input required", never as a placeholder value.
//
// Variants:
//   badge  (default) value with its provenance badge beside it, for lists and tables
//   inline value text only, inheriting the surrounding type, for captions
//   figure a headline figure in its provenance treatment (see Figure below)
//   finding a research finding: one sentence, one phrase in semibold, a
//          provenance marker that opens its sources or basis
//   gap    the card's one quiet line naming what would move it
//   insight the card's action title: one sentence, one bold span, no glyph;
//          a click still opens its basis and sources
import { BadgeCheck, CircleDashed, ExternalLink, PenLine, Sigma } from 'lucide-react';
import { assertClaim, displayOf, formatAsOf } from '@/lib/trentar/view';
import ProvenanceBadge, { EvidencePanel, PROVENANCE_STYLE, usePopover } from './ProvenanceBadge';

const SIZES = { sm: 13, md: 15, lg: 22, xl: 30 };

export default function ClaimValue({ claim, size = 'md', badge = true, compactBadge = false, className = '', variant = 'badge', caption, quiet = false }) {
  const c = assertClaim(claim, 'ClaimValue');
  const d = displayOf(c);
  if (variant === 'figure') return <Figure claim={c} display={d} size={size} caption={caption} className={className} quiet={quiet} />;
  if (variant === 'insight') return <Insight claim={c} className={className} large={size === 'lg'} medium={size === 'md'} />;
  if (variant === 'compact') return <Compact claim={c} display={d} className={className} />;
  if (variant === 'finding') return <Finding claim={c} className={className} size={size} />;
  if (variant === 'gap') return <GapLine claim={c} className={className} />;
  // numeral: the number alone (a count's unit becomes the caller's label)
  if (variant === 'numeral') return <span className={className} data-provenance={c.provenance} data-claim={c.id}>{d.suffix ? d.main : d.text}</span>;
  if (variant === 'inline') return <span className={className} data-provenance={c.provenance} data-claim={c.id}>{d.text}</span>;
  const fontSize = SIZES[size] ?? SIZES.md;
  const required = d.kind === 'required';
  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`} data-provenance={c.provenance} data-claim={c.id}>
      <span
        style={{
          fontSize: required ? Math.max(12, fontSize * 0.62) : d.kind === 'statement' ? Math.min(fontSize, 15) : fontSize,
          fontWeight: required ? 600 : d.kind === 'number' ? 700 : 600,
          color: required ? '#B45309' : '#0F2D52',
          fontStyle: required ? 'italic' : 'normal',
          letterSpacing: d.kind === 'number' ? -0.3 : 0,
          lineHeight: 1.15,
        }}
      >
        {d.text}
      </span>
      {badge && <ProvenanceBadge claim={c} compact={compactBadge} />}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Figure: four provenance treatments that share one footprint.
//
//   PUBLIC_FACT            solid numeral, source chip beneath (publisher, date, link)
//   EAIQ_ANALYSIS          secondary-ink numeral, dotted underline, basis on hover/tap,
//                          three-step confidence meter where the node carries one
//   ILLUSTRATIVE_SCENARIO  light numeral on a hatched field, permanent "Illustrative" tag
//   TRENTAR_INPUT_REQUIRED no numeral: a dashed slot, "Input required" and the owner
//
// Every variant occupies the same box (value row + meta row), so a card of
// required inputs keeps the rhythm of a card of figures. The four are told
// apart by line style (solid / dotted / hatched / dashed), not by colour alone.
// ---------------------------------------------------------------------------

const FIG = {
  md: { num: 22, stmt: 13, valueH: 32, metaH: 20 },
  lg: { num: 30, stmt: 15, valueH: 36, metaH: 20 },
  xl: { num: 40, stmt: 21, valueH: 46, metaH: 22 },
  hero: { num: 44, stmt: 22, valueH: 54, metaH: 22 },
  display: { num: 56, stmt: 25, valueH: 64, metaH: 24, label: 15 },
};
const INK = { solid: '#0F2D52', secondary: '#46648A', light: '#5B4A8B', muted: '#6B7F99' };
const PAD = '6px 10px';
const HATCH = 'repeating-linear-gradient(135deg, rgba(109,40,217,0.10) 0 5px, rgba(109,40,217,0) 5px 11px)';

const CONF_STEPS = { Low: 1, Medium: 2, High: 3 };
const C_TEXT = '#0C233C';

/**
 * Words for an empty slot. The cockpit no longer draws one (gaps are stated
 * as open questions), but the treatment stays defined so that any
 * TRENTAR_INPUT_REQUIRED claim reaching a figure fails safe, never as a number.
 */
export function requiredSlot(c) {
  return { title: 'Input required', note: c.owner ? `Owner: ${c.owner}` : null };
}

function Figure({ claim: c, display: d, size, caption, className, quiet }) {
  const f = FIG[size] ?? FIG.lg;
  const pop = usePopover();
  const style = PROVENANCE_STYLE[c.provenance];
  // Layout, top to bottom: the value on its own line (numerals large and
  // alone; statements up to two smaller lines), the label beneath it, then
  // the provenance line. A required input puts a dashed box where the value
  // would be, so labels align across a row of mixed treatments.
  const num = d.kind === 'number';
  const label = d.suffix ? d.suffix[0].toUpperCase() + d.suffix.slice(1) : caption;
  const valueStyle = (weight, color, extra = {}) => ({
    fontSize: num ? f.num : f.stmt,
    fontWeight: weight,
    color,
    letterSpacing: num ? -0.8 : -0.1,
    ...(num
      ? { lineHeight: `${f.valueH}px`, whiteSpace: 'nowrap', display: 'block' }
      : { height: f.valueH, display: 'flex', alignItems: 'flex-end', width: '100%' }),
    ...extra,
  });
  const toggle = (e) => { e.stopPropagation(); pop.setOpen((o) => !o); };
  const stop = (e) => e.stopPropagation();
  const btn = 'text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded';

  let value;
  let meta = null;
  if (c.provenance === 'TRENTAR_INPUT_REQUIRED') {
    const slot = requiredSlot(c);
    value = (
      <button type="button" onClick={toggle} onDoubleClick={stop} aria-expanded={pop.open} aria-controls={pop.panelId}
        title="Why this input is needed" className={`w-full flex items-center gap-2 rounded-lg ${btn}`}
        style={{ height: f.valueH, padding: '0 14px', border: '1.5px dashed #AEBBCD', background: 'rgba(255,255,255,0.5)', fontSize: 13.5, fontWeight: 600, color: INK.muted }}>
        <CircleDashed size={15} strokeWidth={2} aria-hidden className="flex-shrink-0" />{slot.title}
      </button>
    );
    if (slot.note) meta = <span className="truncate block" style={{ fontSize: 11.5, color: '#8FA2BA' }}>{slot.note}</span>;
  } else if (c.provenance === 'PUBLIC_FACT') {
    const [src] = c.evidence;
    value = (
      <button type="button" onClick={toggle} onDoubleClick={stop} aria-expanded={pop.open} aria-controls={pop.panelId}
        title="Public fact: show all sources" className={btn} style={valueStyle(700, INK.solid)}><FigureText d={d} f={f} /></button>
    );
    meta = (
      <a href={src.url} target="_blank" rel="noopener noreferrer" onClick={stop} onDoubleClick={stop}
        className="inline-flex items-center gap-1 rounded-full hover:underline min-w-0"
        style={{ fontSize: 11, fontWeight: 600, color: style.fg, border: `1px solid ${INK.solid}33`, background: '#fff', padding: '2px 8px', maxWidth: '100%' }}>
        <BadgeCheck size={11} strokeWidth={2.25} aria-hidden className="flex-shrink-0" />
        <span className="truncate">{src.publisher}</span>
        <span className="whitespace-nowrap flex-shrink-0">· {formatAsOf(src.asOf)}</span>
        <ExternalLink size={10} aria-hidden className="flex-shrink-0" />
      </a>
    );
  } else if (c.provenance === 'EAIQ_ANALYSIS') {
    value = (
      <button type="button" onClick={toggle} onDoubleClick={stop} onMouseEnter={() => pop.setOpen(true)}
        aria-expanded={pop.open} aria-controls={pop.panelId} title="EAiQ analysis: show the basis" className={btn}
        style={valueStyle(700, INK.secondary, { textDecoration: 'underline dotted', textDecorationThickness: 2, textUnderlineOffset: 6, textDecorationColor: '#8EA6C6' })}>
        <FigureText d={d} f={f} />
      </button>
    );
    meta = quiet ? null : (
      <span className="inline-flex items-center gap-2" style={{ fontSize: 11, fontWeight: 600, color: style.fg }}>
        <span className="inline-flex items-center gap-1"><Sigma size={11} strokeWidth={2.25} aria-hidden />EAiQ analysis</span>
        {c.confidence && <ConfidenceMeter value={c.confidence} />}
      </span>
    );
  } else {
    value = (
      <button type="button" onClick={toggle} onDoubleClick={stop} aria-expanded={pop.open} aria-controls={pop.panelId}
        title="Illustrative scenario: show the assumption" className={btn} style={valueStyle(400, INK.light)}>
        <FigureText d={d} f={f} />
      </button>
    );
    meta = (
      <span className="inline-flex items-center gap-1 rounded-full"
        style={{ fontSize: 11, fontWeight: 700, color: style.fg, background: '#fff', border: style.border, padding: '2px 8px', letterSpacing: 0.2 }}>
        <PenLine size={11} strokeWidth={2.25} aria-hidden />Illustrative
      </span>
    );
  }

  return (
    <div ref={pop.ref} className={`relative min-w-0 ${className}`} data-provenance={c.provenance} data-claim={c.id}
      onMouseLeave={c.provenance === 'EAIQ_ANALYSIS' ? () => pop.setOpen(false) : undefined}>
      <div className="rounded-lg" style={{ padding: PAD, background: c.provenance === 'ILLUSTRATIVE_SCENARIO' ? HATCH : 'transparent' }}>
        {value}
        {label && <p className="truncate" style={{ fontSize: f.label ?? 13, fontWeight: 500, color: '#43536B', marginTop: 4, lineHeight: 1.3 }}>{label}</p>}
        {(meta || !quiet) && <div className="flex items-center min-w-0" style={{ height: f.metaH, marginTop: 6 }}>{meta}</div>}
      </div>
      {pop.open && <EvidencePanel id={pop.panelId} claim={c} style={style} onClose={() => pop.setOpen(false)} />}
    </div>
  );
}

/** A figure's value: for a count, the numeral alone (its unit becomes the label). */
function FigureText({ d, f }) {
  if (d.kind === 'number') return d.suffix ? d.main : d.text;
  return (
    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: `${Math.round(f.stmt * 1.2)}px` }}>{d.text}</span>
  );
}

/** Three steps, filled to the node's recorded confidence; the word says it too. */
function ConfidenceMeter({ value }) {
  const n = CONF_STEPS[value] ?? 0;
  return (
    <span className="inline-flex items-center gap-1" title={`${value} confidence`} style={{ color: '#5B7290', fontWeight: 600 }}>
      <span className="inline-flex items-end gap-px" aria-hidden>
        {['a', 'b', 'c'].map((k, i) => (
          <span key={k} style={{ width: 4, height: 5 + i * 3, borderRadius: 1, background: i < n ? '#46648A' : 'transparent', border: '1px solid #46648A' }} />
        ))}
      </span>
      {value} confidence
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compact: the same four line styles at list size, for key-input rows and
// tables. A value shows only where the node has one; otherwise the pill names
// the class. Every pill opens the claim's sources or basis.
// ---------------------------------------------------------------------------
const PILL = {
  PUBLIC_FACT: { word: 'Evidenced', style: { border: '1.5px solid #0F5C4A', color: '#0F5C4A', background: '#FFFFFF' } },
  EAIQ_ANALYSIS: { word: 'Assessed', style: { border: '1.5px dotted #1D4ED8', color: '#1D4ED8', background: '#FFFFFF' } },
  ILLUSTRATIVE_SCENARIO: { word: 'Illustrative', style: { border: '1px solid #A78BFA', color: '#5B21B6', background: HATCH } },
  TRENTAR_INPUT_REQUIRED: { word: 'Input required', style: { border: '1.5px dashed #AEBBCD', color: '#6B7F99', background: '#FFFFFF' } },
};

function Compact({ claim: c, display: d, className }) {
  const pop = usePopover();
  const p = PILL[c.provenance];
  const required = c.provenance === 'TRENTAR_INPUT_REQUIRED';
  const slot = required ? requiredSlot(c) : null;
  const hasValue = !required && c.value !== null;
  return (
    <span ref={pop.ref} className={`relative inline-flex flex-col items-end ${className}`} data-provenance={c.provenance} data-claim={c.id}>
      <button type="button" onClick={(e) => { e.stopPropagation(); pop.setOpen((o) => !o); }} onDoubleClick={(e) => e.stopPropagation()}
        aria-expanded={pop.open} aria-controls={pop.panelId} title={required ? 'Why this input is needed' : 'Show sources or basis'}
        className="inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-full">
        {hasValue && (
          <span style={{ fontSize: 13.5, fontWeight: c.provenance === 'ILLUSTRATIVE_SCENARIO' ? 400 : 700, color: c.provenance === 'PUBLIC_FACT' ? INK.solid : INK.secondary, whiteSpace: 'nowrap',
            ...(c.provenance === 'EAIQ_ANALYSIS' ? { textDecoration: 'underline dotted', textUnderlineOffset: 3, textDecorationColor: '#8EA6C6' } : {}) }}>
            {d.text}
          </span>
        )}
        <span className="inline-flex items-center rounded-full whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', ...p.style }}>
          {required ? slot.title : p.word}
        </span>
      </button>
      {slot?.note && <span className="truncate" style={{ fontSize: 10.5, color: '#8FA2BA', marginTop: 2, maxWidth: 260 }}>{slot.note}</span>}
      {pop.open && <EvidencePanel id={pop.panelId} claim={c} style={PROVENANCE_STYLE[c.provenance]} onClose={() => pop.setOpen(false)} align="right" />}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Finding: a research sentence. The marker repeats the line-style vocabulary
// (solid, dotted, hatched, dashed) at glyph size; the emphasis phrase is the
// only semibold span. EAiQ views sit indented under the fact they read.
// ---------------------------------------------------------------------------
const MARK = {
  PUBLIC_FACT: { Icon: BadgeCheck, style: { color: '#0F5C4A', border: '1.5px solid #0F5C4A', background: '#FFFFFF' } },
  EAIQ_ANALYSIS: { Icon: Sigma, style: { color: '#1D4ED8', border: '1.5px dotted #1D4ED8', background: '#FFFFFF' } },
  ILLUSTRATIVE_SCENARIO: { Icon: PenLine, style: { color: '#5B21B6', border: '1px solid #A78BFA', background: HATCH } },
  TRENTAR_INPUT_REQUIRED: { Icon: CircleDashed, style: { color: '#6B7F99', border: '1.5px dashed #AEBBCD', background: '#FFFFFF' } },
};

function Emphasised({ text, emphasis }) {
  const i = emphasis ? text.indexOf(emphasis) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <strong style={{ fontWeight: 650, color: INK.solid }}>{emphasis}</strong>
      {text.slice(i + emphasis.length)}
    </>
  );
}

// Finding sizes: md on cards and lists, lg in the drill-down, xl for open questions.
const FINDING = { md: { font: 15.5, mark: 22, icon: 12 }, lg: { font: 19, mark: 26, icon: 14 }, xl: { font: 22, mark: 30, icon: 16 } };

function Finding({ claim: c, className, size }) {
  const fz = FINDING[size] ?? FINDING.md;
  const pop = usePopover();
  const m = MARK[c.provenance];
  const view = c.label.startsWith('EAiQ view: ');
  const text = view ? c.label.slice('EAiQ view: '.length) : c.label;
  return (
    <div ref={pop.ref} className={`relative flex items-start gap-2.5 ${className}`} data-provenance={c.provenance} data-claim={c.id}
      style={view ? { paddingLeft: 12, borderLeft: '2px dotted #93B4F5' } : undefined}>
      <button type="button" onClick={(e) => { e.stopPropagation(); pop.setOpen((o) => !o); }} onDoubleClick={(e) => e.stopPropagation()}
        aria-expanded={pop.open} aria-controls={pop.panelId} title={`${PROVENANCE_STYLE[c.provenance].long}: show ${c.provenance === 'PUBLIC_FACT' ? 'sources' : 'basis and sources'}`}
        className="flex-shrink-0 inline-flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        style={{ width: fz.mark, height: fz.mark, marginTop: Math.round(fz.font * 0.12), ...m.style }}>
        <m.Icon size={fz.icon} strokeWidth={2.25} aria-hidden />
      </button>
      <p className="min-w-0" style={{ fontSize: fz.font, lineHeight: 1.45, color: '#2E405C' }}>
        {view && <span style={{ fontWeight: 650, color: '#1D4ED8' }}>EAiQ view: </span>}
        <Emphasised text={text} emphasis={c.emphasis} />
      </p>
      {pop.open && <EvidencePanel id={pop.panelId} claim={c} style={PROVENANCE_STYLE[c.provenance]} onClose={() => pop.setOpen(false)} />}
    </div>
  );
}

function GapLine({ claim: c, className }) {
  const pop = usePopover();
  return (
    <div ref={pop.ref} className={`relative ${className}`} data-provenance={c.provenance} data-claim={c.id}>
      <button type="button" onClick={(e) => { e.stopPropagation(); pop.setOpen((o) => !o); }} onDoubleClick={(e) => e.stopPropagation()}
        aria-expanded={pop.open} aria-controls={pop.panelId} title="What would move this card"
        className="w-full flex items-start gap-2 text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        style={{ fontSize: 12.5, lineHeight: 1.4, color: INK.muted }}>
        <CircleDashed size={14} strokeWidth={2} aria-hidden className="flex-shrink-0" style={{ marginTop: 1 }} />
        <span>{c.label}</span>
      </button>
      {pop.open && <EvidencePanel id={pop.panelId} claim={c} style={PROVENANCE_STYLE[c.provenance]} onClose={() => pop.setOpen(false)} />}
    </div>
  );
}

function Insight({ claim: c, className, large = false, medium = false }) {
  const pop = usePopover();
  return (
    <div ref={pop.ref} className={`relative ${className}`} data-provenance={c.provenance} data-claim={c.id}>
      <button type="button" onClick={(e) => { e.stopPropagation(); pop.setOpen((o) => !o); }} onDoubleClick={(e) => e.stopPropagation()}
        aria-expanded={pop.open} aria-controls={pop.panelId} title={`${PROVENANCE_STYLE[c.provenance].long}: show basis and sources`}
        className="text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        style={{ fontSize: large ? 30 : medium ? 17.5 : 14.5, lineHeight: large ? 1.3 : 1.4, color: large || medium ? C_TEXT : '#3A5272', fontWeight: large ? 500 : 400, letterSpacing: large ? -0.3 : 0 }}>
        <Emphasised text={c.label} emphasis={c.emphasis} />
      </button>
      {pop.open && <EvidencePanel id={pop.panelId} claim={c} style={PROVENANCE_STYLE[c.provenance]} onClose={() => pop.setOpen(false)} />}
    </div>
  );
}
