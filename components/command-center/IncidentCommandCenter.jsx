'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import IncidentRow from './IncidentRow';

const FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];

export default function IncidentCommandCenter({ incidents, statuses = {}, onAcknowledge }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const filtered = activeFilter === 'All' ? incidents : incidents.filter((i) => i.severity === activeFilter.toLowerCase());
  const critical = incidents.filter((i) => i.severity === 'critical').length;

  return (
    <div className="bg-[#0D1428] rounded-2xl border border-white/[0.08] shadow-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertCircle size={18} className="text-[#DC2626]" />
            {critical > 0 && <>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            </>}
          </div>
          <h2 className="text-white font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Live Incident Command Center</h2>
          <span className="px-2 py-0.5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold">{incidents.length} OPEN</span>
          <Link href="/incidents" className="text-[11px] text-[#60a5fa] hover:underline">All briefs →</Link>
        </div>
        <div className="flex items-center bg-white/5 rounded-lg p-0.5 gap-0.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${activeFilter === f ? 'bg-[#00338D] text-white' : 'text-white/50 hover:text-white/80'}`}>
              {f}
              {f !== 'All' && <span className="ml-1 text-[10px] opacity-70">({incidents.filter((i) => i.severity === f.toLowerCase()).length})</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-white/30">
            <AlertCircle size={28} className="mb-2" />
            <p className="text-sm">No alerts at this severity</p>
          </div>
        ) : (
          filtered.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} status={statuses[incident.id] ?? incident.status} onAcknowledge={() => onAcknowledge?.(incident.id)} />
          ))
        )}
      </div>
    </div>
  );
}
