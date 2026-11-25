'use client';
// One chart per card, from researchFor(card).chart. Flat and directly labelled:
// no gridlines, no legend where a label will do, one accent hue (the card's)
// for the marked value, neutral ink for the rest. Illustrative values are
// hatched and EAiQ-derived ones dotted, so the chart reads in greyscale.
//
// Every number drawn comes from a claim (its displayOf text); the whole chart
// sits inside its own chart claim, whose provenance is the weakest of its
// points and whose sources are captioned beneath it.
import { useId } from 'react';
import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { displayOf, formatAsOf } from '@/lib/trentar/view';
import { EvidencePanel, PROVENANCE_STYLE, usePopover } from '../ProvenanceBadge';
import { C, cardHue } from '../tokens';

// KPMG palette: blue family for the market, teal for Trentar's own figure.
const INK = '#4A7CC9';
const INK_DARK = '#0C233C';
const KPMG_BLUE = '#00338D';
const KPMG_LIGHT = '#0091DA';
const MARK = '#00A3A1';
const text = (c) => displayOf(c).text;

function Patterns({ id, hue }) {
  return (
    <defs>
      <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={KPMG_LIGHT} /><stop offset="1" stopColor={KPMG_BLUE} /></linearGradient>
      <pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#FFFFFF" /><rect width="2.4" height="6" fill={MARK} />
      </pattern>
      <pattern id={`${id}-dots`} width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="#E2F5F4" /><circle cx="2.5" cy="2.5" r="1.5" fill={MARK} />
      </pattern>
    </defs>
  );
}

// Fill for a point: marked values take the hue, patterned by provenance.
function fillFor(id, b, hue) {
  if (b.claim.provenance === 'ILLUSTRATIVE_SCENARIO') return `url(#${id}-hatch)`;
  if (!b.mark) return `url(#${id}-bar)`;
  if (b.claim.provenance === 'EAIQ_ANALYSIS') return `url(#${id}-dots)`;
  return MARK;
}

// Smaller type on the card when many bars share its width.
function barFont(compact, n) { if (!compact) return 16; return n > 4 ? 9 : 10; }

