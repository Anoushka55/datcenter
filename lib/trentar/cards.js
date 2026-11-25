// lib/trentar/cards.js — the six play cards, derived from the ontology.
//
// A card's configuration chooses which claims to headline, but cannot invent
// them: every headline must be a node on the card's own traversals, or one
// edge away from one (spine.test enforces this). Counts shown on screen are
// minted as EAIQ_ANALYSIS claims with the counting rule as their basis, so no
// number reaches a card except through claim().
import { claim } from './claim.js';
import { getClaim, cardSubgraph, readiness, provenanceCounts, allClaims, edges, evidenceGaps } from './registry.js';
import { sources } from './evidence.js';

/**
 * @typedef {Object} CardDef
 * @property {import('./ontology.js').PlayCardId} id
 * @property {string} ordinal
 * @property {string} title
 * @property {string} question
 * @property {string} visual        primary drill-down visual (Phase 2)
 * @property {string} takeaway      one executive line, no figures
 * @property {Array<{ id: string, caption: string }>} headline   ontology claim ids
 */

/** @type {CardDef[]} */
export const CARD_DEFS = [
  {
    id: 'fid', ordinal: '01', title: 'FID Readiness',
    question: 'Can Trentar responsibly proceed to FID?',
    visual: 'Gate and condition matrix',
    takeaway: 'Grid, site and water are open gates. No composite score is shown.',
    headline: [{ id: 't.pwr.firm_capacity', caption: 'Most consequential unknown' }],
  },
  {
    id: 'site', ordinal: '02', title: 'Site & Infrastructure',
    question: 'Where can the announced capacity actually be delivered?',
    visual: 'Maharashtra map and weighted site score',
    takeaway: 'Validate two to three micro-markets and HT feasibility before land commitment.',
    headline: [
      { id: 't.site.state', caption: 'Announced location' },
      { id: 't.site.selected', caption: 'Confirmed site' },
      { id: 't.site.crit_power', caption: 'Weight on power' },
    ],
  },
  {
    id: 'power', ordinal: '03', title: 'Power & AI Design',
    question: 'Can AI-scale loads be supported reliably and economically?',
    visual: 'Energy ladder and sourcing comparison',
    takeaway: 'Rack density sets cooling, PUE and grid intake. None is fixed yet.',
    headline: [
      { id: 't.pwr.re_commitment', caption: 'Renewable target' },
      { id: 't.pwr.firm_capacity', caption: 'Firm grid capacity' },
      { id: 't.esg.pue', caption: 'Design PUE' },
    ],
  },
  {
    id: 'regulatory', ordinal: '04', title: 'Regulatory & Incentives',
    question: 'What affects FID, COD and economic value?',
    visual: 'Approval critical path and incentive waterfall',
    takeaway: 'State support is public. Project eligibility is not yet verified.',
    headline: [
      { id: 't.reg.mou', caption: 'State support' },
      { id: 't.reg.state_policy', caption: 'Policy instrument' },
      { id: 't.reg.inc_elec_duty', caption: 'Incentive eligibility' },
    ],
  },
  {
    id: 'esg', ordinal: '05', title: 'ESG & Resources',
    question: 'Is the campus sustainable, tenant-ready and financeable?',
    visual: 'ESG KPI rail and cooling / water trade-off',
    takeaway: 'The renewable floor is public; its matching basis decides tenant acceptance.',
    headline: [
      { id: 't.esg.matching_basis', caption: 'Matching basis' },
      { id: 't.site.water_source', caption: 'Water source' },
      { id: 't.site.recycled_water', caption: 'Water reuse' },
    ],
  },
  {
    id: 'commercial', ordinal: '06', title: 'Commercial & Ecosystem',
    question: 'Are economics and ecosystem strong enough to execute?',
    visual: 'Partner ecosystem and delivery risk',
    takeaway: 'The announced figure is not a business case. No anchor tenant is named.',
    headline: [
      { id: 't.fin.announced_investment', caption: 'Announced investment' },
      { id: 't.fin.capex', caption: 'Sanctioned capex' },
      { id: 't.pty.tenant', caption: 'Anchor tenant' },
    ],
  },
];

