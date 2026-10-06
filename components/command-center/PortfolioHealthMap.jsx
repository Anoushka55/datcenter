'use client';
import { useState } from 'react';
import { fmtUpTo } from '@/lib/nexus/format';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

// Status follows the worst open alert at the site (lib/nexus/portfolio.js).
export const HEALTH_STYLE = {
  critical: { bg: 'bg-[#DC2626]', ring: 'ring-[#DC2626]/30', text: 'text-[#DC2626]', label: 'Critical' },
  serious: { bg: 'bg-[#E8590C]', ring: 'ring-[#E8590C]/30', text: 'text-[#C2410C]', label: 'Serious' },
  warning: { bg: 'bg-[#D4A017]', ring: 'ring-[#D4A017]/30', text: 'text-[#A47C0B]', label: 'Warning' },
  good: { bg: 'bg-[#00A36C]', ring: 'ring-[#00A36C]/30', text: 'text-[#00A36C]', label: 'Healthy' },
  commissioning: { bg: 'bg-[#94A3B8]', ring: 'ring-[#94A3B8]/30', text: 'text-[#64748B]', label: 'Under construction' },
};
const ORDER = ['critical', 'serious', 'warning', 'good', 'commissioning'];

function DCMarker({ dc, selected, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const s = HEALTH_STYLE[dc.health];
  return (
    <button type="button" aria-label={`${dc.name}: ${s.label}`} onClick={() => onSelect?.(dc.id)}
      className="relative flex flex-col items-center" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={`w-3 h-3 rounded-full ${s.bg} ring-4 ${s.ring} transition-transform ${hovered || selected ? 'scale-150' : 'scale-100'}`} />
      {hovered && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 w-56 bg-[#1A1F36] border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-none text-left">
          <p className="text-white font-bold text-xs mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{dc.name}</p>
          <p className="text-white/50 text-[10px] mb-2">{dc.city}, {dc.state} · {dc.tier} · {s.label}</p>
          {dc.operational ? (
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div><span className="text-white/40">IT load</span><br /><span className="text-white font-semibold" style={MONO}>{fmtUpTo(dc.latest.itLoadKw / 1000, 1)} MW</span></div>
              <div><span className="text-white/40">Utilisation</span><br /><span className="text-white font-semibold" style={MONO}>{dc.utilisationPct}%</span></div>
              <div><span className="text-white/40">PUE ({dc.latest.month.slice(5)}/{dc.latest.month.slice(2, 4)})</span><br /><span className="text-white font-semibold" style={MONO}>{dc.latest.pue}</span></div>
              <div><span className="text-white/40">Open alerts</span><br /><span className={`font-semibold ${dc.alerts.length ? 'text-[#D4A017]' : 'text-[#00A36C]'}`} style={MONO}>{dc.alerts.length}</span></div>
            </div>
          ) : (
            <p className="text-[10px] text-white/70">{fmtUpTo(dc.designKw / 1000, 1)} MW design · grid queue position {dc.grid.queuePosition}</p>
          )}
        </div>
      )}
    </button>
  );
}

function RegionPanel({ region, selected, onSelect }) {
  const dcs = region.facilities;
  const alerts = dcs.reduce((s, d) => s + d.alerts.length, 0);
  const live = dcs.filter((d) => d.operational);
  return (
    <div className="flex-1 min-w-[200px] bg-[#F4F6F9] rounded-xl border border-[#E2E8F0] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[#1A1F36] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{region.name}</h3>
        <span className="text-[10px] text-[#9CA3AF]">
          <span className="font-semibold text-[#1A1F36]" style={MONO}>{fmtUpTo(live.reduce((s, d) => s + d.latest.itLoadKw, 0) / 1000, 1)}</span> MW · {alerts} {alerts === 1 ? 'alert' : 'alerts'}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 mb-3 items-center">
        {dcs.map((dc) => <DCMarker key={dc.id} dc={dc} selected={selected === dc.id} onSelect={onSelect} />)}
      </div>
      <div className="mt-3 space-y-1">
        {dcs.map((dc) => (
          <button type="button" key={dc.id} onClick={() => onSelect?.(dc.id)}
            className={`w-full flex items-center gap-2 rounded px-1 -mx-1 ${selected === dc.id ? 'bg-white' : 'hover:bg-white/60'}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${HEALTH_STYLE[dc.health].bg}`} />
            <span className="text-[10px] text-[#6B7280] truncate flex-1 text-left">{dc.name}</span>
            <span className={`text-[10px] font-semibold ${HEALTH_STYLE[dc.health].text}`}>{HEALTH_STYLE[dc.health].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioHealthMap({ regions, selected, onSelect }) {
  const all = regions.flatMap((r) => r.facilities);
  const counts = ORDER.map((h) => [h, all.filter((d) => d.health === h).length]).filter(([, n]) => n > 0);
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-bold text-[#1A1F36] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Portfolio Health</h2>
          <p className="text-[#9CA3AF] text-xs mt-0.5">{all.length} facilities across {regions.length} regions · status from the worst open alert</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {counts.map(([h, n]) => (
            <span key={h} className={`flex items-center gap-1.5 font-semibold ${HEALTH_STYLE[h].text}`}>
              <span className={`w-2 h-2 rounded-full ${HEALTH_STYLE[h].bg}`} />{n} {HEALTH_STYLE[h].label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {regions.map((r) => <RegionPanel key={r.name} region={r} selected={selected} onSelect={onSelect} />)}
      </div>
    </div>
  );
}
