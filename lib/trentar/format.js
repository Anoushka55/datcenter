// lib/trentar/format.js — how a claim reads on screen. Pure and deterministic,
// so <ClaimValue> stays a thin shell and the rules here are unit-tested.
import { assertClaim } from './claim.js';

const IN = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const COMPACT_UNITS = new Set(['%', '% (floor)', 'INR crore', 'MW', 'GW', 'km', 'ha', 'USD/W', 'USD bn']);

/** @param {number} n @param {string|null} unit */
export function formatNumber(n, unit) {
  const v = IN.format(n);
  switch (unit) {
    case null:
    case '': return v;
    case 'INR crore': return `₹${v} Cr`;
    case '%': return `${v}%`;
    case '% (floor)': return `≥${v}%`;
    case 'USD/W': return `US$${v}/W`;
    case 'USD bn': return `US$${v} bn`;
    default: return `${v} ${unit}`;
  }
}

/**
 * What a claim displays as.
 *   required  — TRENTAR_INPUT_REQUIRED: the words "Input required", never a figure
 *   number    — a formatted quantity
 *   statement — a qualitative claim; the label itself is the content
 * @param {import('./claim.js').Claim} c
 * @returns {{ kind: 'required'|'number'|'statement', text: string }}
 */
export function displayOf(c) {
  assertClaim(c, 'displayOf');
  if (c.provenance === 'TRENTAR_INPUT_REQUIRED') return { kind: 'required', text: 'Input required' };
  if (typeof c.value === 'number') {
    // Word units ("gates open", "evidenced") can be set smaller beside the numeral.
    const wordy = c.unit && !COMPACT_UNITS.has(c.unit);
    return { kind: 'number', text: formatNumber(c.value, c.unit), main: wordy ? IN.format(c.value) : formatNumber(c.value, c.unit), suffix: wordy ? c.unit : null };
  }
  if (typeof c.value === 'string') return { kind: 'statement', text: c.value };
  return { kind: 'statement', text: c.label };
}

/** "6 Oct 2026" from an ISO date, without touching the clock or the locale's timezone. */
export function formatAsOf(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return iso ?? '';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}