const byId = new Map(CARD_DEFS.map((d) => [d.id, d]));

/** Node ids a card may headline: its traversal nodes plus one edge either way. */
export function allowedHeadlineIds(cardId) {
  const inGraph = new Set(cardSubgraph(cardId).claims.map((c) => c.id));
  const allowed = new Set(inGraph);
  for (const e of edges) {
    if (inGraph.has(e.from)) allowed.add(e.to);
    if (inGraph.has(e.to)) allowed.add(e.from);
  }
  return allowed;
}

const count = (id, label, value, unit, basis) => claim({ id, label, value, unit, basis, provenance: 'EAIQ_ANALYSIS' });

const READINESS_BASIS = 'Count of the twelve readiness items in the Trentar FID Decision Ontology, by decision class. Each item is classified by whether the board could responsibly sanction capital while it is open (ontology rules r.dec.gate, r.dec.condition, r.dec.postfid). A count by state, not a readiness score.';

/** FID decision-state counts, as claims. */
export const fidStates = (() => {
  let cache;
  return () => {
    if (cache) return cache;
    const rows = readiness();
    const n = (cls) => rows.filter((r) => r.decisionClass === cls).length;
    cache = {
      gates: count('t.calc.fid_gates', 'FID gates open', n('FID_GATE'), 'gates open', READINESS_BASIS),
      conditions: count('t.calc.fid_conditions', 'FID conditions to carry', n('FID_CONDITION'), 'conditions', READINESS_BASIS),
      postFid: count('t.calc.fid_postfid', 'Post-FID optimisations', n('POST_FID_OPTIMISATION'), 'post-FID', READINESS_BASIS),
    };
    return cache;
  };
})();

const views = new Map();

/**
 * Everything the cockpit needs for one card. Headline entries are claims;
 * `position` is the share of the card's subgraph in each provenance class and
 * is used only for bar widths.
 * @param {import('./ontology.js').PlayCardId} cardId
 */
export function cardView(cardId) {
  if (views.has(cardId)) return views.get(cardId);
  const def = byId.get(cardId);
  if (!def) throw new Error(`Unknown play card "${cardId}"`);
  const sub = cardSubgraph(cardId);
  const position = provenanceCounts(sub.claims);
  const total = sub.claims.length;
  const headline = def.headline.map(({ id, caption }) => ({ caption, claim: getClaim(id) }));
  if (cardId === 'fid') {
    const s = fidStates();
    headline.unshift({ caption: 'Gates', claim: s.gates }, { caption: 'Conditions', claim: s.conditions });
  }
  const needsInput = count(
    `t.calc.${cardId}_needs_input`, 'Items needing Trentar input', position.TRENTAR_INPUT_REQUIRED, `of ${total} need Trentar input`,
    `Count of nodes on this card's decision traversals (${sub.traversals.map((t) => t.id).join(', ')}) whose provenance is TRENTAR_INPUT_REQUIRED, out of all nodes on those traversals.`,
  );
  // The provenance meter's caption: one count claim per class, in meter order.
  const across = `nodes on this card's decision traversals (${sub.traversals.map((t) => t.id).join(', ')})`;
  const positionClaims = {
    PUBLIC_FACT: count(`t.calc.${cardId}_n_public`, 'Evidenced', position.PUBLIC_FACT, 'evidenced', `Count of ${across} that are public facts with a dated, linked source.`),
    EAIQ_ANALYSIS: count(`t.calc.${cardId}_n_analysis`, 'Analysed', position.EAIQ_ANALYSIS, 'analysed', `Count of ${across} that are EAiQ analysis with a stated basis.`),
    ILLUSTRATIVE_SCENARIO: count(`t.calc.${cardId}_n_illustrative`, 'Illustrative', position.ILLUSTRATIVE_SCENARIO, 'illustrative', `Count of ${across} that are illustrative scenarios, not positions.`),
    TRENTAR_INPUT_REQUIRED: count(`t.calc.${cardId}_n_required`, 'Input required', position.TRENTAR_INPUT_REQUIRED, 'required', `Count of ${across} that need Trentar's data.`),
  };
  const view = { ...def, headline, position, positionClaims, total, needsInput, traversals: sub.traversals };
  views.set(cardId, view);
  return view;
}

