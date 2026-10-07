'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CCLayout from '@/components/command-center/CCLayout';


// ─── Brand Logos (inline SVG, accurate brand colors) ────────────────────────

function AWSBedrockLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#232F3E"/>
      <path d="M24 8l12 7v14l-12 7-12-7V15z" fill="none" stroke="#FF9900" strokeWidth="1.5"/>
      <path d="M24 8l12 7-12 7-12-7z" fill="#FF9900" opacity="0.9"/>
      <path d="M12 15l12 7v14" stroke="#FF9900" strokeWidth="1.2" fill="none"/>
      <path d="M36 15l-12 7v14" stroke="#FF9900" strokeWidth="1.2" fill="none" opacity="0.7"/>
      <text x="24" y="43" textAnchor="middle" fill="#FF9900" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">BEDROCK</text>
    </svg>
  );
}

function ClaudeLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#D97757"/>
      <path d="M16 36l5-14h2.5L17 36h-1zm4.5 0l5-14H28l-5.5 14H20.5zm4.5 0l5-14h2.5L27 36H25z" fill="white" opacity="0.92"/>
    </svg>
  );
}

function TavilyLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#18181B"/>
      <rect x="10" y="14" width="28" height="3.5" rx="1.5" fill="#F5A623"/>
      <rect x="14" y="21" width="20" height="3" rx="1.5" fill="#F5A623" opacity="0.8"/>
      <rect x="18" y="27.5" width="12" height="2.5" rx="1.25" fill="#F5A623" opacity="0.6"/>
      <circle cx="34" cy="36" r="6" fill="none" stroke="#F5A623" strokeWidth="2"/>
      <line x1="38.2" y1="40.2" x2="42" y2="44" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function PeeringDBLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#003366"/>
      <circle cx="14" cy="24" r="5" fill="none" stroke="#4A90D9" strokeWidth="2"/>
      <circle cx="34" cy="16" r="4" fill="none" stroke="#4A90D9" strokeWidth="2"/>
      <circle cx="34" cy="32" r="4" fill="none" stroke="#4A90D9" strokeWidth="2"/>
      <circle cx="24" cy="24" r="3" fill="#4A90D9" opacity="0.5"/>
      <line x1="19" y1="24" x2="21" y2="24" stroke="#4A90D9" strokeWidth="1.5"/>
      <line x1="27" y1="22" x2="30.5" y2="18.5" stroke="#4A90D9" strokeWidth="1.5"/>
      <line x1="27" y1="26" x2="30.5" y2="29.5" stroke="#4A90D9" strokeWidth="1.5"/>
    </svg>
  );
}


function CrewAILogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#0F172A"/>
      <circle cx="24" cy="18" r="6" fill="none" stroke="#E11D48" strokeWidth="2"/>
      <path d="M13 40c0-6.1 4.9-11 11-11s11 4.9 11 11" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="13" cy="21" r="3.5" fill="none" stroke="#E11D48" strokeWidth="1.5" opacity="0.65"/>
      <circle cx="35" cy="21" r="3.5" fill="none" stroke="#E11D48" strokeWidth="1.5" opacity="0.65"/>
    </svg>
  );
}

function KnowledgeGraphLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#064E3B"/>
      <circle cx="24" cy="24" r="4.5" fill="#10B981"/>
      <circle cx="11" cy="17" r="3.5" fill="#34D399" opacity="0.85"/>
      <circle cx="37" cy="17" r="3.5" fill="#34D399" opacity="0.85"/>
      <circle cx="11" cy="37" r="3.5" fill="#34D399" opacity="0.85"/>
      <circle cx="37" cy="37" r="3.5" fill="#34D399" opacity="0.85"/>
      <line x1="14.5" y1="19" x2="20.5" y2="22" stroke="#10B981" strokeWidth="1.5"/>
      <line x1="33.5" y1="19" x2="27.5" y2="22" stroke="#10B981" strokeWidth="1.5"/>
      <line x1="14.5" y1="35" x2="20.5" y2="27" stroke="#10B981" strokeWidth="1.5"/>
      <line x1="33.5" y1="35" x2="27.5" y2="27" stroke="#10B981" strokeWidth="1.5"/>
    </svg>
  );
}

function RAGLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#1E3A5F"/>
      <ellipse cx="24" cy="16" rx="13" ry="5" fill="#2563EB"/>
      <rect x="11" y="16" width="26" height="7" fill="#1D4ED8"/>
      <ellipse cx="24" cy="23" rx="13" ry="5" fill="#3B82F6"/>
      <rect x="11" y="23" width="26" height="7" fill="#2563EB"/>
      <ellipse cx="24" cy="30" rx="13" ry="5" fill="#60A5FA"/>
      <text x="24" y="18.5" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="Arial, sans-serif">KPMG</text>
      <text x="24" y="32.5" textAnchor="middle" fill="white" fontSize="5" fontFamily="Arial, sans-serif">RAG</text>
    </svg>
  );
}

// ─── Animated SVG connector arrow drawn on load ────────────────────────────

function FlowConnector({ delay = 0, height = 32, color = '#005EB8' }) {
  const pathRef = useRef(null);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    const timeout = setTimeout(() => {
      el.style.transition = `stroke-dashoffset 0.5s ease-out`;
      el.style.strokeDashoffset = '0';
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const mid = height / 2;
  return (
    <div className="flex justify-center" style={{ height }}>
      <svg width="24" height={height} viewBox={`0 0 24 ${height}`} fill="none" overflow="visible">
        <path
          ref={pathRef}
          d={`M12 0 L12 ${mid - 6}`}
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d={`M5 ${mid - 2} L12 ${mid + 6} L19 ${mid - 2}`}
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ opacity: 0.9 }}
        />
      </svg>
    </div>
  );
}

// ─── Animated SVG fan-out from aggregator to 6 agents ─────────────────────

