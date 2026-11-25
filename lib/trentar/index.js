// lib/trentar — public surface of the Trentar investment-readiness spine.
//
// Components import from here, never from ./ontology.js or ./registry.js.
// Everything returned that carries a value is a claim() result.
export { PROVENANCE, ClaimError, isClaim, assertClaim, derive, weakest } from './claim.js';
export { displayOf, formatAsOf } from './format.js';
export { sources, getSource, isCitable } from './evidence.js';
export {
  CARD_IDS, TERMINAL, claimFromNode, getClaim, hasClaim, allClaims, provenanceCounts, cardSubgraph,
  readiness, inputsRequired, evidenceGaps, outgoing, traversals, edges, relations, rules, classes, getClass,
} from './registry.js';
export {
  CARD_DEFS, cardView, fidStates, heroStats, allowedHeadlineIds, ANCHORS, anchors, ASK_FIRST, askFirst, modelPosition, evidenceAsOf,
} from './cards.js';
export { readinessRows, fidMetrics, DOMAINS, STATES, stateRule, upstreamOf, derivesFrom, UPSTREAM_DEPTH, ownerNote } from './fid.js';
export { downstreamOf, reaches, CHANNELS, DOWNSTREAM_DEPTH } from './consequence.js';
export { siteModel, CRITERIA, CANDIDATES } from './site.js';
export { powerModel, DIMENSIONS, SOURCING, DESIGN_CHAIN } from './power.js';
export { regulatoryModel, APPROVALS, INCENTIVES } from './regulatory.js';
export { esgModel, KPIS, ESG_CHANNELS, COOLING, COOLING_DIMENSIONS } from './esg.js';
export { commercialModel, RISK_CHANNELS } from './commercial.js';
export { drillModel, nextStepFor } from './drill.js';