/**
 * The hero stat strip: three public facts, then three counts. Counts carry no
 * unit here because the chip's label names what is counted.
 */
export const heroStats = (() => {
  let cache;
  return () => {
    if (cache) return cache;
    const rows = readiness();
    const n = (cls) => rows.filter((r) => r.decisionClass === cls).length;
    cache = [
      { key: 'capacity', caption: 'Announced capacity', claim: getClaim('t.prj.it_capacity') },
      { key: 'investment', caption: 'Announced investment', claim: getClaim('t.fin.announced_investment') },
      { key: 'renewable', caption: 'Renewable target', claim: getClaim('t.pwr.re_commitment') },
      { key: 'gates', caption: 'Gates open', claim: count('t.calc.hero_gates', 'FID gates open', n('FID_GATE'), null, READINESS_BASIS) },
      { key: 'conditions', caption: 'Conditions', claim: count('t.calc.hero_conditions', 'FID conditions to carry', n('FID_CONDITION'), null, READINESS_BASIS) },
      { key: 'gaps', caption: 'Evidence gaps', claim: count('t.calc.hero_gaps', 'Named evidence gaps', evidenceGaps().length, null, 'Count of evidence-gap nodes in the Trentar FID Decision Ontology: each names what is missing, from whom, and what it would unblock.') },
    ];
    return cache;
  };
})();

/** Public anchors for the cockpit header. All must be PUBLIC_FACT. */
export const ANCHORS = [
  { id: 't.prj.it_capacity', caption: 'Announced capacity' },
  { id: 't.fin.announced_investment', caption: 'Announced investment' },
  { id: 't.pwr.re_commitment', caption: 'Renewable target' },
  { id: 't.site.state', caption: 'State, no site named' },
  { id: 't.reg.mou', caption: 'State support' },
  { id: 't.pty.dorf_ketal', caption: 'Sponsor group' },
];
export const anchors = () => ANCHORS.map(({ id, caption }) => ({ caption, claim: getClaim(id) }));

/** The questions to put to Trentar first. All must be TRENTAR_INPUT_REQUIRED. */
export const ASK_FIRST = [
  { id: 't.esg.matching_basis', caption: 'Renewable matching basis' },
  { id: 't.prj.capacity_basis', caption: 'IT load or grid intake?' },
];
export const askFirst = () => ASK_FIRST.map(({ id, caption }) => ({ caption, claim: getClaim(id) }));

/** Evidence position across the whole model, as claims. */
export const modelPosition = (() => {
  let cache;
  return () => {
    if (cache) return cache;
    const p = provenanceCounts(allClaims());
    const basis = (what) => `Count of ${what} across all nodes of the Trentar FID Decision Ontology.`;
    cache = {
      PUBLIC_FACT: count('t.calc.n_public', 'Public facts', p.PUBLIC_FACT, 'public facts', basis('nodes evidenced by a dated, linked public source')),
      EAIQ_ANALYSIS: count('t.calc.n_analysis', 'EAiQ analyses', p.EAIQ_ANALYSIS, 'assessed', basis('nodes derived by EAiQ with a stated basis')),
      ILLUSTRATIVE_SCENARIO: count('t.calc.n_illustrative', 'Illustrative scenarios', p.ILLUSTRATIVE_SCENARIO, 'illustrative', basis('illustrative design assumptions')),
      TRENTAR_INPUT_REQUIRED: count('t.calc.n_required', 'Trentar inputs required', p.TRENTAR_INPUT_REQUIRED, 'need Trentar data', basis('nodes that cannot be determined from available information')),
    };
    return cache;
  };
})();

/** Latest source date, for the "evidence as of" line. Deterministic: no clock. */
export const evidenceAsOf = () => sources.map((s) => s.asOf).sort().at(-1);
