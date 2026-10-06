'use client';
// Capacity intelligence for Nexus Mumbai-1. Compute first, narrate second:
// every answer is computed synchronously by the deterministic engines, the
// twin and result panel render immediately, and the narration streams in
// afterwards. `?demo=1` makes every path local (no network calls).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircleQuestion, X } from 'lucide-react';
import { getRow, racksInRow, index } from '@/lib/nexus/data';
import { findStrandedCapacity, canAccommodate, densityReadiness, findBreakingPoint } from '@/lib/nexus/capacity-engine';
import { propagateChange } from '@/lib/nexus/impact-engine';
import { buildReplay } from '@/lib/nexus/replay';
import { idleView, strandedView, capacityView, densityView, cascadeView, replayView } from '@/lib/nexus/twin-model';
import { parseQuery, parseLocally, resolveQuery, HERO_FACILITY } from '@/lib/nexus/query-parser';
import { narrate } from '@/lib/nexus/narrator';
import ControlPanel, { QueryBar } from './ControlPanel';
import { ResultShell, StrandedCard, CapacityCard, DensityCard, ImpactReport, ReplayPanel, Legend } from './ResultCards';

const NexusTwin = dynamic(() => import('./NexusTwin'), { ssr: false });

const FACILITY = HERO_FACILITY;
const PANEL_W = 352;      // control panel incl. margins
const COLLAPSED_W = 72;  // collapsed icon bar incl. margins
const RESULT_W = 420;
const MIN_TWIN_W = 640;
const REPLAY_INCIDENT = 'INC-2026-0318';
const SCENE2_QUERY = 'Can we take 2MW at 60kW density?';

const usableRacks = (rowId) => racksInRow(FACILITY, rowId).filter((r) => r.status !== 'blocked').length;
const averageDensity = (rowId) => {
  const racks = racksInRow(FACILITY, rowId).filter((r) => r.status !== 'blocked');
  return Math.round(racks.reduce((s, r) => s + r.used_kw, 0) / racks.length);
};

