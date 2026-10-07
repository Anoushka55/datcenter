'use client';
// Services: the full advisory lifecycle as one journey. A single smooth SVG
// path runs through every stop; phases are soft tinted zones behind it.
// Stops come from lib/platform-registry.js with their audited status: live
// stops glow, wired stops route to their screen, roadmap stops open a note.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Briefcase, TrendingUp, ShieldAlert, BarChart3, Package, Wrench, FileText, HardHat, Scale, Monitor,
  AlertTriangle, Radar, Gauge, Droplets, SunMedium, FileCheck2, IndianRupee, Users, Network, Landmark,
  ChevronDown, ChevronRight, ArrowUpRight, Compass, Building2, Settings2, Coins,
} from 'lucide-react';
import { PHASES, STOPS, STATUS, countBy } from '@/lib/platform-registry';

const ICON = {
  globe: Globe, briefcase: Briefcase, trend: TrendingUp, shield: ShieldAlert, chart: BarChart3, package: Package, wrench: Wrench,
  file: FileText, hardhat: HardHat, scale: Scale, monitor: Monitor, alert: AlertTriangle, radar: Radar, gauge: Gauge,
  droplet: Droplets, sun: SunMedium, filecheck: FileCheck2, dollar: IndianRupee, users: Users, network: Network, bank: Landmark,
};
const PHASE_ICON = { strategise: Compass, build: Building2, operate: Settings2, monetise: Coins };
const FONT = { fontFamily: "'Inter', 'Segoe UI', sans-serif" };

