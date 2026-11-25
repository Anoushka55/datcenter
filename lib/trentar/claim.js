// lib/trentar/claim.js — the only way a Trentar figure reaches the screen.
//
// A number cannot be rendered except through a Claim, and a Claim cannot exist
// without a provenance class it satisfies. JavaScript gives us no compile-time
// guarantee, so this module is the runtime type system:
//
//   • claim(spec) validates the spec and throws on any violation. There is no
//     "warn and continue" path: a malformed claim fails the build, not the demo.
//   • The result is frozen and carries a module-private Symbol tag. The tag is
//     non-enumerable, so spreading, cloning or JSON round-tripping a claim
//     produces an untagged object that assertClaim() rejects.
//   • <ClaimValue> calls assertClaim() before rendering anything.
//
// Claims do not survive a server → client prop boundary (serialisation drops
// the tag). Client components fetch claims by id from lib/trentar; pages pass
// ids, never claims.
import { researchSources } from './research-sources.js';

// Source lookup for every claim: the cockpit's research register, plus any
// register added with registerSources() (the ontology layer adds evidence.js
// when it loads; the cockpit never loads it). Same rule for all: url and date.
const sourcesById = new Map(researchSources.map((s) => [s.id, s]));
export function registerSources(list) { for (const s of list) if (!sourcesById.has(s.id)) sourcesById.set(s.id, s); }
const getSource = (id) => sourcesById.get(id);
export const isCitable = (id) => { const s = getSource(id); return Boolean(s && s.url && s.asOf); };

/** @typedef {'PUBLIC_FACT'|'EAIQ_ANALYSIS'|'ILLUSTRATIVE_SCENARIO'|'TRENTAR_INPUT_REQUIRED'} Provenance */

export const PROVENANCE = Object.freeze({
  PUBLIC_FACT: 'PUBLIC_FACT',
  EAIQ_ANALYSIS: 'EAIQ_ANALYSIS',
  ILLUSTRATIVE_SCENARIO: 'ILLUSTRATIVE_SCENARIO',
  TRENTAR_INPUT_REQUIRED: 'TRENTAR_INPUT_REQUIRED',
});

// Strength order, strongest first. A derived claim takes the weakest of its
// inputs (ontology rule r.prov.no_inherit).
const RANK = { PUBLIC_FACT: 3, EAIQ_ANALYSIS: 2, ILLUSTRATIVE_SCENARIO: 1, TRENTAR_INPUT_REQUIRED: 0 };
const CONFIDENCE = new Set(['High', 'Medium', 'Low']);
const ILLUSTRATIVE_WORD = /\billustrative\b/i;

const TAG = Symbol('trentar.claim');

export class ClaimError extends Error {
  constructor(message) { super(message); this.name = 'ClaimError'; }
}

/**
 * @typedef {Object} Evidence
 * @property {string} id
 * @property {string} label
 * @property {string} [publisher]
 * @property {string} [url]
 * @property {string} [asOf]
 * @property {boolean} citable   true only for a register source with url and asOf
 */

/**
 * @typedef {Object} ClaimSpec
 * @property {string} id
 * @property {string} label
 * @property {number|string|null} value
 * @property {string|null} [unit]
 * @property {Provenance} provenance
 * @property {string[]} [evidence]   ids into the evidence register
 * @property {string|null} [basis]
 * @property {'High'|'Medium'|'Low'} [confidence]
 * @property {string|null} [classId]
 * @property {string|null} [status]
 * @property {string|null} [owner]
 * @property {string|null} [decisionClass]
 */

/** @typedef {Readonly<Omit<ClaimSpec,'evidence'> & { evidence: ReadonlyArray<Readonly<Evidence>> }>} Claim */

const isText = (s) => typeof s === 'string' && s.trim().length > 0;

/**
 * Every reason a spec cannot become a claim. Empty means valid.
 * @param {ClaimSpec} spec
 * @returns {string[]}
 */
export function claimProblems(spec) {
  if (!spec || typeof spec !== 'object') return ['spec must be an object'];
  const p = [];
  const { id, label, value, provenance, evidence = [], basis, confidence } = spec;

  if (!isText(id)) p.push('id is required');
  if (!isText(label)) p.push('label is required');
  if (!(provenance in RANK)) p.push(`unknown provenance "${provenance}"`);
  if (!(value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)))) {
    p.push('value must be a finite number, a string or null');
  }
  if (!Array.isArray(evidence)) p.push('evidence must be an array of ids');
  if (confidence !== undefined && !CONFIDENCE.has(confidence)) p.push(`unknown confidence "${confidence}"`);
  if (spec.emphasis != null && !(isText(spec.emphasis) && isText(label) && label.includes(spec.emphasis))) p.push('emphasis must be a phrase taken from the label');
  if (spec.inputKind != null && !['supply', 'derive'].includes(spec.inputKind)) p.push(`unknown inputKind "${spec.inputKind}"`);

  switch (provenance) {
    case 'PUBLIC_FACT': {
      if (!Array.isArray(evidence) || evidence.length === 0) p.push('PUBLIC_FACT needs at least one evidence id');
      else for (const e of evidence) if (!isCitable(e)) p.push(`PUBLIC_FACT evidence "${e}" is not a citable source (needs url and asOf in evidence.js)`);
      break;
    }
    case 'EAIQ_ANALYSIS':
      if (!isText(basis)) p.push('EAIQ_ANALYSIS needs a basis naming its inputs and logic');
      break;
    case 'ILLUSTRATIVE_SCENARIO':
      if (!isText(basis)) p.push('ILLUSTRATIVE_SCENARIO needs a basis');
      if (isText(label) && !ILLUSTRATIVE_WORD.test(label)) p.push('ILLUSTRATIVE_SCENARIO label must contain the word "illustrative"');
      break;
    case 'TRENTAR_INPUT_REQUIRED':
      if (value !== null) p.push('TRENTAR_INPUT_REQUIRED must have value null');
      break;
    default:
  }
  return p;
}