export default function NexusCapacityPage() {
  const [demoMode, setDemoMode] = useState(false);
  const [answer, setAnswer] = useState(null); // { intent, result, view, scene, viewToggle, meta }
  const [narration, setNarration] = useState({ text: '', narrating: false, source: null });
  const [runKey, setRunKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [clarification, setClarification] = useState(null);
  const [rowId, setRowId] = useState('G');
  const [densityKw, setDensityKw] = useState(averageDensity('G'));
  const [rackCount, setRackCount] = useState(usableRacks('G'));
  const [preview, setPreview] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const rootRef = useRef(null);
  const narrationRun = useRef(0);
  const autoCollapsed = useRef(false);

  useEffect(() => {
    setDemoMode(new URLSearchParams(window.location.search).get('demo') === '1');
  }, []);

  // ── Present a computed answer: twin + panel now, narration streams after ──
  const present = useCallback((intent, result, { view, scene = null, viewToggle = null, meta = '', keepPanel = false }) => {
    setAnswer({ intent, result, view, scene, viewToggle, meta });
    setRunKey((k) => k + 1);
    setClarification(null);

    // Make room for the result on narrow screens — unless the run came from the
    // scenario controls, which the user is still working with.
    const width = rootRef.current?.clientWidth ?? Infinity;
    if (!keepPanel && width - PANEL_W - RESULT_W < MIN_TWIN_W) {
      setCollapsed((was) => { if (!was) autoCollapsed.current = true; return true; });
    }

    const run = ++narrationRun.current;
    setNarration({ text: '', narrating: true, source: null });
    narrate({
      intent: intent === 'replay' ? 'replay' : intent,
      result,
      demoMode,
      onText: (text) => { if (run === narrationRun.current) setNarration((n) => ({ ...n, text })); },
    }).then(({ text, source }) => {
      if (run === narrationRun.current) setNarration({ text, narrating: false, source });
    });
  }, [demoMode]);

  const compute = useCallback((intent, params, extras = {}) => {
    const t0 = performance.now();
    let result, view;
    switch (intent) {
      case 'stranded_capacity':
        result = findStrandedCapacity(params.facilityId);
        view = strandedView(params.facilityId, result);
        break;
      case 'capacity_check':
        result = canAccommodate(params);
        view = capacityView(params.facilityId, result);
        break;
      case 'density_readiness':
        result = densityReadiness(params.facilityId);
        view = densityView(params.facilityId, result);
        break;
      case 'cascade_simulation':
        result = propagateChange({ facilityId: params.facilityId, changes: [{ rowId: params.rowId, newDensityKw: params.densityKw, ...(params.rackCount ? { rackCount: params.rackCount } : {}) }] });
        if (extras.breakingPoint) result = { ...result, breakingPoint: extras.breakingPoint };
        view = cascadeView(params.facilityId, result, { focusComponentId: extras.breakingPoint?.firstConstraint ?? null });
        break;
      case 'failure_simulation':
        result = propagateChange({ facilityId: params.facilityId, changes: [{ componentId: params.componentId, failed: true }] });
        view = cascadeView(params.facilityId, result);
        break;
      case 'replay':
        result = buildReplay(params.incidentId);
        view = replayView(params.facilityId, index.incidentById.get(params.incidentId));
        break;
      default:
        throw new Error(`Unknown intent ${intent}`);
    }
    return { result, view, computeMs: performance.now() - t0 };
  }, []);

  const runIntent = useCallback((intent, params, { scene = null, viewToggle = null, extras, prefix = '', keepPanel = false } = {}) => {
    const { result, view, computeMs } = compute(intent, params, extras);
    present(intent, result, { view, scene, viewToggle, keepPanel, meta: `${prefix}Computed in ${computeMs.toFixed(1)} ms from the Nexus dataset` });
  }, [compute, present]);

  // ── Demo scenes and views ──
  const onScene = useCallback((id) => {
    if (id === 'scene1') runIntent('stranded_capacity', { facilityId: FACILITY }, { scene: id });
    if (id === 'scene2') {
      const r = resolveQuery(parseLocally(SCENE2_QUERY));
      runIntent(r.intent, r.params, { scene: id, prefix: `“${SCENE2_QUERY}” · ` });
    }
    if (id === 'scene3') {
      setRowId('G');
      setDensityKw(60);
      setRackCount(usableRacks('G'));
      runIntent('cascade_simulation', { facilityId: FACILITY, rowId: 'G', densityKw: 60 }, { scene: id });
    }
    if (id === 'scene4') runIntent('replay', { facilityId: FACILITY, incidentId: REPLAY_INCIDENT }, { scene: id });
  }, [runIntent]);

  const onView = useCallback((id) => {
    if (answer?.viewToggle === id) { closeAnswer(); return; }
    if (id === 'stranded') runIntent('stranded_capacity', { facilityId: FACILITY }, { viewToggle: id });
    if (id === 'density') runIntent('density_readiness', { facilityId: FACILITY }, { viewToggle: id });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, runIntent]);

  // ── Typed questions ──
  const onQuery = useCallback(async (text) => {
    setBusy(true);
    const t0 = performance.now();
    try {
      const parsed = await parseQuery(text, { demoMode });
      const resolved = resolveQuery(parsed);
      if (resolved.clarification) { setClarification(resolved.clarification); return; }
      const parseMs = performance.now() - t0;
      runIntent(resolved.intent, resolved.params, { prefix: `Parsed by ${parsed.source === 'llm' ? 'Claude' : 'local parser'} in ${Math.round(parseMs)} ms · ` });
      if (resolved.intent === 'cascade_simulation') {
        setRowId(resolved.params.rowId);
        setDensityKw(resolved.params.densityKw);
        setRackCount(usableRacks(resolved.params.rowId));
      }
    } finally {
      setBusy(false);
    }
  }, [demoMode, runIntent]);

  // ── Scenario controls ──
  const onRow = useCallback((id) => {
    setRowId(id);
    setDensityKw(averageDensity(id));
    setRackCount(usableRacks(id));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPreview(propagateChange({ facilityId: FACILITY, changes: [{ rowId, newDensityKw: densityKw, rackCount }] }));
    }, 150);
    return () => clearTimeout(t);
  }, [rowId, densityKw, rackCount]);

  const runScenario = useCallback(() => {
    runIntent('cascade_simulation', { facilityId: FACILITY, rowId, densityKw, rackCount }, { keepPanel: true });
  }, [runIntent, rowId, densityKw, rackCount]);

  const onBreakingPoint = useCallback(() => {
    const bp = findBreakingPoint({ facilityId: FACILITY, rowId });
    const density = bp.breaksAtDensityKw ?? bp.maxDensityKw;
    setDensityKw(density);
    setRackCount(usableRacks(rowId));
    runIntent('cascade_simulation', { facilityId: FACILITY, rowId, densityKw: density }, { extras: { breakingPoint: bp }, keepPanel: true });
  }, [rowId, runIntent]);

  function closeAnswer() {
    narrationRun.current += 1;
    setAnswer(null);
    setNarration({ text: '', narrating: false, source: null });
    setRunKey((k) => k + 1);
    if (autoCollapsed.current) { autoCollapsed.current = false; setCollapsed(false); }
  }

  const view = useMemo(() => answer?.view ?? idleView(FACILITY, rowId), [answer, rowId]);
  const insetLeft = collapsed ? COLLAPSED_W : PANEL_W;
  const insetRight = answer ? RESULT_W : 0;

  const card = () => {
    if (!answer) return null;
    const props = { result: answer.result, narration };
    switch (answer.intent) {
      case 'stranded_capacity': return <StrandedCard {...props} />;
      case 'capacity_check': return <CapacityCard {...props} />;
      case 'density_readiness': return <DensityCard {...props} />;
      case 'cascade_simulation':
      case 'failure_simulation': return <ImpactReport {...props} />;
      case 'replay': return <ReplayPanel {...props} />;
      default: return null;
    }
  };

  return (
    <div ref={rootRef} className="w-full h-full relative overflow-hidden bg-[#070d18]" data-testid="nexus-page">
      <NexusTwin facilityId={FACILITY} view={view} runKey={runKey} insetLeft={insetLeft} insetRight={insetRight} onRackClick={(rack) => onRow(rack.row_id)} />

      <QueryBar onSubmit={onQuery} busy={busy} left={insetLeft} right={insetRight} />

      <ControlPanel
        collapsed={collapsed}
        onToggle={() => { autoCollapsed.current = false; setCollapsed((c) => !c); }}
        activeScene={answer?.scene}
        onScene={onScene}
        activeView={answer?.viewToggle}
        onView={onView}
        rowId={rowId}
        onRow={onRow}
        row={getRow(FACILITY, rowId)}
        densityKw={densityKw}
        onDensity={setDensityKw}
        onDensityCommit={runScenario}
        rackCount={rackCount}
        maxRackCount={usableRacks(rowId)}
        onRackCount={setRackCount}
        preview={preview}
        onRun={runScenario}
        onBreakingPoint={onBreakingPoint}
        busy={busy}
      />

      <Legend items={answer?.view?.legend} left={insetLeft + 16} />

      {demoMode && (
        <div className="absolute bottom-4 z-20 text-[10px] font-mono text-[#fbbf24]/80 bg-[#070d18]/80 border border-[#fbbf24]/30 rounded px-2 py-1" style={{ right: insetRight + 16 }}>
          DEMO MODE · offline
        </div>
      )}

      <AnimatePresence>
        {clarification && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-[118px] z-30 flex justify-center px-4 pointer-events-none" style={{ left: insetLeft, right: insetRight }}>
            <div className="pointer-events-auto max-w-md bg-[#fbbf24]/12 border border-[#fbbf24]/40 rounded-xl px-3.5 py-2 flex items-center gap-2" role="status">
              <MessageCircleQuestion size={14} className="text-[#fbbf24] flex-shrink-0" />
              <p className="text-xs text-[#fde68a]">{clarification}</p>
              <button onClick={() => setClarification(null)} aria-label="Dismiss" className="text-[#fde68a]/60 hover:text-[#fde68a]"><X size={13} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {answer && (
          <ResultShell key={`${answer.intent}-${runKey}`} onClose={closeAnswer} meta={answer.meta}>
            {card()}
          </ResultShell>
        )}
      </AnimatePresence>
    </div>
  );
}
