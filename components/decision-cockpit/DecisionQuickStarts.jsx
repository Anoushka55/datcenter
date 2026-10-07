'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Zap, Droplets, TrendingUp, Cpu, ArrowRight, Users, Globe } from 'lucide-react';
import { DECISION_QUICK_STARTS } from '@/data/decisionModules';

const ICONS = { MapPin, Zap, Droplets, TrendingUp, Cpu };

// Structured, non-chat entry point. Selecting a quick start never sends a
// chat message — it asks exactly one structured question, then routes
// straight to the decision-engine cockpit.
export default function DecisionQuickStarts() {
  const router = useRouter();
  const [active, setActive] = useState(null); // decision_type currently being configured
  const [mode, setMode] = useState(null); // 'client_specific' | 'exploratory'
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');

  const activeQS = DECISION_QUICK_STARTS.find(qs => qs.decision_type === active);

  const reset = () => {
    setActive(null);
    setMode(null);
    setClientName('');
    setLocation('');
    setCapacity('');
  };

  const goToCockpit = (chosenMode) => {
    const params = new URLSearchParams({ decision_type: active, mode: chosenMode });
    if (chosenMode === 'client_specific' && clientName) params.set('client_name', clientName);
    if (location) params.set('location', location);
    if (capacity) params.set('capacity', capacity);
    router.push(`/decision-cockpit?${params.toString()}`);
  };

  return (
    <div>
      <p className="text-[9px] text-[#9CA3AF] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
        Quick starts
      </p>

      <AnimatePresence mode="wait">
        {!active && (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-1.5"
          >
            {DECISION_QUICK_STARTS.map(qs => {
              const Icon = ICONS[qs.icon];
              return (
                <button
                  key={qs.id}
                  onClick={() => setActive(qs.decision_type)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-[#E8EDF5] bg-[#F8FAFF] hover:bg-[#EEF4FF] hover:border-[#00338D]/25 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#00338D]/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={13} className="text-[#00338D]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1A1F36] leading-snug">{qs.title}</p>
                      <p className="text-[10px] text-[#6B7280] leading-snug">{qs.subtitle}</p>
                    </div>
                    <ArrowRight size={11} className="text-[#CBD5E1] group-hover:text-[#005EB8] flex-shrink-0 transition-colors" />
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}

        {active && !mode && (
          <motion.div
            key="mode-question"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#F0F4FF] border border-[#00338D]/15 rounded-2xl p-3.5"
          >
            <p className="text-[10px] text-[#6B7280] mb-1">{activeQS?.title}</p>
            <p className="text-xs font-semibold text-[#1A1F36] mb-3">
              Do you want to evaluate this for a specific client, or explore options more generally?
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setMode('client_specific')}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#00338D]/20 text-[#00338D] text-[11px] font-bold rounded-xl hover:bg-[#00338D]/5 transition-colors"
              >
                <Users size={13} /> Specific client
              </button>
              <button
                onClick={() => setMode('exploratory')}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#00338D]/20 text-[#00338D] text-[11px] font-bold rounded-xl hover:bg-[#00338D]/5 transition-colors"
              >
                <Globe size={13} /> Explore generally
              </button>
            </div>
            <button onClick={reset} className="text-[9px] text-[#9CA3AF] hover:text-[#6B7280] mt-2.5">
              ← Back to quick starts
            </button>
          </motion.div>
        )}

        {active && mode === 'client_specific' && (
          <motion.div
            key="client-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#F0F4FF] border border-[#00338D]/15 rounded-2xl p-3.5"
          >
            <p className="text-xs font-semibold text-[#1A1F36] mb-3">Client details</p>
            <div className="flex flex-col gap-2">
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Client name (e.g. Adani)"
                className="w-full px-3 py-2 rounded-lg border border-[#00338D]/15 bg-white text-xs text-[#1A1F36] placeholder-[#9CA3AF] outline-none focus:border-[#00338D]/40"
              />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Location (e.g. Chennai)"
                className="w-full px-3 py-2 rounded-lg border border-[#00338D]/15 bg-white text-xs text-[#1A1F36] placeholder-[#9CA3AF] outline-none focus:border-[#00338D]/40"
              />
              <input
                value={capacity}
                onChange={e => setCapacity(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Capacity in MW (optional)"
                className="w-full px-3 py-2 rounded-lg border border-[#00338D]/15 bg-white text-xs text-[#1A1F36] placeholder-[#9CA3AF] outline-none focus:border-[#00338D]/40"
              />
            </div>
            <button
              disabled={!clientName.trim() || !location.trim()}
              onClick={() => goToCockpit('client_specific')}
              className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2.5 text-white text-[10px] font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #00338D 0%, #005EB8 100%)' }}
            >
              Run Decision Engine <ArrowRight size={11} />
            </button>
            <button onClick={() => setMode(null)} className="text-[9px] text-[#9CA3AF] hover:text-[#6B7280] mt-2">
              ← Back
            </button>
          </motion.div>
        )}

        {active && mode === 'exploratory' && (
          <motion.div
            key="exploratory-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#F0F4FF] border border-[#00338D]/15 rounded-2xl p-3.5"
          >
            <p className="text-xs font-semibold text-[#1A1F36] mb-1">Explore a region</p>
            <p className="text-[10px] text-[#6B7280] mb-3">A location is required — the engine's output is specific to whatever you enter here, not a generic average.</p>
            <div className="flex flex-col gap-2">
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Location (e.g. Chennai)"
                className="w-full px-3 py-2 rounded-lg border border-[#00338D]/15 bg-white text-xs text-[#1A1F36] placeholder-[#9CA3AF] outline-none focus:border-[#00338D]/40"
              />
              <input
                value={capacity}
                onChange={e => setCapacity(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Capacity in MW (optional)"
                className="w-full px-3 py-2 rounded-lg border border-[#00338D]/15 bg-white text-xs text-[#1A1F36] placeholder-[#9CA3AF] outline-none focus:border-[#00338D]/40"
              />
            </div>
            <button
              disabled={!location.trim()}
              onClick={() => goToCockpit('exploratory')}
              className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2.5 text-white text-[10px] font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #00338D 0%, #005EB8 100%)' }}
            >
              Run Decision Engine <ArrowRight size={11} />
            </button>
            <button onClick={() => setMode(null)} className="text-[9px] text-[#9CA3AF] hover:text-[#6B7280] mt-2">
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
