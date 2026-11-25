// lib/trentar/registry.js — every ontology node minted as a claim at module load.
//
// A malformed node throws here, so `next build` and the test run both fail
// before anything renders. Raw ontology nodes never leave this module.
import * as ontology from './ontology.js';
import { sources as ontologySources } from './evidence.js';
import { claim, PROVENANCE, ClaimError, registerSources, isCitable } from './claim.js';

// The ontology's own evidence register; the cockpit never loads this module.
registerSources(ontologySources);

/** @typedef {import('./ontology.js').PlayCardId} PlayCardId */
export const CARD_IDS = /** @type {const} */ (['fid', 'site', 'power', 'regulatory', 'esg', 'commercial']);
export const TERMINAL = ontology.TERMINAL;

/**
 * A register source is its own citation. Narrow on purpose: applies only to a
 * PUBLIC_FACT node with no evidence whose own id is a citable register entry
 * (t.ev.prnewswire, t.ev.wmedia). Any other public fact must cite a source.
 * @param {import('./ontology.js').OntologyNode} n
 */
const evidenceFor = (n) =>
  n.provenance === PROVENANCE.PUBLIC_FACT && n.evidence.length === 0 && isCitable(n.id) ? [n.id] : n.evidence;

// The ontology spells confidence in capitals; claims use the requirement's
// High / Medium / Low. Anything else passes through and claim() rejects it.
const CONFIDENCE = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

/** @param {import('./ontology.js').OntologyNode} n */
export function claimFromNode(n) {
  return claim({
    id: n.id,
    label: n.label,
    value: n.value,
    unit: n.unit,
    provenance: n.provenance,
    evidence: evidenceFor(n),
    basis: n.basis,
    classId: n.classId,
    status: n.status,
    owner: n.owner,
    decisionClass: n.decisionClass,
    inputKind: n.inputKind,
    confidence: n.confidence == null ? undefined : (CONFIDENCE[n.confidence] ?? n.confidence),
  });
}

const registry = new Map(ontology.nodes.map((n) => [n.id, claimFromNode(n)]));

/** @param {string} id */
export function getClaim(id) {
  const c = registry.get(id);
  if (!c) throw new ClaimError(`No Trentar claim "${id}"`);
  return c;
}

export const hasClaim = (id) => registry.has(id);
export const allClaims = () => [...registry.values()];
const toClaims = (ns) => ns.map((n) => registry.get(n.id));

/** Count of claims per provenance class. */
export function provenanceCounts(claims = allClaims()) {
  const out = { PUBLIC_FACT: 0, EAIQ_ANALYSIS: 0, ILLUSTRATIVE_SCENARIO: 0, TRENTAR_INPUT_REQUIRED: 0 };
  for (const c of claims) out[c.provenance] += 1;
  return out;
}

/**
 * The subgraph a play card is built from, as claims. 'View dependencies' draws
 * this same object, so the graph and the card cannot disagree.
 * @param {PlayCardId} card
 */
export function cardSubgraph(card) {
  if (!CARD_IDS.includes(card)) throw new ClaimError(`Unknown play card "${card}"`);
  const g = ontology.subgraphFor(card);
  return { card, traversals: g.traversals, claims: toClaims(g.nodes), edges: g.edges };
}

export const readiness = () => toClaims(ontology.readinessItems());
export const inputsRequired = () => toClaims(ontology.requiredInputs());
export const evidenceGaps = () => toClaims(ontology.evidenceGaps());

/** The traversal the ontology declares primary for a card (exactly one per card). */
export function primaryTraversalId(card) {
  if (!CARD_IDS.includes(card)) throw new ClaimError(`Unknown play card "${card}"`);
  const t = ontology.primaryTraversal(card);
  if (!t) throw new ClaimError(`The ontology declares no primary traversal for "${card}"`);
  return t.id;
}

/** Outgoing edges from a claim's node (ids and relations only). */
export const outgoing = (id) => ontology.outgoing(id);

// Definitions carry no project values, so they are safe to expose as-is.
export const traversals = ontology.traversals;
export const edges = ontology.edges;
export const relations = ontology.relations;
export const rules = ontology.rules;
export const classes = ontology.classes;
export const getClass = (id) => ontology.classes.find((c) => c.id === id);