function Bars({ chart, hue, compact, id }) {
  const bars = chart.sortBy === 'value' ? [...chart.bars].sort((a, b) => a.claim.value - b.claim.value) : chart.bars;
  const data = bars.map((b) => ({ name: b.label, value: b.claim.value, label: text(b.claim), b }));
  const ref = chart.reference;
  const max = Math.max(...data.map((d) => d.value), ref?.claim.value ?? 0);
  const fs = barFont(compact, data.length);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: compact ? 16 : 28, right: ref ? (compact ? 58 : 96) : 4, left: 4, bottom: 0 }} barCategoryGap={compact ? '22%' : '26%'}>
        <Patterns id={id} hue={hue} />
        <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#C9D6EA' }} interval={0} tick={{ fontSize: fs, fill: '#43536B' }} height={compact ? 28 : 40} />
        <YAxis hide domain={[0, max * 1.12]} />
        {ref && (
          <ReferenceLine y={ref.claim.value} stroke={MARK} strokeWidth={2.5} strokeDasharray="6 4"
            label={{ value: `${ref.label} ${text(ref.claim)}`, position: 'right', fontSize: fs, fill: '#00807E', fontWeight: 700, width: compact ? 56 : 90 }} />
        )}
        <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.name} fill={fillFor(id, d.b, hue)} stroke={d.b.mark ? MARK : 'none'} strokeWidth={d.b.mark ? 2 : 0} />)}
          <LabelList dataKey="label" position="top" style={{ fontSize: fs, fill: INK_DARK, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function HBars({ chart, hue, compact, id }) {
  const data = chart.bars.map((b) => ({ name: b.label, value: b.claim.value, label: text(b.claim), b }));
  const fs = compact ? 10 : 16;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: compact ? 52 : 96, left: 0, bottom: 4 }} barCategoryGap="26%">
        <Patterns id={id} hue={hue} />
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={compact ? 92 : 190} tick={{ fontSize: fs, fill: '#43536B' }} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.name} fill={fillFor(id, d.b, hue)} stroke={d.b.mark ? MARK : 'none'} strokeWidth={d.b.mark ? 2 : 0} />)}
          <LabelList dataKey="label" position="right" style={{ fontSize: fs, fill: INK_DARK, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const STATE_FILL = { FID_GATE: KPMG_BLUE, FID_CONDITION: KPMG_LIGHT, POST_FID_OPTIMISATION: '#BFD9F2' };
const STATE_WORD = { FID_GATE: 'Gates', FID_CONDITION: 'Conditions', POST_FID_OPTIMISATION: 'Post-FID' };

function segTotal(b) { return b.segments.reduce((t, s) => t + s.claim.value, 0); }

function Stacked({ chart, compact }) {
  const fs = compact ? 10 : 16;
  const most = Math.max(...chart.bars.map(segTotal));
  return (
    <div className="h-full flex flex-col justify-center" style={{ gap: compact ? 2 : 8 }}>
      {chart.bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2">
          <span className="flex-shrink-0 text-right" style={{ width: compact ? 62 : 110, fontSize: compact ? 9 : fs, lineHeight: compact ? '10px' : undefined, color: C.text2 }}>{b.label}</span>
          <span className="flex gap-0.5 flex-1">
            {b.segments.map((s) => (
              <span key={s.state} data-claim={s.claim.id} className="flex items-center justify-center rounded-sm"
                style={{ width: `${(s.claim.value / most) * 100}%`, flex: 'none', height: compact ? 10 : 19, background: STATE_FILL[s.state], color: '#FFFFFF', fontSize: fs - 1, fontWeight: 700 }}>
                {text(s.claim)}
              </span>
            ))}
          </span>
        </div>
      ))}
      <span className="flex gap-4" style={{ fontSize: fs - 1, color: C.text2, paddingLeft: compact ? 70 : 118, marginTop: compact ? 0 : 6 }}>
        {['FID_GATE', 'FID_CONDITION'].map((st) => (
          <span key={st} className="inline-flex items-center gap-1"><span className="inline-block rounded-sm" style={{ width: 9, height: 9, background: STATE_FILL[st] }} />{STATE_WORD[st]}</span>
        ))}
      </span>
    </div>
  );
}

