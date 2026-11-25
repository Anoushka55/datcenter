// lib/trentar/matcher.js — does a Guide prompt ask for Trentar's investment-readiness cockpit?
//
// Deterministic, frontend-only, no model call. The prompt is scored on three
// concept groups, each with weighted synonyms:
//
//   entity  (Trentar)                         weight 0.4
//   asset   (data centre / campus / hyperscale) weight 0.3
//   intent  (readiness / FID / feasibility)    weight 0.3
//
// A group scores the strongest synonym it contains (0..1). The prompt fires
// when entity and intent are both present and the weighted sum reaches
// THRESHOLD. Requiring entity stops a generic data-centre question opening a
// client cockpit; requiring intent stops "Trentar data centre news" doing so.
//
// Kept free of imports so the Guide bundle pulls in only this file.

export const THRESHOLD = 0.7;
export const WEIGHTS = { entity: 0.4, asset: 0.3, intent: 0.3 };

const DC = ['data centre', 'data center', 'datacentre', 'datacenter', 'data centres', 'data centers', 'datacentres', 'datacenters', 'dc', 'dcs'];

/** Synonym → strength, per group. Phrases are matched as whole words. */
export const GROUPS = {
  entity: { trentar: 1, 'trentar private limited': 1, 'trentar pvt ltd': 1, 'dorf ketal': 0.8 },
  asset: {
    ...Object.fromEntries(DC.map((t) => [t, 1])),
    hyperscale: 1, hyperscaler: 0.9, 'ai campus': 1, 'ai ready campus': 1, 'data park': 1, 'data centre park': 1, 'data center park': 1,
    '500 mw': 0.9, '500mw': 0.9, campus: 0.7, 'ai ready': 0.7, park: 0.6, mw: 0.5, gpu: 0.5, facility: 0.5, project: 0.4, site: 0.4,
  },
  intent: {
    'investment readiness': 1, 'investment ready': 1, 'ready to invest': 1, fid: 1, 'final investment decision': 1, 'ready for fid': 1,
    'fid ready': 1, 'fid readiness': 1, 'commercial viability': 1, 'go no go': 0.9, investable: 0.9, 'investment decision': 0.9,
    feasibility: 0.8, feasible: 0.8, viability: 0.8, viable: 0.8, bankable: 0.8, bankability: 0.8, readiness: 0.7, 'business case': 0.7,
    sanction: 0.7, investment: 0.6, invest: 0.6, 'due diligence': 0.6, proceed: 0.5, ready: 0.5, assess: 0.3, evaluate: 0.3,
  },
};

/** Lowercase, drop possessive 's, strip punctuation, pad with spaces for whole-word matching. */
export const normalise = (text) =>
  ` ${String(text ?? '').toLowerCase().replace(/['’]s\b/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;

const has = (norm, term) => norm.includes(` ${term} `);
const round = (x) => Math.round(x * 1000) / 1000;

/**
 * @param {string} text
 * @returns {{ score: number, fires: boolean, threshold: number, groups: Record<string, { score: number, matched: string[] }> }}
 */
export function scoreTrentar(text) {
  const norm = normalise(text);
  const groups = {};
  let score = 0;
  for (const [name, terms] of Object.entries(GROUPS)) {
    const matched = Object.keys(terms).filter((t) => has(norm, t)).sort((a, b) => terms[b] - terms[a]);
    const s = matched.length ? terms[matched[0]] : 0;
    groups[name] = { score: s, matched };
    score += WEIGHTS[name] * s;
  }
  score = round(score);
  const fires = groups.entity.score > 0 && groups.intent.score > 0 && score >= THRESHOLD;
  return { score, fires, threshold: THRESHOLD, groups };
}
