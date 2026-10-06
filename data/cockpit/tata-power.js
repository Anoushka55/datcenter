// Tata Power Investment Cockpit — every figure the cockpit shows.
//
// Static by design: the cockpit renders from this file alone, identically every
// time, with no network. To add a client, copy this file, change the values and
// register it in data/cockpit/index.js.
//
// The figures reconcile with each other:
//   • market size compounds at 24% from $5.9Bn (2026) to $14.0Bn (2030)
//   • near-term opportunity = 2026 + 2027 + 2028 = $22.3Bn
//   • segments sum to the 2030 total; opportunity rows partition the segments
//     (hybrid firming = $1.9Bn of renewable + $1.3Bn of storage)
//   • new capacity to power = 6.5 GW − 1.5 GW = 5 GW

export const tataPower = {
  slug: 'tata-power',

  client: {
    name: 'Tata Power',
    legalName: 'The Tata Power Company Limited',
    cockpitTitle: 'Tata Power Investment Cockpit',
    subtitle: 'India Datacentre Power & Clean Energy Infrastructure',
    description: 'AI-powered market intelligence to identify, evaluate and prioritise investment opportunities in datacentre power infrastructure.',
    persona: 'Integrated Utility',
    region: 'India',
    initial: 'T',
    relevance: 'Integrated utility with captive generation, distribution licence and storage capability — the full stack a hyperscale datacentre needs.',
  },

  // Matched by lib/cockpit/trigger.js. Fires when a required term is present,
  // at least one strong term, and two or more supporting terms.
  trigger: {
    required: ['tata power'],
    strong: ['datacentre', 'datacenter', 'data centre', 'data center', 'datacentres', 'datacenters', 'data centres', 'data centers', 'dc'],
    supporting: ['power', 'energy', 'investment', 'invest', 'infrastructure', 'renewable', 'renewables', 'storage', 'battery', 'grid', 'hyperscale', 'opportunity', 'india', 'captive', 'entry', 'evaluate', 'evaluating', 'market'],
    analysing: [
      'Client identified — Tata Power',
      'Scanning India datacentre power market',
      'Modelling investment opportunity',
      'Cockpit ready',
    ],
  },

  kpis: [
    { value: '$14Bn', label: 'Annual market size by 2030', icon: 'bars', tint: 'blue' },
    { value: '24%', label: 'Projected CAGR (2026–2030)', icon: 'trend', tint: 'green' },
    { value: '5 GW', label: 'New datacentre capacity to power by 2030', icon: 'zap', tint: 'blue' },
    { value: '$22Bn', label: 'Near-term opportunity (2026–2028)', icon: 'leaf', tint: 'green' },
    { value: '4', label: 'Priority investment themes', icon: 'target', tint: 'blue' },
  ],

  market: {
    headline: "India's datacentre power infrastructure market is projected to reach $14Bn a year by 2030, growing at 24% CAGR as capacity moves from 1.5 GW to 6.5 GW.",
    cagrLabel: '24% CAGR',
    finalLabel: '$14Bn',
    growth: [
      { year: '2026', sizeBn: 5.9 },
      { year: '2027', sizeBn: 7.3 },
      { year: '2028', sizeBn: 9.1 },
      { year: '2029', sizeBn: 11.3 },
      { year: '2030', sizeBn: 14.0 },
    ],
    source: 'Capacity: CEEW & SYSTEMIQ (Feb 2026), India DC capacity 4.5–6.5 GW by 2030; Indian power-sector reporting. Market size modelled from that trajectory at Indian power-infrastructure cost benchmarks.',
  },

  segments: {
    total: '$14Bn',
    items: [
      { name: 'Captive Renewable Power', value: '$5.6Bn', valueBn: 5.6, share: 40, color: '#1E3A8A' },
      { name: 'Battery Energy Storage', value: '$4.2Bn', valueBn: 4.2, share: 30, color: '#3B82F6' },
      { name: 'Grid & Substation Infrastructure', value: '$2.8Bn', valueBn: 2.8, share: 20, color: '#A8CBF3' },
      { name: 'Backup Generation', value: '$1.4Bn', valueBn: 1.4, share: 10, color: '#D8D2F6' },
    ],
  },

  geography: [
    { city: 'Mumbai', level: 'High', lat: 19.08, lon: 72.88, note: 'Largest cluster, about half of national capacity', label: 'left', primary: true },
    { city: 'Chennai', level: 'High', lat: 13.08, lon: 80.27, note: 'Submarine cable landing, water stressed', label: 'right' },
    { city: 'Hyderabad', level: 'High', lat: 17.39, lon: 78.49, note: 'Fastest hyperscale growth', label: 'right' },
    { city: 'Bengaluru', level: 'Medium', lat: 12.97, lon: 77.59, note: 'Karnataka DC policy 2026–31', label: 'left' },
    { city: 'Delhi NCR', level: 'Medium', lat: 28.61, lon: 77.21, note: 'Grid constrained', label: 'right' },
    { city: 'Pune', level: 'Emerging', lat: 18.52, lon: 73.86, note: 'Mumbai overflow corridor', label: 'below' },
  ],

  insights: [
    { title: 'Power is the binding constraint', text: 'Grid connection, not capital, sets datacentre timelines in Mumbai and Delhi NCR. Captive generation is the unlock.', icon: 'trend', tint: 'green' },
    { title: 'Captive renewable is the largest segment', text: '40% of the opportunity. Hyperscalers are contracting 24×7 carbon-free power, not annual-average renewable.', icon: 'bars', tint: 'blue' },
    { title: 'Storage is the differentiator', text: 'Firming intermittent renewable for a Tier III load needs BESS at scale. Few Indian players can do both.', icon: 'leaf', tint: 'green' },
    { title: 'Tata Power holds the full stack', text: 'Generation, distribution licence, renewables and rooftop solar — an integrated position that is rare and hard to assemble.', icon: 'star', tint: 'blue' },
  ],

  opportunities: {
    rows: [
      { name: 'Captive Renewable PPA Platform', segment: 'Renewable', value: '$3.7Bn', timeline: '2026–2030', fit: 5 },
      { name: 'BESS for Datacentre Firming', segment: 'Storage', value: '$2.9Bn', timeline: '2026–2029', fit: 5 },
      { name: 'Dedicated Substation Infrastructure', segment: 'Grid', value: '$2.8Bn', timeline: '2027–2030', fit: 4 },
      { name: 'Hybrid Solar–Storage Firming', segment: 'Hybrid', value: '$3.2Bn', timeline: '2026–2029', fit: 4 },
      { name: 'Backup Power & Operator Partnerships', segment: 'Backup', value: '$1.4Bn', timeline: '2026–2028', fit: 3 },
    ],
    note: '2030 annual opportunity; rows partition the $14Bn segment total.',
  },

  roadmap: [
    { window: '0–6 months', title: 'Market Scan & Site Identification', detail: 'Map hyperscale demand against our generation footprint; name anchor operators.' },
    { window: '6–15 months', title: 'Anchor PPA & Structuring', detail: 'Sign the first 24×7 carbon-free PPA; fix storage sizing and structure.' },
    { window: '15–30 months', title: 'Build & Grid Integration', detail: 'Build captive generation and BESS; commission dedicated substations.' },
    { window: '30–48 months', title: 'Platform Scale-Up', detail: 'Replicate across clusters; assess an InvIT for capital recycling.' },
  ],
};
