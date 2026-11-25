'use client';
// Live view of the cockpit matcher for what is being typed into the Guide:
// each cockpit's score, threshold, verdict and the terms it matched in each
// concept group. Shows in development, or anywhere with ?matcher in the URL,
// so the demo can show it is concept scoring rather than one magic phrase.
import { useEffect, useState } from 'react';
import { explainMatch, matchCockpit } from '@/lib/cockpit/trigger';

export function useMatcherDebug() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).has('matcher'));
  }, []);
  return on;
}

export default function MatcherDebug({ text }) {
  if (!text.trim()) return null;
  const rows = explainMatch(text);
  const winner = matchCockpit(text);
  return (
    <div className="mt-2 rounded-lg text-[10.5px] leading-snug" style={{ background: '#0F172A', color: '#CBD5E1', padding: '8px 10px', fontFamily: 'ui-monospace, Menlo, monospace' }}>
      <div className="flex justify-between mb-1" style={{ color: '#94A3B8' }}>
        <span>cockpit matcher · dev</span>
        <span>{winner ? `→ opens ${winner}` : '→ Guide answers'}</span>
      </div>
      {rows.map((r) => (
        <div key={r.slug} className="mb-1">
          <span style={{ color: r.fires ? '#86EFAC' : '#FCA5A5' }}>{r.fires ? '●' : '○'} {r.slug}</span>
          {' '}score {r.score.toFixed(3)} / {Number(r.threshold).toFixed(2)}
          {Object.entries(r.groups).map(([g, v]) => (
            <div key={g} className="pl-3" style={{ color: v.matched.length ? '#E2E8F0' : '#64748B' }}>
              {g}{typeof v.score === 'number' ? ` ${v.score.toFixed(2)}` : ''}: {v.matched.length ? v.matched.join(', ') : '—'}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
