// lib/platform-registry.js — one vocabulary for the platform's capabilities.
//
// The sidebar, the AI Stack page and the Services map all read their names,
// routes and status from here, so a capability is called the same thing
// everywhere and every count is computed, never typed.
//
// Status is audited, not assumed:
//   live     real data flowing today (live inputs, live search, live store)
//   dataset  works end to end on the Nexus operating dataset, not yet on a
//            client's live feeds
//   roadmap  designed, not built (or built but not enabled) — never clickable

export const STATUS = {
  live: { label: 'Live', color: '#00B0A0', note: 'Real data flowing today' },
  dataset: { label: 'Dataset', color: '#E87722', note: 'Runs end to end on the K-Nexus operating dataset; client feeds not yet connected' },
  roadmap: { label: 'Roadmap', color: '#94A3B8', note: 'Designed, not yet built' },
};

/** The lenses: one data model, the questions it answers. Labels are the sidebar's. */
export const LENSES = [
  { id: 'capacity', label: 'Capacity Simulation', subtitle: 'Can I take this customer?', href: '/command-center/capacity-simulation', icon: 'gauge', color: '#00338D', status: 'dataset', engines: ['capacity', 'cascade'] },
  { id: 'predictive', label: 'Predictive Risk', subtitle: 'Drift before it breaks', href: '/command-center/predictive', icon: 'radar', color: '#005EB8', status: 'dataset', engines: ['drift'] },
  { id: 'water', label: 'Water Intelligence', subtitle: 'Usage, stress, circularity', href: '/command-center/water', icon: 'droplet', color: '#0E7490', status: 'dataset', engines: ['water'] },
  { id: 'clean-energy', label: 'Clean Energy (24/7)', subtitle: 'Hourly carbon-free matching', href: '/command-center/clean-energy', icon: 'sun', color: '#00B0A0', status: 'dataset', engines: ['cfe', 'carbon'] },
  { id: 'site-risk', label: 'Site & Supply Risk', subtitle: 'Grid, hazard, single-source', href: '/command-center/site-risk', icon: 'shield', color: '#5B4FC7', status: 'dataset', engines: ['site-risk'] },
  { id: 'esg', label: 'ESG Disclosure', subtitle: 'Audit-ready, traceable', href: '/command-center/esg', icon: 'file-check', color: '#C8102E', status: 'dataset', engines: ['esg'] },
  { id: 'policy', label: 'Policy & Compliance', subtitle: 'Obligations by jurisdiction', href: '/command-center/compliance', icon: 'scale', color: '#E87722', status: 'dataset', engines: ['policy'] },
];
export const lensLabel = (id) => LENSES.find((l) => l.id === id)?.label ?? id;

/** Deterministic engines (lib/nexus/*): every number is computed here, in code. */
export const ENGINES = [
  { id: 'capacity', label: 'Capacity & stranding', module: 'capacity-engine' },
  { id: 'cascade', label: 'Dependency cascade', module: 'impact-engine' },
  { id: 'drift', label: 'Drift detection', module: 'predictive-engine' },
  { id: 'thermal', label: 'Thermal model', module: 'thermal-model' },
  { id: 'water', label: 'Water & circularity', module: 'water-engine' },
  { id: 'cfe', label: 'Hourly CFE matching', module: 'cfe-engine' },
  { id: 'carbon', label: 'Scope 2 & embodied carbon', module: 'carbon-engine' },
  { id: 'site-risk', label: 'Site risk scoring', module: 'site-risk-engine' },
  { id: 'esg', label: 'Disclosure mapping', module: 'esg-engine' },
  { id: 'policy', label: 'Policy obligations', module: 'policy-engine' },
];

/** External data and tools, audited against the code and configured keys. */
export const TOOLS = [
  { id: 'tavily', label: 'Tavily', description: 'Live market and news search', status: 'live', detail: 'Client research, external-risk news feeds' },
  { id: 'exa', label: 'Exa', description: 'Semantic search, similar cases', status: 'roadmap', detail: 'Connector written; not yet enabled' },
  { id: 'peeringdb', label: 'PeeringDB', description: 'Facility connectivity data', status: 'live', detail: 'Public API: India facilities and interconnection' },
  { id: 'knowledge-graph', label: 'Knowledge Graph', description: 'Pattern memory across engagements', status: 'live', detail: 'Stored, embedded on write, retrieved into briefs', href: '/wiki?mode=knowledge' },
];

/** The advisory lifecycle as one journey. Stop titles are the screens' own names. */
export const PHASES = [
  { id: 'strategise', label: 'Strategise', color: '#005EB8', outcomes: 'Site feasibility, investment case, funding strategy', stakeholders: 'Investors, landowners, KPMG advisory' },
  { id: 'build', label: 'Build', color: '#5B4FC7', outcomes: 'Design, procurement, construction oversight', stakeholders: 'OEMs, contractors, regulators' },
  { id: 'operate', label: 'Operate', color: '#00B0A0', outcomes: 'Safe, efficient, disclosure-ready operations', stakeholders: 'Operations team, tenants, regulators' },
  { id: 'monetise', label: 'Monetise', color: '#D99A1E', outcomes: 'Capital recycling, tenant revenue, exit readiness', stakeholders: 'Investors, lenders, buyers' },
];

