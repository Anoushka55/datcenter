'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles, Loader2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import CCLayout from '@/components/command-center/CCLayout';
import { mockAIInsights } from '@/data/mock/index';

const SEV_CONFIG = {
  critical: { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', icon: AlertTriangle },
  warning:  { color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: AlertTriangle },
  info:     { color: '#0077C8', bg: '#EFF6FF', border: '#93C5FD', icon: Info },
};

const SUGGESTIONS = [
  "What's the risk posture for Mumbai DC-2?",
  "Which tenants need capacity expansion?",
  "Summarize today's incidents",
  "Generate a sustainability improvement plan",
  "What are the top 3 actions I should take today?",
];

function InsightCard({ insight, showToast }) {
  const [expanded, setExpanded] = useState(false);
  const [actionState, setActionState] = useState('idle');
  const sc = SEV_CONFIG[insight.severity] || SEV_CONFIG.info;
  const Icon = sc.icon;

  const handleAction = () => {
    if (actionState !== 'idle') return;
    setActionState('loading');
    setTimeout(() => {
      setActionState('done');
      showToast(`Recommended action for ${insight.affectedFacility} has been dispatched to the operations queue`);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: sc.border }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sc.bg }}>
            <Icon size={14} style={{ color: sc.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ backgroundColor: sc.bg, color: sc.color }}>{insight.severity}</span>
              <span className="text-[9px] text-[#9CA3AF]">{insight.timestamp}</span>
              <span className="text-[9px] text-[#9CA3AF] ml-auto">Confidence</span>
            </div>
            <h3 className="text-sm font-bold text-[#1A1F36] mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{insight.title}</h3>
            <p className="text-xs text-[#6B7280] mb-2">{insight.affectedFacility}</p>
            {/* Confidence bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${insight.confidence}%`, backgroundColor: sc.color }} />
              </div>
              <span className="text-xs font-bold font-mono" style={{ color: sc.color }}>{insight.confidence}%</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <p className="text-xs text-[#6B7280] leading-relaxed mt-3 mb-3">{insight.description}</p>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 mb-3">
                <p className="text-[10px] font-bold text-[#00338D] mb-0.5">Suggested Action</p>
                <p className="text-xs text-[#1A1F36]">{insight.suggestedAction}</p>
              </div>
              <button onClick={handleAction} disabled={actionState !== 'idle'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${actionState === 'done' ? 'bg-[#00A36C] text-white' : `text-white`}`}
                style={{ backgroundColor: actionState === 'idle' ? sc.color : actionState === 'loading' ? sc.color : '#00A36C' }}>
                {actionState === 'loading' ? <Loader2 size={11} className="animate-spin" /> : actionState === 'done' ? '✓ Dispatched' : 'Take Action'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#1A1F36] transition-colors mt-2">
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Collapse' : 'View details'}
        </button>
      </div>
    </div>
  );
}

function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "I'm K-Nexus AI Copilot with full portfolio context. Ask me anything about the Nexus facilities, active alerts, tenant capacity, sustainability metrics, or operational risks." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const next = [...messages, { role: 'user', text: msg }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.text })) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.content || data.error || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col" style={{ height: '50vh' }}>
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#00338D] to-[#0077C8] flex-shrink-0">
        <Sparkles size={15} className="text-white" />
        <span className="text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>K-Nexus AI Copilot — Full Portfolio Context</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
          <span className="text-xs text-white/70">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4F6F9]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#00338D] text-white rounded-br-sm'
                : 'bg-white border border-[#E2E8F0] text-[#1A1F36] rounded-bl-sm shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E2E8F0] rounded-xl rounded-bl-sm px-3 py-2.5 shadow-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] block"
                    animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i*0.2 }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 bg-white border-t border-[#E2E8F0] flex gap-1.5 overflow-x-auto flex-shrink-0">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => sendMessage(s)} disabled={loading}
            className="flex-shrink-0 px-2.5 py-1 bg-[#F4F6F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-full text-[10px] text-[#6B7280] hover:text-[#1A1F36] transition-colors disabled:opacity-40">
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 px-3 py-3 border-t border-[#E2E8F0] bg-white flex-shrink-0">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about incidents, capacity, sustainability, tenants..."
          className="flex-1 text-xs text-[#1A1F36] placeholder:text-[#9CA3AF] bg-[#F4F6F9] border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0077C8]/50 transition-colors" />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-lg bg-[#00338D] hover:bg-[#0044b8] text-white flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}

export default function AIInsightsPage() {
  return (
    <CCLayout title="AI Insights">
      {({ showToast }) => (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-[#00338D]" />
            <h2 className="text-base font-bold text-[#1A1F36]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Operations Intelligence</h2>
            <span className="text-xs bg-[#00338D]/10 text-[#00338D] px-2 py-0.5 rounded-full font-bold">{mockAIInsights.length} insights</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockAIInsights.map((insight, i) => (
              <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <InsightCard insight={insight} showToast={showToast} />
              </motion.div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-[#0077C8]" />
              <h2 className="text-base font-bold text-[#1A1F36]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Conversational AI — Ask Anything</h2>
            </div>
            <ChatInterface />
          </div>
        </div>
      )}
    </CCLayout>
  );
}