function FanOutConnector({ count = 6, delay = 0 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const paths = svgRef.current?.querySelectorAll('path[data-anim]');
    if (!paths) return;
    paths.forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    const timeout = setTimeout(() => {
      paths.forEach((p, i) => {
        setTimeout(() => {
          p.style.transition = 'stroke-dashoffset 0.4s ease-out';
          p.style.strokeDashoffset = '0';
        }, i * 40);
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const W = 600, H = 40;
  const cx = W / 2;
  const slotW = W / count;
  const points = Array.from({ length: count }, (_, i) => (i + 0.5) * slotW);

  return (
    <div className="w-full" style={{ height: H }}>
      <svg ref={svgRef} width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {points.map((x, i) => (
          <path
            key={i}
            data-anim="true"
            d={`M${cx} 0 Q${cx} ${H / 2} ${x} ${H}`}
            stroke="#005EB8"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.45"
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    label: 'Strategy',
    color: '#00338D',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    ),
    desc: 'Market positioning, site selection, and long-term capacity strategy',
    tools: ['Tavily Search', 'Knowledge Graph'],
    model: 'Claude 3.5 Sonnet / 4.6 Opus | Gemini 3 Flash',
  },
  {
    label: 'Sourcing',
    color: '#0055A4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
    ),
    desc: 'Vendor procurement, land acquisition, and supply chain coordination',
    tools: ['PeeringDB', 'Tavily Search'],
    model: 'Claude 3.5 Sonnet',
  },
  {
    label: 'Design',
    color: '#005EB8',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    ),
    desc: 'Facility engineering, mechanical/electrical design, and build planning',
    tools: ['Knowledge Graph', 'RAG Vector Store'],
    model: 'Claude 3.5 Sonnet',
  },
  {
    label: 'Compliance',
    color: '#005F9E',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
    desc: 'Regulatory adherence, legal frameworks, and certification management',
    tools: ['RAG Vector Store', 'Knowledge Graph'],
    model: 'Claude 3.5 Sonnet / 4.6 Opus | Gemini 3 Flash',
  },
  {
    label: 'Operations',
    color: '#0099CC',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
    ),
    desc: 'Live facility management, SLA monitoring, and incident response',
    tools: ['PeeringDB', 'Tavily Search', 'RAG Vector Store'],
    model: 'Claude 3.5 Sonnet',
  },
  {
    label: 'Monetization',
    color: '#00B0A0',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
    desc: 'Revenue optimisation, tenant acquisition, and pricing strategy',
    tools: ['Tavily Search', 'Knowledge Graph', 'RAG Vector Store'],
    model: 'Claude 3.5 Sonnet / 4.6 Opus | Gemini 3 Flash',
  },
];

const DATA_TOOLS = [
  {
    label: 'Tavily Search',
    sub: 'Live, verified market data',
    Logo: TavilyLogo,
    stat: '< 200ms',
    statLabel: 'avg latency',
    detail: 'Real-time web intelligence with source verification and fact-checking',
    badge: 'Live',
    badgeColor: '#F5A623',
  },
  {
    label: 'PeeringDB',
    sub: 'Global DC peering connectivity',
    Logo: PeeringDBLogo,
    stat: '12,000+',
    statLabel: 'network records',
    detail: 'Comprehensive interconnection data for 12,000+ global datacenters',
    badge: 'API',
    badgeColor: '#4A90D9',
  },
  {
    label: 'Knowledge Graph',
    sub: 'Entity relationship mappings',
    Logo: KnowledgeGraphLogo,
    stat: '2.4M',
    statLabel: 'entities indexed',
    detail: 'Semantic entity graph linking assets, vendors, regulations, and tenants',
    badge: 'Indexed',
    badgeColor: '#10B981',
  },
  {
    label: 'RAG Vector Store',
    sub: 'KPMG Frameworks — efficient retrieval',
    Logo: RAGLogo,
    stat: '99.8%',
    statLabel: 'retrieval accuracy',
    detail: 'KPMG proprietary vectorised knowledge base with semantic search',
    badge: 'KPMG',
    badgeColor: '#00338D',
  },
];


const TOOL_FRAMEWORKS = [
  { Logo: AWSBedrockLogo, label: 'AWS Bedrock', sub: 'Cloud Platform' },
  { Logo: ClaudeLogo, label: 'Claude 3.5 Sonnet / 4.6 Opus | Gemini 3 Flash', sub: 'Foundation Models' },
  { Logo: TavilyLogo, label: 'Tavily Search', sub: 'Live market data' },
  { Logo: PeeringDBLogo, label: 'PeeringDB', sub: 'Network connectivity' },
  { Logo: RAGLogo, label: 'RAG Vector Store', sub: 'KPMG Frameworks' },
  { Logo: KnowledgeGraphLogo, label: 'Knowledge Graph', sub: 'Entity mappings' },
];

// ─── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, isActive, onClick }) {
  return (
    <div className="relative flex flex-col">
      <motion.div
        onClick={onClick}
        whileHover={{ y: -4, scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="cursor-pointer rounded-xl border bg-white shadow-sm overflow-hidden select-none"
        style={{
          borderColor: isActive ? agent.color : '#D8DCE3',
          boxShadow: isActive ? `0 4px 20px ${agent.color}22` : undefined,
        }}
      >
        {/* Top color strip */}
        <div className="h-1 w-full" style={{ background: agent.color }} />
        <div className="p-3 flex flex-col items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${agent.color}15`, color: agent.color }}
          >
            {agent.icon}
          </div>
          <p
            className="text-[11px] font-bold text-center text-[#1A1F36]"
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
          >
            {agent.label}
          </p>
          <p className="text-[9px] text-[#9CA3AF] text-center">Agent</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-xl border border-[#D8DCE3] shadow-xl p-3 z-30"
            style={{ borderTop: `3px solid ${agent.color}` }}
          >
            <p className="text-[#1A1F36] font-bold text-xs mb-1.5">{agent.label} Agent</p>
            <p className="text-[#6B7280] text-[10px] mb-2 leading-relaxed">{agent.desc}</p>
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Connected Tools</p>
              {agent.tools.map(t => (
                <span key={t} className="inline-flex items-center gap-1 mr-1 mb-1 px-1.5 py-0.5 bg-[#F0F2F5] border border-[#D8DCE3] rounded text-[9px] text-[#374151] font-medium">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Data Tool Card ────────────────────────────────────────────────────────────

function DataToolCard({ tool }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4, boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="relative bg-white rounded-xl border border-[#D8DCE3] p-3.5 overflow-hidden cursor-default"
    >
      <div className="flex items-start gap-3">
        <tool.Logo size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-[#1A1F36] font-bold text-xs" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>{tool.label}</p>
          <p className="text-[#9CA3AF] text-[10px] mt-0.5 leading-tight">{tool.sub}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{ background: `${tool.badgeColor}15`, color: tool.badgeColor }}
            >
              {tool.badge}
            </span>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 rounded-xl p-3 flex flex-col justify-end"
            style={{ background: `linear-gradient(160deg, ${tool.badgeColor} 0%, ${tool.badgeColor} 100%)` }}
          >
            <p className="text-white font-bold text-xs mb-1">{tool.label}</p>
            <p className="text-white/80 text-[10px] leading-relaxed mb-2">{tool.detail}</p>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-[9px]">{tool.statLabel}</span>
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {tool.stat}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Layer Card wrapper ────────────────────────────────────────────────────────

function LayerCard({ children, glowColor = '#005EB8', className = '' }) {
  return (
    <motion.div
      whileHover={{ boxShadow: `0 8px 32px ${glowColor}22` }}
      transition={{ duration: 0.25 }}
      className={`bg-white rounded-2xl border border-[#D8DCE3] shadow-sm transition-colors hover:border-[#005EB8]/30 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─── Capability row (right panel) ─────────────────────────────────────────────

function CapabilityRow({ Logo, title, sub }) {
  return (
    <motion.div
      whileHover={{ x: 4, backgroundColor: '#F0F2F5' }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-default"
    >
      <div className="w-7 h-7 rounded-lg bg-[#F0F2F5] border border-[#D8DCE3] flex items-center justify-center flex-shrink-0">
        {Logo ? <Logo size={18} /> : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005EB8" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01z"/>
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[#1A1F36] text-[11px] font-semibold truncate" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
          {title}
        </p>
        <p className="text-[#9CA3AF] text-[9px]">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AgenticStackPage() {
  const [activeAgent, setActiveAgent] = useState(null);

  const handleAgentClick = (label) => {
    setActiveAgent(prev => (prev === label ? null : label));
  };

  return (
    <CCLayout title="Agentic AI Stack">
      <div className="relative min-h-full bg-[#F0F2F5] overflow-hidden">
        <div className="relative z-10 p-5">
          {/* ── Page header ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-start justify-between"
          >
            <div>
              <h1
                className="text-[#1A1F36] font-bold text-xl tracking-tight"
                style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
              >
                Data Center Life-Cycle Intelligence Platform
              </h1>
              <p className="text-[#6B7280] text-sm mt-0.5">
                Proprietary KPMG Agentic AI Architecture
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1 rounded-full bg-[#00338D]/10 border border-[#00338D]/20 text-[#00338D] text-[11px] font-bold uppercase tracking-wider">
                Proprietary
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00B0A0]/10 border border-[#00B0A0]/20 text-[#00B0A0] text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00B0A0] animate-pulse" />
                Live
              </span>
            </div>
          </motion.div>

          {/* ── Architecture Diagram ── */}
          <div className="space-y-0">

              {/* User Query */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="flex justify-center"
              >
                <LayerCard className="px-12 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#00338D]/10 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00338D" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                    <p className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                      User Query
                    </p>
                  </div>
                </LayerCard>
              </motion.div>

              <FlowConnector delay={200} height={30} />

              {/* Memory + Planning — no connector inside the cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-4"
              >
                <LayerCard className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#00338D]/10 border border-[#00338D]/20 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00338D" strokeWidth="2" strokeLinecap="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>Memory Layer</p>
                      <p className="text-[#6B7280] text-[10px] mt-0.5">Short + long-term context storage</p>
                    </div>
                  </div>
                </LayerCard>

                <LayerCard className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#005EB8]/10 border border-[#005EB8]/20 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#005EB8" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>Planning Layer</p>
                      <p className="text-[#6B7280] text-[10px] mt-0.5">ReAct + Chain-of-Thought Reasoning</p>
                    </div>
                  </div>
                </LayerCard>
              </motion.div>

              {/* Combined badge sits below both cards, outside them */}
              <div className="flex items-center py-2">
                <div className="flex-1 h-px bg-[#005EB8]/20 ml-6" />
                <span className="mx-3 px-3 py-1 rounded-lg bg-white border border-[#005EB8]/30 text-[#005EB8] text-[10px] font-bold tracking-widest shadow-sm flex-shrink-0">
                  Combined
                </span>
                <div className="flex-1 h-px bg-[#005EB8]/20 mr-6" />
              </div>

              <FlowConnector delay={350} height={24} />

              {/* Aggregator Agent */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="flex justify-center"
              >
                <LayerCard className="px-8 py-4" glowColor="#005EB8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#005EB8]/10 border border-[#005EB8]/25 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005EB8" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                        Aggregator Agent
                      </p>
                      <p className="text-[#6B7280] text-[10px]">Routes and coordinates all specialist agents</p>
                    </div>
                  </div>
                </LayerCard>
              </motion.div>

              {/* Fan-out connector */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <FanOutConnector count={6} delay={400} />
              </motion.div>

              {/* 6 Specialist Agents */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] text-center mb-2">
                  Specialist Agents — click to explore
                </p>
                <div className="grid grid-cols-6 gap-2.5">
                  {AGENTS.map(agent => (
                    <AgentCard
                      key={agent.label}
                      agent={agent}
                      isActive={activeAgent === agent.label}
                      onClick={() => handleAgentClick(agent.label)}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Space for agent expansion */}
              <AnimatePresence>
                {activeAgent && (
                  <motion.div
                    key="agent-spacer"
                    initial={{ height: 0 }}
                    animate={{ height: 24 }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>
              {!activeAgent && <div style={{ height: 8 }} />}

              <FlowConnector delay={550} height={30} />

              {/* Data & Tools */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] text-center mb-2">
                  Data & Tools — hover for details
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {DATA_TOOLS.map(tool => <DataToolCard key={tool.label} tool={tool} />)}
                </div>
              </motion.div>

              <FlowConnector delay={700} height={30} />

              {/* AWS Bedrock (top-left) + Generative Model (bottom-left) + Reflect & Retry (right, full height) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
              >
                <div className="flex gap-3 items-stretch">

                  {/* Left column: AWS Bedrock stacked above Generative Model */}
                  <div className="flex-1 flex flex-col gap-3">
                    <LayerCard className="p-4" glowColor="#FF9900">
                      <div className="flex items-center gap-4">
                        <AWSBedrockLogo size={44} />
                        <div className="flex-1">
                          <p className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                            KPMG Secure Cloud Hosting
                          </p>
                          <p className="text-[#6B7280] text-[10px] mt-0.5">
                            Managed Foundation Models + Vector DB + Embeddings
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[10px] text-[#00B0A0] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00B0A0] animate-pulse" />
                            Active
                          </span>
                        </div>
                      </div>
                    </LayerCard>

                    <LayerCard className="p-4" glowColor="#D97757">
                      <div className="flex items-center gap-3">
                        <ClaudeLogo size={44} />
                        <div>
                          <p className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                            Generative Model
                          </p>
                          <p className="text-[#9CA3AF] text-[9px] mt-1">
                            Inference, Scoring &amp; Output Generation
                          </p>
                        </div>
                      </div>
                    </LayerCard>
                  </div>

                  {/* Arrow column: up-arrow (R&R → AWS) top half, right-arrow (GenModel → R&R) bottom half */}
                  <div className="w-10 flex flex-col items-center justify-between py-4 gap-1">
                    {/* Arrow pointing up: from R&R back to AWS Bedrock */}
                    <div className="flex flex-col items-center gap-1">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" rotate-0>
                        <path d="M9 16V4" stroke="#005EB8" strokeWidth="1.6" strokeLinecap="round"/>
                        <path d="M3 9l6-6 6 6" stroke="#005EB8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[7px] text-[#005EB8]/60 font-bold uppercase tracking-wide text-center leading-tight rotate-0">loop</span>
                    </div>
                    <div className="flex-1 w-px bg-[#005EB8]/20" />
                    {/* Arrow pointing right: from Generative Model to R&R */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[7px] text-[#005EB8]/60 font-bold uppercase tracking-wide text-center leading-tight">send</span>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 9h13" stroke="#005EB8" strokeWidth="1.6" strokeLinecap="round"/>
                        <path d="M10 4l5 5-5 5" stroke="#005EB8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  {/* Right column: Reflect & Retry spanning full height */}
                  <div className="w-48 flex">
                    <LayerCard className="p-4 flex-1 flex flex-col justify-center" glowColor="#005EB8">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#005EB8]/10 border border-[#005EB8]/20 flex items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#005EB8" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                            Reflect &amp; Retry
                          </p>
                          <p className="text-[#6B7280] text-[10px] mt-1 leading-relaxed">
                            Autonomous self-correction loop
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-[#005EB8]/10 border border-[#005EB8]/20 rounded-lg text-[10px] text-[#005EB8] font-bold">
                          Agent
                        </span>
                      </div>
                    </LayerCard>
                  </div>

                </div>
              </motion.div>

          </div>
        </div>
      </div>
    </CCLayout>
  );
}