/** @param {string} id @returns {Evidence} */
function resolveEvidence(id) {
  const s = getSource(id);
  return Object.freeze(s
    ? { id, label: s.label, publisher: s.publisher, url: s.url, asOf: s.asOf, citable: isCitable(id) }
    : { id, label: id, citable: false });
}

/**
 * Mint a claim. Throws ClaimError if the spec violates its provenance class.
 * @param {ClaimSpec} spec
 * @returns {Claim}
 */
export function claim(spec) {
  const problems = claimProblems(spec);
  if (problems.length) throw new ClaimError(`Malformed claim "${spec?.id ?? '?'}": ${problems.join('; ')}`);
  const c = {
    id: spec.id,
    label: spec.label,
    value: spec.value,
    unit: spec.unit ?? null,
    provenance: spec.provenance,
    evidence: Object.freeze((spec.evidence ?? []).map(resolveEvidence)),
    basis: spec.basis ?? null,
    confidence: spec.confidence ?? null,
    classId: spec.classId ?? null,
    status: spec.status ?? null,
    owner: spec.owner ?? null,
    decisionClass: spec.decisionClass ?? null,
    // TRENTAR_INPUT_REQUIRED only: 'supply' (Trentar provides it) or 'derive'
    // (it computes from upstream nodes once those are known). Null if unrecorded.
    inputKind: spec.inputKind ?? null,
    // Research findings only: the one phrase set in semibold.
    emphasis: spec.emphasis ?? null,
  };
  Object.defineProperty(c, TAG, { value: true, enumerable: false });
  return Object.freeze(c);
}

/** True only for an object minted by claim(). Copies and literals are not claims. */
export const isClaim = (x) => Boolean(x && typeof x === 'object' && x[TAG] === true);

/**
 * Guard for render paths. Returns the claim or throws.
 * @param {unknown} x
 * @param {string} [where]
 * @returns {Claim}
 */
export function assertClaim(x, where = 'render') {
  if (!isClaim(x)) {
    const shape = x === null ? 'null' : typeof x === 'object' ? `object {${Object.keys(x).slice(0, 4).join(', ')}}` : typeof x;
    throw new ClaimError(`${where}: expected a claim() result, got ${shape}. Raw values and copied claims cannot be rendered.`);
  }
  return x;
}

/** Weakest provenance in a list. */
export const weakest = (provenances) => provenances.reduce((a, b) => (RANK[b] < RANK[a] ? b : a));

/**
 * A claim computed from other claims. A computation is never a public fact,
 * and never stronger than its weakest input:
 *   • any TRENTAR_INPUT_REQUIRED input → required, value null, compute not run
 *   • any ILLUSTRATIVE_SCENARIO input  → illustrative, label marked so
 *   • otherwise                         → EAIQ_ANALYSIS
 *
 * @param {{ id: string, label: string, unit?: string|null, inputs: Claim[], logic: string, compute: (values: Array<number|string>) => number|string }} d
 * @returns {Claim}
 */
export function derive({ id, label, unit = null, inputs, logic, compute }) {
  if (!Array.isArray(inputs) || inputs.length === 0) throw new ClaimError(`derive "${id}": needs at least one input`);
  inputs.forEach((c) => assertClaim(c, `derive "${id}"`));
  const names = inputs.map((c) => `${c.label} (${c.provenance})`).join(', ');
  const floor = weakest([PROVENANCE.EAIQ_ANALYSIS, ...inputs.map((c) => c.provenance)]);

  if (floor === PROVENANCE.TRENTAR_INPUT_REQUIRED) {
    const missing = inputs.filter((c) => c.provenance === PROVENANCE.TRENTAR_INPUT_REQUIRED).map((c) => c.label).join(', ');
    return claim({ id, label, unit, value: null, provenance: floor, basis: `${logic} Not computable until Trentar supplies: ${missing}.` });
  }
  const value = compute(inputs.map((c) => c.value));
  const basis = `${logic} Inputs: ${names}.`;
  if (floor === PROVENANCE.ILLUSTRATIVE_SCENARIO) {
    return claim({ id, unit, value, basis, provenance: floor, label: ILLUSTRATIVE_WORD.test(label) ? label : `${label} (illustrative)` });
  }
  return claim({ id, label, unit, value, basis, provenance: floor });
}
