'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Newspaper, ExternalLink, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import LandingChatPanel from '@/components/chat/LandingChatPanel';
import useAppStore from '@/store/appStore';

// Globe loaded client-side only (requires WebGL)
const GlobeViewer = dynamic(() => import('@/components/globe/GlobeViewer'), { ssr: false });

// ── Animated Background ────────────────────────────────────────────────────────
function AnimatedBackground() {
  const [particles, setParticles] = useState(null);

  useEffect(() => {
    setParticles(
      [...Array(12)].map(() => ({
        width:    Math.random() * 3 + 1.5,
        height:   Math.random() * 3 + 1.5,
        left:     Math.random() * 100,
        top:      Math.random() * 100,
        g:        51  + Math.random() * 70,
        b:        141 + Math.random() * 59,
        a:        0.15 + Math.random() * 0.2,
        dy:       -30 - Math.random() * 20,
        dx:       (Math.random() - 0.5) * 20,
        duration: 4 + Math.random() * 4,
        delay:    Math.random() * 4,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,51,141,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,51,141,0.055) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="absolute"
        style={{
          top: '30%', left: '30%', transform: 'translate(-50%, -50%)',
          width: 900, height: 900,
          background: 'radial-gradient(circle, rgba(0,119,200,0.06) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
      />
      {particles && particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width:      p.width,
            height:     p.height,
            left:       `${p.left}%`,
            top:        `${p.top}%`,
            background: `rgba(0, ${p.g}, ${p.b}, ${p.a})`,
          }}
          animate={{ y: [0, p.dy, 0], x: [0, p.dx, 0], opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── India news badge (no emoji) ───────────────────────────────────────────────
function IndiaBadge() {
  return (
    <span
      className="inline-flex items-center justify-center text-[9px] font-extrabold rounded px-1 py-0.5 leading-none tracking-wide"
      style={{ background: '#FF9933', color: '#ffffff', minWidth: 18 }}
    >
      IN
    </span>
  );
}

// ── News helpers ──────────────────────────────────────────────────────────────
function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = (new Date(isoString) - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60)    return fmt.format(Math.round(diff), 'second');
  if (abs < 3600)  return fmt.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return fmt.format(Math.round(diff / 3600), 'hour');
  return fmt.format(Math.round(diff / 86400), 'day');
}

// ── News Section ──────────────────────────────────────────────────────────────
function DatacenterNewsSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indiaMode, setIndiaMode] = useState(false);

  const fetchNews = async (india = indiaMode) => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/news${india ? '?mode=india' : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(indiaMode);
    const interval = setInterval(() => fetchNews(indiaMode), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [indiaMode]);

  const sectionTitle = indiaMode ? 'India Datacenter News' : 'Global Datacenter News';

  const IndiaToggle = () => (
    <button
      onClick={() => setIndiaMode(m => !m)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
        indiaMode
          ? 'bg-[#FF9933]/10 border-[#FF9933]/40 text-[#CC6600]'
          : 'bg-white border-[#D8DCE3] text-[#9CA3AF] hover:bg-[#F0F2F5]'
      }`}
    >
      {indiaMode ? <IndiaBadge /> : <Globe size={11} />}
      <span>{indiaMode ? 'India Focus' : 'Global'}</span>
    </button>
  );

  if (loading) return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[#9CA3AF] text-sm font-semibold uppercase tracking-widest">{sectionTitle}</h2>
        <IndiaToggle />
      </div>
      <div style={{ columnCount: 3, columnGap: '12px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="break-inside-avoid mb-3 bg-white border border-[#D8DCE3] rounded-xl overflow-hidden shadow-sm">
            {i % 4 === 0 && <div className="shimmer h-44 w-full" />}
            <div className="p-4 space-y-2">
              <div className="shimmer h-3 w-1/3 rounded" />
              <div className="shimmer h-4 w-full rounded" />
              <div className="shimmer h-4 w-5/6 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error || articles.length === 0) return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[#9CA3AF] text-sm font-semibold uppercase tracking-widest">{sectionTitle}</h2>
        <IndiaToggle />
      </div>
      <div className="bg-white border border-[#D8DCE3] rounded-xl p-8 text-center shadow-sm">
        <Newspaper size={32} className="text-[#CBD5E1] mx-auto mb-3" />
        <p className="text-[#6B7280] text-sm font-semibold mb-1">News unavailable</p>
        <p className="text-[#9CA3AF] text-xs mb-4">{error || 'No articles found at this time.'}</p>
        <button
          onClick={() => fetchNews(indiaMode)}
          className="px-4 py-2 bg-[#00338D] text-white text-xs font-bold rounded-lg hover:bg-[#002A73] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      className="mt-16"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-[#9CA3AF] text-sm font-semibold uppercase tracking-widest">{sectionTitle}</h2>
        </div>
        <div className="flex items-center gap-3">
          <IndiaToggle />
          <span className="text-[#CBD5E1] text-[10px]">Refreshes hourly</span>
        </div>
      </div>
      <div style={{ columnGap: '12px' }} className="[column-count:1] md:[column-count:2] lg:[column-count:3]">
        {articles.map((article, i) => {
          const featured = i % 4 === 0;
          const showImage = article.urlToImage && (featured || i % 3 === 1);
          return (
            <motion.a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-inside-avoid block mb-3 bg-white border border-[#D8DCE3] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#005EB8]/30 transition-all duration-200 group relative"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.05 }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00338D] to-[#005EB8] opacity-0 group-hover:opacity-100 transition-opacity" />
              {showImage && (
                <div className={`overflow-hidden ${featured ? 'h-44' : 'h-28'}`}>
                  <img
                    src={article.urlToImage}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[#005EB8] text-[10px] font-bold uppercase tracking-wider truncate">{article.source}</span>
                  <span className="flex items-center gap-1 text-[#9CA3AF] text-[10px] flex-shrink-0">
                    <Clock size={9} />{relativeTime(article.publishedAt)}
                  </span>
                </div>
                <h3
                  className={`text-[#1A1F36] font-bold leading-snug mb-2 group-hover:text-[#00338D] transition-colors ${featured ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'}`}
                  style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                >
                  {article.title}
                </h3>
                {article.description && (
                  <p className={`text-[#6B7280] leading-relaxed mb-3 ${featured ? 'text-xs line-clamp-3' : 'text-[10px] line-clamp-2'}`}>
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-[#005EB8] text-[10px] font-semibold group-hover:gap-2 transition-all">
                  Read more <ExternalLink size={9} />
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { introComplete, setIntroComplete } = useAppStore();
  const [phase, setPhase] = useState(introComplete ? 'done' : 'logo');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (introComplete) return;
    const t1 = setTimeout(() => setPhase('shrink'), 1500);
    const t2 = setTimeout(() => { setPhase('done'); setIntroComplete(); }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const contentVisible = phase === 'done';

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <AnimatedBackground />

      {/* ── KPMG intro loader ── */}
      <AnimatePresence>
        {(phase === 'logo' || phase === 'shrink') && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
            style={{ background: 'white' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 1, opacity: 0 }}
              animate={{
                scale: phase === 'shrink' ? 0.3 : 1,
                opacity: phase === 'logo' ? 1 : 0,
                y: phase === 'shrink' ? -100 : 0,
              }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/db/KPMG_blue_logo.svg"
                alt="KPMG"
                className="h-16 w-auto mb-4 mx-auto"
              />
              <div
                className="text-[#00338D] text-xs tracking-[6px] uppercase font-semibold"
                style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
              >
                Data Centre Lifecycle Intelligence
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 60 / 40 hero — fixed full viewport height ── */}
      <div
        className="relative z-10 flex"
        style={{ height: '100vh', paddingTop: 64 }}
      >
        {/* Left 60% — Globe, height-locked */}
        <motion.div
          className="flex flex-col items-center justify-center"
          style={{ width: '60%', height: '100%', overflow: 'hidden', padding: '32px 36px 32px 48px', background: 'radial-gradient(ellipse at 45% 45%, #0A4AAE 0%, #00338D 45%, #00266B 100%)' }}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: contentVisible ? 1 : 0, x: contentVisible ? 0 : -24 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {/* Label */}
          <div className="w-full mb-4">
            <p className="text-[#6B8CB8] text-xs font-semibold uppercase tracking-widest">
              Global Datacenter Intelligence
            </p>
            <h2
              className="text-white text-2xl font-extrabold mt-1 leading-tight"
              style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
            >
              Datacenters across the world,{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #8CC4F2, #CFE6FA)' }}
              >
                at your fingertips
              </span>
            </h2>
          </div>

          <GlobeViewer className="w-full max-w-2xl" />
        </motion.div>

        {/* Vertical divider */}
        <div
          className="flex-shrink-0 w-px self-stretch"
          style={{
            background: 'linear-gradient(to bottom, transparent 4%, rgba(0,119,200,0.25) 18%, rgba(0,119,200,0.25) 82%, transparent 96%)',
          }}
        />

        {/* Right 40% — Chat panel, height-locked, internal scroll */}
        <motion.div
          style={{ width: '40%', height: '100%', overflow: 'hidden' }}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: contentVisible ? 1 : 0, x: contentVisible ? 0 : 24 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <LandingChatPanel />
        </motion.div>
      </div>

      {/* ── News — normal-flow below the fold ── */}
      <div className="relative z-10 px-10 pb-16">
        <DatacenterNewsSection />
        <div className="mt-12 text-center">
          <p className="text-[#CBD5E1] text-xs">
            © KPMG 2026 · KNexus.AI Data Centre Intelligence · Strictly Confidential
          </p>
        </div>
      </div>
    </div>
  );
}
