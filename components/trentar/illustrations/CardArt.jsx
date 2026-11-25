'use client';
// Card illustrations: hand-built SVG in the reference's soft, glassy 3D
// style, in the KPMG palette. Concept art only (a checklist, a map pin, wind
// and solar, a civic building, water, a rising chart): nothing depicts
// Trentar's site or assets, which do not yet exist. No external images, so
// no licensing question in a client deliverable, and crisp at any size.
import { useId } from 'react';

const K = {
  blue: '#00338D', cobalt: '#005EB8', sky: '#0091DA', purple: '#483698', violet: '#7B5CC4', teal: '#00A3A1', ice: '#E6F0FB', lav: '#EEEBFA', mint: '#E2F5F4',
};

function Shadow({ cx, cy, rx, ry }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#0B1F4D" opacity="0.10" />;
}

function Checklist({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor={K.lav} /></linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C9D8F5" /><stop offset="1" stopColor="#9DB6EA" /></linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.teal} /><stop offset="1" stopColor="#00807E" /></linearGradient>
        <linearGradient id={`${id}pen`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={K.violet} /><stop offset="1" stopColor={K.purple} /></linearGradient>
      </defs>
      <Shadow cx="112" cy="146" rx="78" ry="9" />
      <g transform="rotate(-9 110 80)">
        <rect x="52" y="22" width="112" height="124" rx="12" fill={`url(#${id}b)`} />
        <rect x="48" y="16" width="112" height="124" rx="12" fill={`url(#${id}p)`} stroke="#C7D3EE" />
        <rect x="84" y="8" width="40" height="16" rx="6" fill={K.cobalt} />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${i * 32})`}>
            <circle cx="72" cy="46" r="10" fill={`url(#${id}c)`} />
            <path d="M67 46 l4 4 l7 -8" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="90" y="40" width="54" height="5" rx="2.5" fill="#B9C8E8" />
            <rect x="90" y="49" width="36" height="4" rx="2" fill="#D6DFF2" />
          </g>
        ))}
      </g>
      <g transform="rotate(38 176 96)">
        <rect x="150" y="90" width="58" height="11" rx="5.5" fill={`url(#${id}pen)`} />
        <path d="M208 90 l12 5.5 l-12 5.5 z" fill="#2B1F66" />
        <rect x="150" y="90" width="10" height="11" rx="3" fill={K.sky} />
      </g>
    </>
  );
}

function MapPin({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4F8FE" /><stop offset="1" stopColor="#D3E2F7" /></linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B7CBEB" /><stop offset="1" stopColor="#8FA9D9" /></linearGradient>
        <linearGradient id={`${id}pin`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={K.violet} /><stop offset="1" stopColor={K.purple} /></linearGradient>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={K.sky} stopOpacity="0.35" /><stop offset="1" stopColor={K.sky} stopOpacity="0" /></radialGradient>
      </defs>
      <Shadow cx="110" cy="146" rx="86" ry="8" />
      <path d="M110 64 L196 104 L110 144 L24 104 Z" fill={`url(#${id}t)`} stroke="#C4D4EE" />
      <path d="M24 104 L110 144 L110 152 L24 112 Z" fill={`url(#${id}s)`} />
      <path d="M196 104 L110 144 L110 152 L196 112 Z" fill="#A4BBE3" />
      <path d="M52 92 L138 132 M80 78 L166 118 M60 118 L146 78 M88 132 L170 92" stroke="#B5C8E8" strokeWidth="2" />
      <path d="M44 100 C70 96 90 120 120 112 C150 104 160 120 182 108" stroke={K.sky} strokeWidth="3" fill="none" opacity="0.7" />
      {[[70, 104], [134, 96], [150, 116]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <path d={`M${x} ${y} l8 -4 l8 4 l-8 4 z`} fill="#FFFFFF" />
          <path d={`M${x} ${y} v-8 l8 -4 v8 z`} fill="#DCE6F6" />
          <path d={`M${x + 16} ${y} v-8 l-8 -4 v8 z`} fill="#C3D3EE" />
        </g>
      ))}
      <ellipse cx="110" cy="104" rx="28" ry="12" fill={`url(#${id}g)`} />
      <ellipse cx="110" cy="104" rx="9" ry="4" fill="#0B1F4D" opacity="0.18" />
      <path d="M110 104 C96 84 86 72 86 58 a24 24 0 0 1 48 0 C134 72 124 84 110 104 Z" fill={`url(#${id}pin)`} />
      <circle cx="110" cy="58" r="9" fill="#FFFFFF" />
      <path d="M98 44 a16 16 0 0 1 10 -8" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  );
}