export const STOPS = [
  { id: 'global-infra', phase: 'strategise', title: 'Global Infrastructure Intelligence', role: 'Market & site feasibility', href: '/global-infrastructure', status: 'live', icon: 'globe', description: 'Facilities, interconnection and market context from live PeeringDB data.' },
  { id: 'client-cockpit', phase: 'strategise', title: 'Client Cockpit', role: 'Client assessment', href: '/client-cockpit', status: 'live', icon: 'briefcase', description: 'A client brief researched live and turned into a readiness assessment.' },
  { id: 'strategy', phase: 'strategise', title: 'Strategy', role: 'Investment & funding strategy', href: '/stage/01', status: 'live', icon: 'trend', description: 'Market entry and funding options for the client’s brief, with live research.' },
  { id: 'site-risk', phase: 'strategise', title: lensLabel('site-risk'), role: 'Risk & regulatory scan', href: '/command-center/site-risk', status: 'dataset', icon: 'shield', description: 'Grid, natural hazard and single-source supply exposure by site.' },
  { id: 'investment-cockpit', phase: 'strategise', title: 'Investment Cockpit', role: 'Business case', href: '/cockpit/tata-power', status: 'dataset', icon: 'chart', description: 'Market size, ranked opportunities and a 48-month roadmap for one client.' },
  { id: 'supply-chain', phase: 'build', title: 'Supply Chain Management', role: 'Sourcing', href: '/stage/02', status: 'live', icon: 'package', description: 'Vendors, lead times and sourcing risk for the build.' },
  { id: 'design-build', phase: 'build', title: 'Design & Build', role: 'Design & engineering', href: '/stage/03', status: 'live', icon: 'wrench', description: 'Tier, density, cooling and power design for the brief.' },
  { id: 'procurement', phase: 'build', title: 'Procurement & Contracting', role: 'Contracts and tenders', href: null, status: 'roadmap', icon: 'file', description: 'Tender packages, contract terms and award tracking.' },
  { id: 'construction', phase: 'build', title: 'Construction Management', role: 'Programme oversight', href: null, status: 'roadmap', icon: 'hardhat', description: 'Programme, cost and quality tracking through construction.' },
  { id: 'regulatory', phase: 'build', title: 'Regulatory Compliance', role: 'Compliance mapping', href: '/stage/04', status: 'live', icon: 'scale', description: 'Approvals and obligations mapped for the site’s jurisdiction.' },
  { id: 'command-center', phase: 'operate', title: 'Command Center', role: 'Monitoring', href: '/command-center', status: 'dataset', icon: 'monitor', description: 'Portfolio KPIs, live alerts and SLA exposure in one view.' },
  { id: 'incidents', phase: 'operate', title: 'Incidents', role: 'Incident intelligence', href: '/incidents', status: 'dataset', icon: 'alert', description: 'Cause, exposed tenants and first action for every alert.' },
  { id: 'predictive', phase: 'operate', title: lensLabel('predictive'), role: 'Before it breaks', href: '/command-center/predictive', status: 'dataset', icon: 'radar', description: 'Efficiency drift and component degradation, with act-by dates.' },
  { id: 'capacity', phase: 'operate', title: lensLabel('capacity'), role: 'Capacity optimisation', href: '/command-center/capacity-simulation', status: 'dataset', icon: 'gauge', description: 'Stranded capacity, fit checks and cascade on the facility twin.' },
  { id: 'water', phase: 'operate', title: lensLabel('water'), role: 'Water & circularity', href: '/command-center/water', status: 'dataset', icon: 'droplet', description: 'Usage, basin stress, reuse levers and obligations.' },
  { id: 'clean-energy', phase: 'operate', title: lensLabel('clean-energy'), role: 'Hourly carbon-free matching', href: '/command-center/clean-energy', status: 'dataset', icon: 'sun', description: 'How far power is from 24/7 matching, and what closes the gap.' },
  { id: 'esg', phase: 'operate', title: lensLabel('esg'), role: 'Disclosure', href: '/command-center/esg', status: 'dataset', icon: 'filecheck', description: 'BRSR, EED and GRESB packs with source-row traceability.' },
  { id: 'monetisation', phase: 'monetise', title: 'Monetisation', role: 'Revenue optimisation', href: '/stage/06', status: 'live', icon: 'dollar', description: 'Pricing, tenant mix and revenue levers for the asset.' },
  { id: 'sla', phase: 'monetise', title: 'SLA Exposure', role: 'Tenant & contract management', href: '/command-center', status: 'dataset', icon: 'users', description: 'Contracts, penalties and notification deadlines against live alerts.' },
  { id: 'pattern-memory', phase: 'monetise', title: 'Pattern Memory', role: 'Knowledge graph enrichment', href: '/wiki?mode=patterns', status: 'dataset', icon: 'network', description: 'Failure patterns linked across sites and incidents.' },
  { id: 'refinancing', phase: 'monetise', title: 'Refinancing & Exit Readiness', role: 'Capital recycling', href: null, status: 'roadmap', icon: 'bank', description: 'Valuation readiness, data rooms and exit options.' },
];

/** Counts for headers, computed from the lists above. */
export const countBy = (items, status) => items.filter((i) => i.status === status).length;
