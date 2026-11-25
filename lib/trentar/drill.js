// lib/trentar/drill.js — what the drill-down modal shows for one card.
//
//   rows     readiness items for this card: all twelve on FID; elsewhere, the
//            items whose decision chain (measured node or anything upstream of
//            it) touches the card's subgraph
//   columns  the domains those rows actually reach, in DOMAINS order
//   chips    gates open, conditions and evidence gaps for this card, as claims
//   inputs   the card's TRENTAR_INPUT_REQUIRED nodes
//   sources  every dated source cited by a public fact on the card
//   notes    EAiQ analysis on the card, each with its basis
import { claim } from './claim.js';
import { cardSubgraph, evidenceGaps, edges } from './registry.js';
import { readinessRows, DOMAINS } from './fid.js';

const count = (id, label, value, basis) => claim({ id, label, value, unit: null, basis, provenance: 'EAIQ_ANALYSIS' });

const cache = new Map();

/** @param {string} cardId */
export function drillModel(cardId) {
  if (cache.has(cardId)) return cache.get(cardId);
  const sub = cardSubgraph(cardId);
  const ids = new Set(sub.claims.map((c) => c.id));
  const all = readinessRows();
  const rows = cardId === 'fid'
    ? all
    : all.filter((r) => [...r.measured, ...r.upstream].some((c) => ids.has(c.id)));

  const columns = DOMAINS.filter((d) => rows.some((r) => r.domains[d.id].claims.length > 0));

  const gapTargets = new Map(edges.filter((e) => e.relation === 'gap_in').map((e) => [e.from, e.to]));
  const gaps = cardId === 'fid' ? evidenceGaps() : evidenceGaps().filter((g) => ids.has(g.id) || ids.has(gapTargets.get(g.id)) || rows.some((r) => r.gaps.includes(g)));

  const across = cardId === 'fid' ? 'all twelve readiness items' : `the readiness items whose decision chain reaches this card's traversals (${sub.traversals.map((t) => t.id).join(', ')})`;
  const chips = {
    gates: count(`t.calc.${cardId}_drill_gates`, 'FID gates open', rows.filter((r) => r.state === 'FID_GATE').length, `Count of FID gates among ${across}.`),
    conditions: count(`t.calc.${cardId}_drill_conditions`, 'FID conditions', rows.filter((r) => r.state === 'FID_CONDITION').length, `Count of FID conditions among ${across}.`),
    gaps: count(`t.calc.${cardId}_drill_gaps`, 'Evidence gaps', gaps.length, `Count of named evidence-gap nodes on this card's subgraph, on what it measures, or on ${across}.`),
  };

  const inputs = sub.claims.filter((c) => c.provenance === 'TRENTAR_INPUT_REQUIRED' && !c.id.startsWith('t.ev.'))
    // Supply first (someone must provide these), then what computes from upstream.
    .sort((a, b) => (a.inputKind === 'derive') - (b.inputKind === 'derive'));

  const bySource = new Map();
  for (const c of sub.claims.filter((x) => x.provenance === 'PUBLIC_FACT')) {
    for (const e of c.evidence) {
      if (!bySource.has(e.id)) bySource.set(e.id, { source: e, cites: [] });
      bySource.get(e.id).cites.push(c);
    }
  }
  const sources = [...bySource.values()].sort((a, b) => (a.source.asOf < b.source.asOf ? -1 : 1));
  const notes = sub.claims.filter((c) => c.provenance === 'EAIQ_ANALYSIS' && c.basis);

  const model = { rows, columns, chips, gaps, inputs, sources, notes };
  cache.set(cardId, model);
  return model;
}

/** The evidence gap behind a readiness row, if one is named: the next step. */
export const nextStepFor = (row) => row.gaps[0] ?? null;