function Path({ chart, hue, compact }) {
  const n = chart.steps.length;
  const fs = compact ? 9.5 : 16;
  return (
    <div className="h-full flex flex-col justify-center" style={{ gap: compact ? 6 : 18 }}>
      <div className="relative flex items-center justify-between" style={{ padding: '0 4px' }}>
        <span className="absolute left-2 right-2" style={{ top: '50%', height: 2, background: '#D6DEE9' }} />
        {chart.steps.map((step) => (
          <span key={step.label} title={step.label} className="relative rounded-full"
            style={{ width: compact ? 11 : 22, height: compact ? 11 : 22, background: step.stage === 0 ? KPMG_BLUE : '#FFFFFF', border: `3px solid ${KPMG_BLUE}` }} />
        ))}
      </div>
      {compact ? (
        <div className="flex justify-between" style={{ fontSize: fs, color: C.text2 }}>
          <span>{chart.steps[0].label}</span>
          <span className="text-right">{chart.steps[n - 1].label}</span>
        </div>
      ) : (
        <ol className="grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', fontSize: fs - 1, color: '#2E405C' }}>
          {chart.steps.map((step, i) => (
            <li key={step.label} className="flex items-baseline gap-2">
              <span style={{ color: KPMG_BLUE, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>{step.label}
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap gap-1.5" style={{ fontSize: fs }}>
        {chart.policy.map((c) => (
          <span key={c.id} data-claim={c.id} className="inline-flex items-center gap-1 rounded" style={{ border: `1.5px solid ${hue}`, color: hue, padding: '1px 6px', fontWeight: 600 }}>
            <span aria-hidden style={{ width: 7, height: 7, background: hue, transform: 'rotate(45deg)', display: 'inline-block' }} />{c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Tradeoff({ chart, hue, compact }) {
  const W = 300; const H = compact ? 120 : 190;
  const pad = { l: 26, r: 10, t: 10, b: 22 };
  const x = (v) => pad.l + ((v + 0.5) / 3) * (W - pad.l - pad.r);
  const y = (v) => H - pad.b - ((v + 0.5) / 3) * (H - pad.t - pad.b);
  const fs = compact ? 9.5 : 11.5;
  const pts = [...chart.points].sort((a, b) => a.power - b.power);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" role="img" aria-label={chart.claim.label}>
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#D6DEE9" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#D6DEE9" />
      <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize={fs} fill={C.text2}>{compact ? 'Power overhead →' : 'Power overhead: lower → higher'}</text>
      <text x={10} y={H - pad.b} transform={`rotate(-90 10 ${H - pad.b})`} fontSize={fs} fill={C.text2}>{compact ? 'Water draw →' : 'Water draw: lower → higher'}</text>
      <polyline points={pts.map((p) => `${x(p.power)},${y(p.water)}`).join(' ')} fill="none" stroke={hue} strokeWidth="1.5" strokeDasharray="3 3" />
      {pts.map((p) => (
        <g key={p.label} data-claim={p.claim.id}>
          <circle cx={x(p.power)} cy={y(p.water)} r={compact ? 4.5 : 6} fill="#FFFFFF" stroke={hue} strokeWidth="2" strokeDasharray="2 1.5" />
          <text x={x(p.power) + (p.power === 2 ? -8 : 8)} y={y(p.water) + 3.5} textAnchor={p.power === 2 ? 'end' : 'start'} fontSize={fs} fill={INK_DARK} fontWeight="600">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

const KINDS = { bars: Bars, hbars: HBars, stackedBars: Stacked, path: Path, tradeoff: Tradeoff };

/** Caption: the chart claim's provenance and first source, opening all of them. */
function Caption({ claim: c, compact }) {
  const pop = usePopover();
  const st = PROVENANCE_STYLE[c.provenance];
  const src = c.evidence[0];
  return (
    <div ref={pop.ref} className="relative">
      <button type="button" onClick={(e) => { e.stopPropagation(); pop.setOpen((o) => !o); }} onDoubleClick={(e) => e.stopPropagation()}
        aria-expanded={pop.open} aria-controls={pop.panelId} title="Chart sources and basis"
        className="inline-flex items-center gap-1.5 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 max-w-full"
        style={{ fontSize: compact ? 10.5 : 14.5, color: C.text2 }}>
        <span className="flex-shrink-0 rounded-full" style={{ color: st.fg, border: st.border, background: st.bg, padding: '0 6px', fontWeight: 600 }}>{st.long}</span>
        {src && <span className="truncate">{src.publisher} · {formatAsOf(src.asOf)}{c.evidence.length > 1 ? ' and others' : ''}</span>}
      </button>
      {pop.open && <EvidencePanel id={pop.panelId} claim={c} style={st} onClose={() => pop.setOpen(false)} />}
    </div>
  );
}

export default function ResearchChart({ cardId, chart, compact = true, height, caption = true }) {
  const id = useId().replace(/:/g, '');
  const Kind = KINDS[chart.kind];
  const hue = cardHue[cardId].ink;
  return (
    <figure className="min-w-0 flex flex-col" data-provenance={chart.claim.provenance} data-claim={chart.claim.id} aria-label={chart.claim.label}>
      {!compact && <figcaption style={{ fontSize: 20, fontWeight: 650, color: '#0C233C', marginBottom: 18, lineHeight: 1.3 }}>{chart.claim.label}</figcaption>}
      <div style={{ height: height ?? (compact ? 120 : 220) }}>
        <Kind chart={chart} hue={hue} compact={compact} id={id} />
      </div>
      {caption && <div style={{ marginTop: compact ? 2 : 8 }}><Caption claim={chart.claim} compact={compact} /></div>}
    </figure>
  );
}