// Geometry, in viewBox units. Stops alternate between peaks and troughs; the
// path is a Catmull-Rom spline through them, converted to cubic Béziers.
const VB = { w: 1600, h: 560, peak: 248, trough: 322, padX: 70 };
function layout(stops) {
  const n = stops.length;
  const step = n > 1 ? (VB.w - 2 * VB.padX) / (n - 1) : 0;
  return stops.map((s, i) => {
    const up = i % 2 === 1;
    // A slow wave across the whole journey, so it rises and falls rather than zig-zags.
    const swell = Math.sin((i / Math.max(1, n - 1)) * Math.PI * 2.2) * 22;
    // Rounded: Math.sin can differ in the last digit between server and browser.
    return { ...s, x: Math.round((VB.padX + i * step) * 10) / 10, y: Math.round(((up ? VB.peak : VB.trough) + swell) * 10) / 10, up };
  });
}
function pathThrough(pts) {
  if (pts.length < 2) return '';
  const p = [pts[0], ...pts, pts.at(-1)];
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function Badge({ status, small = false }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${small ? 'text-[9.5px]' : 'text-[11px]'}`} style={{ color: s.color }} title={s.note}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{s.label}
    </span>
  );
}

export default function ServiceJourney() {
  const router = useRouter();
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [hover, setHover] = useState(null);
  const [open, setOpen] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const phaseOf = (id) => PHASES.find((p) => p.id === id);
  const visible = phaseFilter === 'all' ? STOPS : STOPS.filter((s) => s.phase === phaseFilter);
  const pts = useMemo(() => layout(visible), [visible]);
  const d = useMemo(() => pathThrough(pts), [pts]);

  // Phase zones span from the midpoint before a phase's first stop to the midpoint after its last.
  const zones = useMemo(() => PHASES.map((ph) => {
    const idx = pts.map((p, i) => (p.phase === ph.id ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return null;
    const first = idx[0], last = idx.at(-1);
    const x0 = first === 0 ? 0 : (pts[first - 1].x + pts[first].x) / 2;
    const x1 = last === pts.length - 1 ? VB.w : (pts[last].x + pts[last + 1].x) / 2;
    return { ...ph, x0, x1 };
  }).filter(Boolean), [pts]);

  const liveCount = countBy(STOPS, 'live');
  const datasetCount = countBy(STOPS, 'dataset');
  // Rounded so server and client render the same style strings.
  const pct = (v, total) => `${Math.round((v / total) * 100000) / 1000}%`;

  const activate = (s) => {
    if (s.href && s.status !== 'roadmap') router.push(s.href);
    else setOpen((o) => (o === s.id ? null : s.id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden" style={FONT}>
      {/* Header strip */}
      <div className="flex-shrink-0 border-b border-[#D8DCE3] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()} aria-label="Close" className="w-8 h-8 rounded-lg border border-[#D8DCE3] flex items-center justify-center hover:bg-[#F0F2F5] text-[#64748B]">×</button>
          <span className="text-[22px] font-extrabold tracking-tight text-[#00338D]" aria-label="KPMG">KPMG</span>
          <span className="w-px h-8 bg-[#D8DCE3]" />
          <div>
            <p className="text-[17px] font-bold text-[#1A1F36] leading-tight">Services</p>
            <p className="text-[12px] text-[#64748B]">Datacentre Advisory · Full Lifecycle Service Map</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-[#00B0A0]/35 bg-[#00B0A0]/10 px-3 py-1.5 text-[12px] font-semibold text-[#007A70]" title={STATUS.live.note}>
            <span className="w-2 h-2 rounded-full bg-[#00B0A0]" style={{ boxShadow: '0 0 0 3px rgba(0,176,160,0.25)' }} />{liveCount} Live
          </span>
          <span className="rounded-lg border border-[#E87722]/35 bg-[#E87722]/10 px-3 py-1.5 text-[12px] font-semibold text-[#B85A12]" title={STATUS.dataset.note}>{datasetCount} on dataset</span>
          <span className="rounded-lg border border-[#D8DCE3] px-3 py-1.5 text-[12px] font-semibold text-[#1A1F36]">{STOPS.length} stops</span>
          <label className="relative">
            <span className="sr-only">View by phase</span>
            <select value={phaseFilter} onChange={(e) => { setPhaseFilter(e.target.value); setOpen(null); }}
              className="appearance-none rounded-lg border border-[#D8DCE3] bg-white pl-3 pr-8 py-1.5 text-[12px] font-semibold text-[#00338D] cursor-pointer">
              <option value="all">View by Phase: All</option>
              {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-[1180px] px-6 pt-4 pb-6">
          {/* Journey */}
          <div className="relative w-full" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
            {/* Phase zones: soft tints, blurred edges */}
            {zones.map((z) => (
              <div key={z.id} className="absolute top-0 bottom-0" style={{ left: pct(z.x0, VB.w), width: pct(z.x1 - z.x0, VB.w), background: `linear-gradient(90deg, transparent 0%, ${z.color}12 7%, ${z.color}12 93%, transparent 100%)` }}>
                <p className="absolute top-2 left-0 right-0 text-center text-[12px] font-bold tracking-[0.22em] uppercase" style={{ color: z.color }}>{z.label}</p>
              </div>
            ))}

            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden>
              <defs>
                <linearGradient id="journey-line" x1="0" x2="1" y1="0" y2="0">
                  {zones.map((z) => [
                    <stop key={`${z.id}a`} offset={z.x0 / VB.w} stopColor={z.color} />,
                    <stop key={`${z.id}b`} offset={z.x1 / VB.w} stopColor={z.color} />,
                  ])}
                </linearGradient>
                <filter id="live-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" /></filter>
              </defs>
              <motion.path d={d} fill="none" stroke="url(#journey-line)" strokeWidth="4" strokeLinecap="round" opacity="0.9"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} key={phaseFilter} />
              {pts.map((p) => {
                const color = phaseOf(p.phase).color;
                const on = hover === p.id;
                return (
                  <g key={p.id}>
                    {/* tick from the dot to its label card */}
                    <line x1={p.x} y1={p.y} x2={p.x} y2={p.up ? p.y - 34 : p.y + 34} stroke={color} strokeWidth={on ? 3 : 1.4} opacity={on ? 0.9 : 0.5} />
                    {p.status === 'live' && <circle cx={p.x} cy={p.y} r="16" fill="#00B0A0" opacity="0.45" filter="url(#live-glow)" />}
                    {p.status === 'live' && <circle cx={p.x} cy={p.y} r="14" fill="none" stroke="#00B0A0" strokeWidth="2" opacity="0.6" />}
                    <circle cx={p.x} cy={p.y} r={on ? 10 : 8.5} fill={p.status === 'roadmap' ? '#FFFFFF' : color} stroke={p.status === 'roadmap' ? color : '#FFFFFF'} strokeWidth="2.5" strokeDasharray={p.status === 'roadmap' ? '3 2.5' : undefined} />
                  </g>
                );
              })}
            </svg>

            {/* Label cards, as HTML so text stays crisp and selectable */}
            {pts.map((p, i) => {
              const phase = phaseOf(p.phase);
              const Icon = ICON[p.icon] ?? Globe;
              const isOpen = open === p.id;
              return (
                <div key={p.id} className="absolute" style={{ left: pct(p.x, VB.w), top: pct(p.up ? p.y - 38 : p.y + 38, VB.h), transform: `translate(-50%, ${p.up ? '-100%' : '0'})`, zIndex: isOpen ? 20 : hover === p.id ? 10 : 1 }}>
                  <motion.button type="button" onClick={() => activate(p)} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}
                    initial={{ opacity: 0, y: p.up ? -6 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.03 }}
                    whileHover={{ y: p.up ? -3 : -3 }}
                    className="block w-[138px] text-left rounded-xl bg-white border px-2.5 py-2 shadow-[0_2px_8px_rgba(0,51,141,0.08)] hover:shadow-[0_8px_20px_rgba(0,51,141,0.14)] transition-shadow"
                    style={{ borderColor: hover === p.id ? phase.color : '#D8DCE3' }}
                    aria-label={`${p.title}: ${STATUS[p.status].label}${p.href && p.status !== 'roadmap' ? ', opens the screen' : ''}`}>
                    <span className="flex items-center justify-between gap-1">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${phase.color}14` }}><Icon size={13} style={{ color: phase.color }} /></span>
                      {p.href && p.status !== 'roadmap' ? <ArrowUpRight size={12} className="text-[#94A3B8]" /> : <Badge status={p.status} small />}
                    </span>
                    <span className="block text-[11.5px] font-bold text-[#1A1F36] leading-tight mt-1.5 line-clamp-2">{p.title}</span>
                    <span className="block text-[10.5px] text-[#64748B] leading-snug mt-0.5 line-clamp-2">{p.role}</span>
                    {p.status !== 'roadmap' && <span className="block mt-1"><Badge status={p.status} small /></span>}
                  </motion.button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 w-[220px] rounded-xl bg-white border border-[#D8DCE3] shadow-xl p-3 mt-2" role="dialog" aria-label={p.title}>
                        <div className="flex items-center justify-between"><p className="text-[12px] font-bold text-[#1A1F36]">{p.title}</p><Badge status={p.status} small /></div>
                        <p className="text-[11.5px] text-[#64748B] mt-1 leading-snug">{p.description}</p>
                        <p className="text-[10.5px] text-[#94A3B8] mt-1.5">{STATUS[p.status].note}.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Phase summary cards */}
          <div className="grid grid-cols-4 gap-4 mt-2">
            {PHASES.map((ph) => {
              const Icon = PHASE_ICON[ph.id];
              const stops = STOPS.filter((s) => s.phase === ph.id);
              const isOpen = expanded === ph.id;
              return (
                <div key={ph.id} className="rounded-xl border border-[#D8DCE3] bg-white overflow-hidden" style={{ borderTop: `3px solid ${ph.color}` }}>
                  <button type="button" onClick={() => setExpanded(isOpen ? null : ph.id)} className="w-full text-left p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${ph.color}14` }}><Icon size={16} style={{ color: ph.color }} /></span>
                        <span>
                          <span className="block text-[14px] font-bold text-[#1A1F36]">{ph.label}</span>
                          <span className="block text-[11px] text-[#64748B]">{stops.length} stops · {countBy(stops, 'live')} live</span>
                        </span>
                      </span>
                      <ChevronDown size={16} className={`text-[#94A3B8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8] mt-3">Key outcomes</p>
                    <p className="text-[12px] text-[#1A1F36]">{ph.outcomes}</p>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8] mt-2">Typical stakeholders</p>
                    <p className="text-[12px] text-[#1A1F36]">{ph.stakeholders}</p>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.ul initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-[#D8DCE3] px-4">
                        {stops.map((s) => (
                          <li key={s.id} className="flex items-center justify-between py-1.5 text-[12px]">
                            <button type="button" onClick={() => activate(s)} className="text-left text-[#1A1F36] hover:text-[#005EB8]">{s.title}</button>
                            <Badge status={s.status} small />
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Phase bar: secondary navigation */}
          <div className="flex mt-3 rounded-lg overflow-hidden">
            {PHASES.map((ph) => (
              <button key={ph.id} type="button" onClick={() => setPhaseFilter(phaseFilter === ph.id ? 'all' : ph.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-bold text-white tracking-wide transition hover:brightness-110"
                style={{ background: ph.color, opacity: phaseFilter === 'all' || phaseFilter === ph.id ? 1 : 0.55 }}>
                {ph.label.toUpperCase()} <ChevronRight size={14} />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-5 mt-3 text-[11px] text-[#64748B]">
            {Object.entries(STATUS).map(([k, s]) => (
              <span key={k} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} /><b style={{ color: s.color }}>{s.label}</b> {s.note.charAt(0).toLowerCase() + s.note.slice(1)}</span>
            ))}
            <span className="ml-auto">Click a stop to open its screen; roadmap stops show what is planned.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