function WindSolar({ id }) {
  const turbine = (x, y, s) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-2 0 L2 0 L3.5 80 L-3.5 80 Z" fill="#E9EEF7" stroke="#C4D0E4" />
      <g>
        {[0, 120, 240].map((r) => <path key={r} d="M0 0 C3 -10 4 -30 0 -44 C-3 -30 -3 -10 0 0 Z" fill="#FFFFFF" stroke="#C4D0E4" transform={`rotate(${r + 15})`} />)}
      </g>
      <circle r="4" fill={K.cobalt} />
    </g>
  );
  return (
    <>
      <defs>
        <linearGradient id={`${id}sol`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={K.sky} /><stop offset="1" stopColor={K.blue} /></linearGradient>
        <linearGradient id={`${id}gr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6F4F3" /><stop offset="1" stopColor="#CFEAE8" /></linearGradient>
      </defs>
      <Shadow cx="112" cy="148" rx="90" ry="8" />
      <path d="M20 132 Q110 112 204 132 L204 146 L20 146 Z" fill={`url(#${id}gr)`} />
      {turbine(150, 58, 1)}
      {turbine(186, 76, 0.75)}
      {turbine(118, 80, 0.6)}
      {[0, 1].map((r) => (
        <g key={r} transform={`translate(${r * 46} ${r * 6})`}>
          <path d="M28 128 L70 128 L84 104 L42 104 Z" fill={`url(#${id}sol)`} stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M42 128 L56 104 M56 128 L70 104 M35 116 L77 116" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.2" />
          <path d="M50 128 L50 136 M66 128 L66 136" stroke="#9AAED0" strokeWidth="2.5" />
        </g>
      ))}
    </>
  );
}

function CivicBuilding({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor={K.lav} /></linearGradient>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#CFC6F0" /><stop offset="1" stopColor={K.violet} /></linearGradient>
      </defs>
      <Shadow cx="110" cy="150" rx="88" ry="8" />
      <rect x="30" y="134" width="160" height="10" rx="2" fill="#D8D1F1" />
      <rect x="38" y="126" width="144" height="10" rx="2" fill="#E5E0F6" />
      <rect x="46" y="72" width="128" height="56" fill={`url(#${id}w)`} stroke="#D5CDEF" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={54 + i * 20} y="76" width="10" height="50" fill="#FFFFFF" stroke="#D5CDEF" />
          <rect x={52 + i * 20} y="74" width="14" height="4" fill="#E3DCF6" />
        </g>
      ))}
      <path d="M40 72 L110 44 L180 72 Z" fill={`url(#${id}w)`} stroke="#D5CDEF" />
      <path d="M62 68 L110 50 L158 68 Z" fill="#ECE7FA" />
      <rect x="88" y="30" width="44" height="16" fill="#EAE4F8" stroke="#D5CDEF" />
      <path d="M88 30 C88 6 132 6 132 30 Z" fill={`url(#${id}d)`} />
      <path d="M96 22 C100 12 108 10 112 10" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M110 8 V-6" stroke={K.purple} strokeWidth="2" />
      <path d="M110 -6 L124 -2 L110 2 Z" fill={K.teal} />
    </>
  );
}

function WaterLeaf({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}drop`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7FD7EC" /><stop offset="1" stopColor={K.cobalt} /></linearGradient>
        <linearGradient id={`${id}leaf`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5FD0B8" /><stop offset="1" stopColor={K.teal} /></linearGradient>
        <radialGradient id={`${id}pool`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#BFE6F5" /><stop offset="1" stopColor="#E9F6FB" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="106" cy="128" rx="92" ry="22" fill={`url(#${id}pool)`} />
      {[60, 40, 22].map((rx, i) => <ellipse key={rx} cx="106" cy="128" rx={rx} ry={rx / 4.2} fill="none" stroke={K.sky} strokeOpacity={0.25 + i * 0.15} strokeWidth="1.6" />)}
      <path d="M106 32 C92 56 78 72 78 92 a28 28 0 0 0 56 0 C134 72 120 56 106 32 Z" fill={`url(#${id}drop)`} />
      <path d="M92 80 C92 70 98 62 102 56" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M140 52 C170 30 200 34 206 40 C202 72 170 86 146 76 C140 70 138 60 140 52 Z" fill={`url(#${id}leaf)`} />
      <path d="M146 72 C164 60 182 50 202 42" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" fill="none" />
    </>
  );
}

function RisingBars({ id }) {
  const bar = (x, h, i) => (
    <g key={x}>
      <path d={`M${x} 132 v${-h} l16 -8 v${h} z`} fill="#C9D8F2" />
      <path d={`M${x} ${132 - h} l16 -8 l16 8 l-16 8 z`} fill="#FFFFFF" stroke="#D3DFF3" />
      <path d={`M${x + 16} ${140} v${-h} l16 -8 v${h} z`} fill={`url(#${id}bf${i})`} />
      <path d={`M${x} 132 l16 8 v${-h} l-16 -8 z`} fill={`url(#${id}bs${i})`} />
    </g>
  );
  const hs = [28, 46, 66, 90];
  return (
    <>
      <defs>
        {hs.map((_, i) => (
          <g key={i}>
            <linearGradient id={`${id}bf${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={i === 3 ? K.cobalt : '#9FBCE9'} /><stop offset="1" stopColor={i === 3 ? K.blue : '#7C9CD8'} /></linearGradient>
            <linearGradient id={`${id}bs${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={i === 3 ? K.sky : '#C3D5F2'} /><stop offset="1" stopColor={i === 3 ? K.cobalt : '#A6BEE8'} /></linearGradient>
          </g>
        ))}
      </defs>
      <Shadow cx="110" cy="148" rx="84" ry="8" />
      {hs.map((h, i) => bar(40 + i * 36, h, i))}
      <path d="M30 104 C70 96 104 74 128 58 C148 44 170 30 194 22" stroke={K.teal} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M182 16 L200 18 L192 34 Z" fill={K.teal} />
    </>
  );
}

const ART = { fid: Checklist, site: MapPin, power: WindSolar, regulatory: CivicBuilding, esg: WaterLeaf, commercial: RisingBars };

export default function CardArt({ cardId, className = '', style }) {
  const id = useId().replace(/:/g, '');
  const Art = ART[cardId];
  return (
    <svg viewBox="0 -10 220 170" className={className} style={style} aria-hidden="true" focusable="false">
      <Art id={id} />
    </svg>
  );
}
