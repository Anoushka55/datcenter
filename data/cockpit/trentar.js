// Trentar Investment-Readiness Cockpit — registry entry.
//
// The registry entry imports nothing from the claim spine (the Guide loads this
// registry, and should not load the ontology with it). The `research` export
// below is plain sourced data; lib/trentar/research.js turns it into claims.
import { scoreTrentar } from '../../lib/trentar/matcher.js';

export const trentar = {
  slug: 'trentar',

  client: {
    name: 'Trentar',
    legalName: 'Trentar Private Limited',
    cockpitTitle: 'Trentar Investment-Readiness Cockpit',
    subtitle: '500 MW AI-ready green hyperscale data centre campus, Maharashtra',
    persona: 'Developer',
    region: 'India',
    initial: 'T',
  },

  // Scored matcher (lib/trentar/matcher.js) rather than the term-count rule.
  trigger: {
    score: scoreTrentar,
    analysing: [
      'Client identified — Trentar Private Limited',
      'Resolving public evidence',
      'Tracing decision dependencies to FID',
      'Separating public facts from EAiQ analysis',
      'Cockpit ready',
    ],
  },
};

// ---------------------------------------------------------------------------
// The cockpit's content: everything the screen shows, curated and sourced.
// The cockpit has no runtime dependency on lib/trentar/ontology.js: the few
// things it still needs from that model (card questions, the twelve
// readiness items and their decision classes, the approval sequence, the
// cooling definitions) are copied here as plain content. lib/trentar/view.js
// mints every item into a claim, computes every derived number from the
// public figures here, and refuses anything that fails the claim validator.
// Sources resolve from lib/trentar/research-sources.js.
//
// Sources checked against the live pages on 25 Nov 2026 and refreshed to the
// latest found (market: Cushman & Wakefield H1 2026; policy: June-Oct 2026).
// ---------------------------------------------------------------------------
export const research = {
  // Public figures. Each is a PUBLIC_FACT with its source. Refreshed 25 Nov
  // 2026 against the latest sources found and read: Cushman & Wakefield H1
  // 2026 (Sep 2026) replaces the H1 2025 market figures.
  facts: {
    // Announced figures and statements (the Trentar release and the W.Media report).
    itCapacity: { label: "Announced capacity", value: 500, unit: "MW", evidence: ["src.prn", "src.wmedia"] },
    investment: { label: "Announced investment: INR 30,000 crore (US$3.3 billion)", value: 30000, unit: "INR crore", evidence: ["src.prn", "src.wmedia"] },
    renewable: { label: "Renewable energy target: at least 51 per cent", value: 51, unit: "% (floor)", evidence: ["src.prn", "src.wmedia"] },
    mou: { label: "MoU with the Government of Maharashtra, Invest Maharashtra", value: null, unit: null, evidence: ["src.prn", "src.wmedia"] },
    loi: { label: "Letter of Intent received from the Government of Maharashtra", value: null, unit: null, evidence: ["src.prn"] },
    recycledWater: { label: "Treated-water reuse and water-efficient cooling under evaluation", value: null, unit: null, evidence: ["src.wmedia"] },
    announcedUsd: { label: 'Announced investment in US dollars', value: 3.3, unit: 'USD bn', evidence: ['src.prn', 'src.wmedia'] },
    // India data centre market, H1 2026 (Cushman & Wakefield, 23 Sep 2026).
    mumbaiOperational: { label: 'Mumbai data centre capacity, operational (Cushman & Wakefield H1 2026)', value: 890, unit: 'MW', evidence: ['src.cw2026'] },
    mumbaiPipeline: { label: 'Mumbai upcoming data centre supply pipeline (Cushman & Wakefield H1 2026)', value: 1726, unit: 'MW', evidence: ['src.cw2026'] },
    indiaOperational: { label: 'India data centre capacity, operational (Cushman & Wakefield H1 2026)', value: 1789, unit: 'MW', evidence: ['src.cw2026'] },
    indiaPipeline: { label: 'India data centre pipeline to 2030: 509 MW under construction and 3,351 MW planned (Cushman & Wakefield H1 2026)', value: 3860, unit: 'MW', evidence: ['src.cw2026'] },
    // Construction cost (Turner & Townsend Data Centre Construction Cost Index 2025).
    mumbaiCost: { label: 'Mumbai data centre construction cost, excluding land and IT equipment (Turner & Townsend 2025)', value: 6.64, unit: 'USD/W', evidence: ['src.tnt'] },
    // Maharashtra policy, 2026.
    greenPark: { label: 'Green-park subsidy: ₹1/unit for 10 years at ₹30,000 crore (GR 9 Jun 2026)', value: null, unit: null, evidence: ['src.iba', 'src.ppd'] },
    elecDuty: { label: '20-year electricity duty exemption for data centres (22 Jun 2026)', value: null, unit: null, evidence: ['src.duty'] },
    costPerWatt: [
      { key: 'china', label: 'China', value: 6 },
      { key: 'india', label: 'India', value: 7 },
      { key: 'usa', label: 'USA, South Korea, Australia', value: 10 },
      { key: 'uk', label: 'UK', value: 11 },
      { key: 'japan', label: 'Japan', value: 14 },
    ].map((c) => ({ ...c, label: `Data centre development cost, ${c.label} (Kotak Mutual Fund)`, short: c.label, unit: 'USD/W', evidence: ['src.kotak'] })),
  },

  assumptions: {
    // Midpoint of the illustrative 1.3 to 1.4 design PUE offered in the EAiQ
    // Guide requirement. Never a Trentar figure: achievable PUE is bounded by
    // site design wet-bulb and the cooling technology, neither of which is fixed.
    designPue: 1.35,
  },

  // The twelve readiness items and their decision classes (curated from the
  // Trentar FID Decision Ontology; proposed owners are functions, to be
  // confirmed by Trentar).
  readiness: [
    {
      "id": "site_confirmation",
      "label": "Site confirmation",
      "decisionClass": "FID_GATE",
      "domain": "SITE",
      "owner": "Trentar development and real estate",
      "why": "Without a confirmed parcel, land cost, hazard profile, connection cost and consent programme are all assumptions."
    },
    {
      "id": "firm_grid",
      "label": "Firm grid capacity",
      "decisionClass": "FID_GATE",
      "domain": "POWER",
      "owner": "Trentar projects with the DISCOM and transmission licensee",
      "why": "At AI scale this determines whether the project exists at the stated capacity."
    },
    {
      "id": "water_source",
      "label": "Water source",
      "decisionClass": "FID_GATE",
      "domain": "SITE",
      "owner": "Trentar development with the state nodal agency",
      "why": "Gates the cooling decision and carries the highest community and consent sensitivity."
    },
    {
      "id": "cooling_architecture",
      "label": "AI cooling architecture",
      "decisionClass": "FID_GATE",
      "domain": "DESIGN",
      "owner": "Trentar engineering with the design partner",
      "why": "Cannot be deferred past FID: it fixes capital, water, PUE and the structural design."
    },
    {
      "id": "social_licence",
      "label": "Community and social licence",
      "decisionClass": "FID_GATE",
      "domain": "SITE",
      "owner": "Trentar corporate affairs with the state liaison",
      "why": "A water and power intensive campus can be formally permissible and still not deliverable."
    },
    {
      "id": "regulatory_pathway",
      "label": "Regulatory pathway",
      "decisionClass": "FID_GATE",
      "domain": "REGULATION",
      "owner": "Trentar regulatory with the state nodal agency",
      "why": "The consent sequence is the second critical path after grid."
    },
    {
      "id": "business_case",
      "label": "Business case",
      "decisionClass": "FID_GATE",
      "domain": "FINANCE",
      "owner": "Trentar finance with the commercial advisor",
      "why": "Currently not computable: capital, revenue, tariff and schedule are all open."
    },
    {
      "id": "funding",
      "label": "Funding",
      "decisionClass": "FID_GATE",
      "domain": "FINANCE",
      "owner": "Trentar finance with Dorf Ketal Group",
      "why": "Structure and availability of equity and debt, including any ESG conditions imported with them."
    },
    {
      "id": "renewable_strategy",
      "label": "Renewable energy strategy",
      "decisionClass": "FID_CONDITION",
      "domain": "ESG",
      "owner": "Trentar energy and procurement",
      "why": "Sets energy cost, the ESG position and tenant acceptability simultaneously. Classified as a condition rather than a gate on the judgement that sanction can proceed once the sourcing route is identified and the cost envelope bounded, with contracting carried as a dated condition. If an anchor tenant imposes hourly matching as a precondition, this becomes a gate."
    },
    {
      "id": "climate_resilience",
      "label": "Physical climate resilience",
      "decisionClass": "FID_CONDITION",
      "domain": "SITE",
      "owner": "Technical advisor, reviewed by the insurer",
      "why": "Lenders and insurers both price this; it can be carried as a condition with a defined study."
    },
    {
      "id": "governance",
      "label": "Governance",
      "decisionClass": "FID_CONDITION",
      "domain": "PROJECT",
      "owner": "Trentar board and company secretary",
      "why": "Decision rights, committee sequence and delegation for a commitment of this size."
    },
    {
      "id": "delivery_ecosystem",
      "label": "Delivery ecosystem",
      "decisionClass": "FID_CONDITION",
      "domain": "PARTY",
      "owner": "Trentar projects and procurement",
      "why": "Capacity of EPC, MEP and specialist cooling supply in the window required."
    }
  ],

  // Consenting sequence: each step after its prerequisites (stage 0 first).
  approvals: [{"label": "Land and title clearance", "stage": 0}, {"label": "Land use and zoning", "stage": 1}, {"label": "Environmental and pollution consent", "stage": 2}, {"label": "Grid and HT approval", "stage": 2}, {"label": "Building permission", "stage": 2}, {"label": "Fibre and telecom right of way", "stage": 2}, {"label": "Electrical inspectorate approval", "stage": 3}, {"label": "Fire approval", "stage": 3}, {"label": "Commissioning and RFS clearance", "stage": 4}],

  // Cooling options placed only where their definitions state both a water
  // and a power position: plus favourable, watch conditional, minus unfavourable.
  cooling: [
    {
      "label": "Evaporative cooling",
      "definition": "Water-based heat rejection. Efficient on power, heavy on water.",
      "water": "minus",
      "power": "plus"
    },
    {
      "label": "Adiabatic cooling",
      "definition": "Hybrid approach using evaporation only at high ambient, trading water against power seasonally.",
      "water": "watch",
      "power": "watch"
    },
    {
      "label": "Closed-loop cooling",
      "definition": "Sealed circuit with minimal make-up water, higher power draw.",
      "water": "plus",
      "power": "minus"
    }
  ],

  // Per card: card meta, the headline, the chart, the insight (action title),
  // the drill-down answer, at most four one-line findings (brief), at most
  // three open questions, and the longer findings for Evidence (findings).
  // {placeholders} are filled by view.js from computed claims.
  cards: {
    fid: {
      ordinal: '01',
      title: "FID Readiness",
      question: "Can Trentar responsibly proceed to FID?",
      headline: { count: 'gates', caption: 'Gates open' },
      chart: 'readinessByDomain',
      insight: { provenance: 'EAIQ_ANALYSIS', text: 'Three gates carry the risk: firm grid capacity, site and water.', emphasis: 'firm grid capacity, site and water',
        basis: 'Firm capacity is the single most consequential unknown on an AI campus; without a site, land, hazard, connection and consent are assumptions; water gates the cooling decision.' },
      answer: { provenance: 'EAIQ_ANALYSIS', text: 'Not yet: {gates} gates are open, and three of them (firm grid capacity, site and water) decide whether the rest can be assessed.', emphasis: 'Not yet',
        basis: 'Counts of readiness items by decision class, with the three gates named for the reasons in the card insight.' },
      openQuestions: [
        { id: 'fid.q.grid', provenance: 'EAIQ_ANALYSIS', text: 'No firm grid capacity is committed; until it is, the announced capacity is not deliverable as stated.', emphasis: 'No firm grid capacity is committed', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'fid.q.site', provenance: 'EAIQ_ANALYSIS', text: 'No parcel is named, so land cost, hazard, connection cost and consents remain assumptions.', emphasis: 'No parcel is named', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'fid.q.cod', provenance: 'EAIQ_ANALYSIS', text: 'No phasing or commercial operation date is stated, so the cost of delay cannot be quantified.', emphasis: 'No phasing or commercial operation date', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
      ],
      brief: [
        { id: 'fid.b.support', provenance: 'PUBLIC_FACT', text: 'State support is evidenced by an MoU and a Letter of Intent.', emphasis: 'State support is evidenced', evidence: ['src.prn'] },
        { id: 'fid.b.policy', provenance: 'EAIQ_ANALYSIS', text: 'The announced ₹30,000 crore and ≥51% renewable match the state green-park policy thresholds.', emphasis: 'match the state green-park policy thresholds', evidence: ['src.prn', 'src.iba'],
          basis: 'The June 2026 amendment to the Integrated Green Data Centre Parks policy sets a 51% green-power minimum and a ₹1/unit subsidy for parks investing ₹30,000 crore.' },
        { id: 'fid.b.no_score', provenance: 'EAIQ_ANALYSIS', text: 'No composite score is shown; counts by decision class replace it.', emphasis: 'No composite score is shown',
          basis: 'Decision rule: no readiness percentage without a visible scoring model.' },
        { id: 'fid.b.conditions', provenance: 'EAIQ_ANALYSIS', text: '{conditions} conditions can be carried into FID with an owner and a date; gates cannot.', emphasis: 'gates cannot',
          basis: 'A condition travels with sanction if named, owned and dated; a gate must close before capital is sanctioned.' },
      ],
      findings: [
        { id: 'fid.three_gates', provenance: 'EAIQ_ANALYSIS', text: 'Three gates carry most of the risk: firm grid capacity, site confirmation and water source.', emphasis: 'firm grid capacity, site confirmation and water source',
          basis: 'Firm grid capacity is the single most consequential unknown; without a confirmed site, land cost, hazard, connection cost and consents are assumptions; the water source gates the cooling decision.' },
        { id: 'fid.positives', provenance: 'EAIQ_ANALYSIS', text: 'Three things can be said positively today: state support is evidenced by an MoU and a Letter of Intent, the announced figures match the state green-park thresholds, and the water-reuse direction matches where regulation is heading.', emphasis: 'Three things can be said positively today',
          evidence: ['src.prn', 'src.wmedia', 'src.iba', 'src.fpj'],
          basis: 'MoU and LoI in the Trentar release; green-park thresholds from the June 2026 amendment (IBA); treated-water reuse in W.Media; the expected recycled-water rule in the Free Press Journal.' },
        { id: 'fid.no_score', provenance: 'EAIQ_ANALYSIS', text: 'No composite readiness score is shown, because there is no transparent scoring model behind one; counts by decision class are reported instead.', emphasis: 'No composite readiness score is shown',
          basis: 'A readiness percentage may only be shown with its scoring model, inputs and weights displayed.' },
      ],
    },

    site: {
      ordinal: '02',
      title: "Site & Infrastructure",
      question: "Where can the announced capacity actually be delivered?",
      headline: { fact: 'itCapacity', caption: 'Announced capacity' },
      chart: 'mumbaiPipeline',
      insight: { provenance: 'EAIQ_ANALYSIS', text: 'At 500 MW the campus equals {shareOperational} of Mumbai’s operating data centre capacity.', emphasis: '{shareOperational} of Mumbai’s operating data centre capacity', evidence: ['src.cw2026', 'src.prn'],
        basis: '500 MW announced ÷ 890 MW operational in Mumbai (Cushman & Wakefield H1 2026).' },
      answer: { provenance: 'EAIQ_ANALYSIS', text: 'Somewhere in Maharashtra: no site is named, and at 500 MW the campus would equal {shareOperational} of Mumbai’s operating capacity.', emphasis: 'no site is named', evidence: ['src.prn', 'src.cw2026'],
        basis: 'The release names the state only; scale comparison from Cushman & Wakefield H1 2026.' },
      openQuestions: [
        { id: 'site.q.parcel', provenance: 'EAIQ_ANALYSIS', text: 'No parcel is named; confirming one turns land cost, hazard, connection cost and consents into fact.', emphasis: 'No parcel is named', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'site.q.headroom', provenance: 'EAIQ_ANALYSIS', text: 'Whether any single candidate micro-market can carry the full 500 MW is not yet known.', emphasis: 'carry the full 500 MW', evidence: ['src.cw2026'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'site.q.water', provenance: 'EAIQ_ANALYSIS', text: 'The water source and its permissible volume are not stated, and they decide the cooling design.', emphasis: 'water source and its permissible volume', evidence: ['src.wmedia'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
      ],
      brief: [
        { id: 'site.b.scale', provenance: 'EAIQ_ANALYSIS', text: 'The campus would equal {shareOperational} of Mumbai’s operating capacity and {sharePipeline} of its pipeline.', emphasis: '{shareOperational} of Mumbai’s operating capacity', evidence: ['src.cw2026', 'src.prn'],
          basis: '500 ÷ 890 MW operational; 500 ÷ 1,726 MW upcoming pipeline (Cushman & Wakefield H1 2026).' },
        { id: 'site.b.mumbai', provenance: 'EAIQ_ANALYSIS', text: 'Mumbai holds {mumbaiShareIndia} of India’s operating capacity and {mumbaiPipelineShare} of its pipeline.', emphasis: '{mumbaiShareIndia} of India’s operating capacity', evidence: ['src.cw2026'],
          basis: '890 ÷ 1,789 MW operational; 1,726 ÷ 3,860 MW pipeline to 2030 (Cushman & Wakefield H1 2026).' },
        { id: 'site.b.corridor', provenance: 'PUBLIC_FACT', text: 'The Thane–Belapur corridor holds 72% of Mumbai’s operating capacity and 76% of its pipeline.', emphasis: '72% of Mumbai’s operating capacity', evidence: ['src.cwapac'] },
        { id: 'site.b.buffer', provenance: 'EAIQ_ANALYSIS', text: 'Expected residential buffer zones would favour less built-up Panvel over the dense Thane–Belapur corridor.', emphasis: 'residential buffer zones', evidence: ['src.fpj', 'src.cwapac'],
          basis: 'Expected buffer-zone requirement (Free Press Journal, draft) against the corridor’s concentration (Cushman & Wakefield via W.Media).' },
      ],
      findings: [
        { id: 'site.scale', provenance: 'EAIQ_ANALYSIS', text: 'At 500 MW the campus would equal {shareOperational} of all data centre capacity operating in Mumbai today, and {sharePipeline} of everything in its upcoming pipeline.', emphasis: '{shareOperational} of all data centre capacity operating in Mumbai today',
          evidence: ['src.cw2026', 'src.prn'],
          basis: '500 MW ÷ 890 MW operational; 500 MW ÷ 1,726 MW pipeline (Cushman & Wakefield H1 2026, 23 Sep 2026). Whether the 500 MW is IT load or grid intake is not stated.' },
        { id: 'site.mumbai_share', provenance: 'EAIQ_ANALYSIS', text: 'Mumbai remains India’s anchor market: {mumbaiShareIndia} of operating capacity and {mumbaiPipelineShare} of the national pipeline to 2030.', emphasis: 'India’s anchor market',
          evidence: ['src.cw2026'], basis: '890 ÷ 1,789 MW and 1,726 ÷ 3,860 MW (Cushman & Wakefield H1 2026).' },
        { id: 'site.corridor', provenance: 'PUBLIC_FACT', text: 'The Thane–Belapur Road corridor accounts for 72% of Mumbai’s operational capacity and 76% of its development pipeline.', emphasis: '72% of Mumbai’s operational capacity', evidence: ['src.cwapac'] },
        { id: 'site.subsea', provenance: 'PUBLIC_FACT', text: 'The Mumbai coastline is the gateway for about 95% of India’s international bandwidth, across 18 international subsea cables nationally.', emphasis: 'about 95% of India’s international bandwidth', evidence: ['src.carnegie'] },
        { id: 'site.buffer_view', view: true, provenance: 'EAIQ_ANALYSIS', text: 'EAiQ view: buffer zones from residential areas in the expected state rules would make dense existing development a siting risk, which favours a less built-up micro-market such as Panvel.', emphasis: 'dense existing development a siting risk',
          evidence: ['src.fpj', 'src.cwapac'], basis: 'Expected buffer-zone requirement (draft) against the corridor’s concentration.' },
      ],
    },

    power: {
      ordinal: '03',
      title: "Power & AI Design",
      question: "Can AI-scale loads be supported reliably and economically?",
      headline: { fact: 'renewable', caption: 'Renewable target' },
      chart: 'intakeVsLoad',
      insight: { provenance: 'EAIQ_ANALYSIS', text: 'The ≥51% target is exactly the state green-park policy’s minimum, not a stretch goal.', emphasis: 'exactly the state green-park policy’s minimum', evidence: ['src.prn', 'src.iba'],
        basis: 'The June 2026 amendment to Maharashtra’s Integrated Green Data Centre Parks policy cut the green-power requirement for core operations from 100% to 51% (IBA, 12 Aug 2026).' },
      answer: { provenance: 'ILLUSTRATIVE_SCENARIO', text: 'Not yet shown: no firm grid capacity is committed, and an illustrative {intake} intake is what the grid must supply.', emphasis: 'no firm grid capacity is committed', evidence: ['src.prn'],
        basis: 'Firm capacity: not committed in the public record. Intake = 500 MW × illustrative PUE {pue}.' },
      openQuestions: [
        { id: 'power.q.firm', provenance: 'EAIQ_ANALYSIS', text: 'No firm capacity or energisation date exists; the MoU coordinates approvals but does not supply power.', emphasis: 'No firm capacity or energisation date exists', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'power.q.density', provenance: 'EAIQ_ANALYSIS', text: 'Rack density and workload mix are not stated, and together they set cooling, PUE and grid intake.', emphasis: 'Rack density and workload mix are not stated', evidence: ['src.prn', 'src.wmedia'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'power.q.matching', provenance: 'EAIQ_ANALYSIS', text: 'The renewable matching basis (annual, monthly or hourly) is not stated, and tenants will ask.', emphasis: 'renewable matching basis', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
      ],
      brief: [
        { id: 'power.b.intake', provenance: 'ILLUSTRATIVE_SCENARIO', text: 'At an illustrative PUE of {pue}, 500 MW of IT load draws about {intake} from the grid.', emphasis: 'about {intake} from the grid',
          basis: 'Grid intake = IT load × design PUE; {pue} is the midpoint of the illustrative 1.3 to 1.4 target.' },
        { id: 'power.b.overhead', provenance: 'ILLUSTRATIVE_SCENARIO', text: 'That illustrative intake carries about {overhead} of cooling and distribution overhead above the IT load.', emphasis: 'about {overhead} of cooling and distribution overhead',
          basis: 'Illustrative intake minus the announced 500 MW.' },
        { id: 'power.b.basis', provenance: 'EAIQ_ANALYSIS', text: 'The announcement does not say whether 500 MW is IT load or grid intake.', emphasis: 'does not say whether 500 MW is IT load or grid intake', evidence: ['src.prn', 'src.wmedia'],
          basis: 'Both sources state 500 MW without qualification.' },
        { id: 'power.b.policy', provenance: 'PUBLIC_FACT', text: 'Maharashtra’s June 2026 green-park amendment cut the green-power requirement from 100% to 51%.', emphasis: 'from 100% to 51%', evidence: ['src.iba', 'src.ppd'] },
      ],
      findings: [
        { id: 'power.intake', provenance: 'ILLUSTRATIVE_SCENARIO', text: 'At an illustrative design PUE of {pue}, a 500 MW IT load would draw about {intake} from the grid, about {overhead} of it cooling and distribution overhead.', emphasis: 'about {intake} from the grid',
          basis: 'Grid intake = IT load × design PUE. {pue} is the midpoint of the illustrative 1.3 to 1.4 target; PUE is not fixed. Assumes the announced 500 MW is IT load, which is not stated.' },
        { id: 'power.policy', provenance: 'EAIQ_ANALYSIS', text: 'The ≥51% renewable target matches the minimum green-power share for core operations under the amended green-park policy, so it reads as compliance rather than ambition.', emphasis: 'compliance rather than ambition',
          evidence: ['src.prn', 'src.iba', 'src.ppd'], basis: 'Policy minimum of 51% from the GR of 9 Jun 2026 (IBA; Power Peak Digest), against the Trentar release.' },
        { id: 'power.basis', provenance: 'EAIQ_ANALYSIS', text: 'The announcement does not say whether 500 MW is IT load or grid intake, so every derived figure inherits the ambiguity.', emphasis: 'does not say whether 500 MW is IT load or grid intake',
          evidence: ['src.prn', 'src.wmedia'], basis: 'Both sources state 500 MW without qualification; the two readings differ by the cooling overhead.' },
      ],
    },

    regulatory: {
      ordinal: '04',
      title: "Regulatory & Incentives",
      question: "What affects FID, COD and economic value?",
      headline: { fact: 'mou', caption: 'State support' },
      chart: 'approvalPath',
      insight: { provenance: 'EAIQ_ANALYSIS', text: 'At ₹30,000 crore the project matches the green-park threshold for a ten-year ₹1/unit subsidy.', emphasis: 'matches the green-park threshold', evidence: ['src.prn', 'src.iba'],
        basis: 'The June 2026 amendment offers parks investing ₹30,000 crore a ₹1/unit tariff subsidy for 10 years (20 years at ₹60,000 crore). Trentar announced ₹30,000 crore for a green integrated data centre park. Eligibility is not verified.' },
      answer: { provenance: 'EAIQ_ANALYSIS', text: 'Supportive: state support is public and the project matches the green-park policy thresholds, but eligibility is unverified and stricter rules are coming.', emphasis: 'eligibility is unverified', evidence: ['src.prn', 'src.iba', 'src.fpj'],
        basis: 'MoU and LoI in the release; thresholds from the June 2026 amendment; expected state data centre rules from the Free Press Journal.' },
      openQuestions: [
        { id: 'reg.q.eligibility', provenance: 'EAIQ_ANALYSIS', text: 'Project-specific eligibility for the green-park incentives is unverified; none carries modelled value until confirmed in writing.', emphasis: 'eligibility for the green-park incentives is unverified', evidence: ['src.iba'],
          basis: 'The LoI is reported to outline applicable support; its terms are not public.' },
        { id: 'reg.q.mou', provenance: 'EAIQ_ANALYSIS', text: 'What the MoU commits the state to is not public beyond coordinating approvals and incentives.', emphasis: 'What the MoU commits the state to', evidence: ['src.prn', 'src.wmedia'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'reg.q.dates', provenance: 'EAIQ_ANALYSIS', text: 'Approval dates cannot be set until a parcel is confirmed.', emphasis: 'cannot be set until a parcel is confirmed', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
      ],
      brief: [
        { id: 'reg.b.park', provenance: 'PUBLIC_FACT', text: 'The June 2026 green-park amendment: 20 parks statewide, 51% green power, ₹1/unit for ten years.', emphasis: '₹1/unit for ten years', evidence: ['src.iba', 'src.ppd'] },
        { id: 'reg.b.duty', provenance: 'PUBLIC_FACT', text: 'Data centre units get a 20-year electricity duty exemption under a June 2026 notification.', emphasis: '20-year electricity duty exemption', evidence: ['src.duty'] },
        { id: 'reg.b.new', provenance: 'PUBLIC_FACT', text: 'Stricter state data centre rules are expected: buffer zones, recycled water, noise and heat.', emphasis: 'Stricter state data centre rules are expected', evidence: ['src.fpj'] },
        { id: 'reg.b.committee', provenance: 'PUBLIC_FACT', text: 'A state committee led by Anil Kakodkar is studying data centres’ water, energy and noise impact.', emphasis: 'A state committee led by Anil Kakodkar', evidence: ['src.kakodkar'] },
      ],
      findings: [
        { id: 'reg.park', provenance: 'PUBLIC_FACT', text: 'A GR of 9 June 2026 amended the Integrated Green Data Centre Parks policy: up to 20 parks statewide, a 51% green-power minimum, and a ₹1/unit tariff subsidy for ten years for parks investing ₹30,000 crore.', emphasis: 'a ₹1/unit tariff subsidy for ten years', evidence: ['src.iba', 'src.ppd'] },
        { id: 'reg.park_view', view: true, provenance: 'EAIQ_ANALYSIS', text: 'EAiQ view: Trentar’s ₹30,000 crore and ≥51% renewable sit exactly on those thresholds, which suggests the announcement was sized to the policy. The earlier Zone-I limit on the IT-ITeS subsidy is not the operative test for a green park.', emphasis: 'sized to the policy',
          evidence: ['src.prn', 'src.iba'], basis: 'Announced figures against the amended policy thresholds; the amendment applies statewide and retrospectively to approved parks. Eligibility not verified.' },
        { id: 'reg.duty', provenance: 'PUBLIC_FACT', text: 'A notification of 22 June 2026 under the IT-ITeS Policy 2023 gives new and existing data centre units a 20-year electricity duty exemption.', emphasis: '20-year electricity duty exemption', evidence: ['src.duty'] },
        { id: 'reg.new_policy', provenance: 'PUBLIC_FACT', text: 'Stricter rules are being prepared by the Maharashtra Pollution Control Board with IIT Bombay, expected within months: residential buffer zones, recycled water for cooling, acoustic barriers and heat controls.', emphasis: 'Stricter rules are being prepared', evidence: ['src.fpj'] },
        { id: 'reg.committee', provenance: 'PUBLIC_FACT', text: 'A state committee led by Dr Anil Kakodkar is studying data centres’ impact on water, energy, air, noise and local ecosystems, reporting within three months.', emphasis: 'led by Dr Anil Kakodkar', evidence: ['src.kakodkar'] },
        { id: 'reg.new_policy_view', view: true, provenance: 'EAIQ_ANALYSIS', text: 'EAiQ view: both will likely land between this assessment and FID, which makes regulatory change a live pre-FID risk.', emphasis: 'a live pre-FID risk',
          evidence: ['src.fpj', 'src.kakodkar'], basis: 'Rules expected within months; committee reporting within three months; no FID date exists.' },
      ],
    },

    esg: {
      ordinal: '05',
      title: "ESG & Resources",
      question: "Is the campus sustainable, tenant-ready and financeable?",
      headline: { fact: 'recycledWater', caption: 'Water reuse' },
      chart: 'coolingTradeoff',
      insight: { provenance: 'EAIQ_ANALYSIS', text: 'Draft state policy would mandate recycled water; Trentar already aligns.', emphasis: 'Trentar already aligns', evidence: ['src.fpj', 'src.wmedia'],
        basis: 'Expected recycled-water rule (Free Press Journal) against Trentar’s evaluation of treated-water reuse (W.Media).' },
      answer: { provenance: 'EAIQ_ANALYSIS', text: 'Partly: Trentar’s water-reuse direction matches where state policy is heading, but the renewable matching basis and water source are unknown.', emphasis: 'Partly', evidence: ['src.wmedia', 'src.fpj'],
        basis: 'Water direction as in the card insight; matching basis and water source are not stated.' },
      openQuestions: [
        { id: 'esg.q.matching', provenance: 'EAIQ_ANALYSIS', text: 'The renewable matching basis is not stated, so the same floor means different things to tenants.', emphasis: 'renewable matching basis is not stated', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'esg.q.water', provenance: 'EAIQ_ANALYSIS', text: 'The water source and treated-water volume are not stated, and they decide whether evaporative cooling is open.', emphasis: 'water source and treated-water volume', evidence: ['src.wmedia'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'esg.q.tenant', provenance: 'EAIQ_ANALYSIS', text: 'No anchor tenant or lender ESG requirement is known, and either can reach back into the design.', emphasis: 'No anchor tenant or lender ESG requirement', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
      ],
      brief: [
        { id: 'esg.b.reuse', provenance: 'PUBLIC_FACT', text: 'Trentar is evaluating treated-water reuse and water-efficient cooling.', emphasis: 'evaluating treated-water reuse', evidence: ['src.wmedia'] },
        { id: 'esg.b.mandate', provenance: 'PUBLIC_FACT', text: 'Draft state rules would mandate recycled and treated wastewater for cooling.', emphasis: 'mandate recycled and treated wastewater', evidence: ['src.fpj'] },
        { id: 'esg.b.committee', provenance: 'PUBLIC_FACT', text: 'A state expert committee is now studying data centres’ water, energy and noise impact.', emphasis: 'studying data centres’ water, energy and noise impact', evidence: ['src.kakodkar'] },
        { id: 'esg.b.social', provenance: 'EAIQ_ANALYSIS', text: 'Balkum residents opposed a planned AWS facility: social licence is an evidenced risk here.', emphasis: 'social licence is an evidenced risk', evidence: ['src.fpj'],
          basis: 'The Balkum opposition is in Thane and helped prompt the state rules.' },
      ],
      findings: [
        { id: 'esg.reuse', provenance: 'PUBLIC_FACT', text: 'Trentar is evaluating treated-water reuse and water-efficient cooling.', emphasis: 'treated-water reuse', evidence: ['src.wmedia'] },
        { id: 'esg.mandate', provenance: 'PUBLIC_FACT', text: 'The expected state rules would mandate recycled and treated wastewater for cooling in place of fresh municipal supply.', emphasis: 'mandate recycled and treated wastewater for cooling', evidence: ['src.fpj'] },
        { id: 'esg.aligned', view: true, provenance: 'EAIQ_ANALYSIS', text: 'EAiQ view: Trentar’s stated direction on water matches where regulation is heading, a genuine strength of the proposal.', emphasis: 'matches where regulation is heading',
          evidence: ['src.wmedia', 'src.fpj'], basis: 'Treated-water reuse under evaluation (W.Media) against the expected recycled-water rule (Free Press Journal).' },
        { id: 'esg.committee', provenance: 'PUBLIC_FACT', text: 'A state committee led by Dr Anil Kakodkar is studying data centres’ impact on water, energy, air, noise and local ecosystems, with recommendations on water recycling and alternative cooling.', emphasis: 'recommendations on water recycling and alternative cooling', evidence: ['src.kakodkar'] },
        { id: 'esg.protest', provenance: 'PUBLIC_FACT', text: 'Residents in Thane’s Balkum area have opposed a planned AWS data centre over noise, heat and resource diversion.', emphasis: 'opposed a planned AWS data centre', evidence: ['src.fpj'] },
        { id: 'esg.tradeoff', provenance: 'EAIQ_ANALYSIS', text: 'Cooling trades water against power: evaporative designs are efficient on power and heavy on water, closed-loop designs the reverse. A stressed basin and a recycled-water rule narrow the choice before density is fixed.', emphasis: 'narrow the choice before density is fixed',
          evidence: ['src.fpj'], basis: 'Cooling definitions (evaporative heavy on water; closed-loop higher power draw) and the expected rule.' },
      ],
    },

    commercial: {
      ordinal: '06',
      title: "Commercial & Ecosystem",
      question: "Are economics and ecosystem strong enough to execute?",
      headline: { fact: 'investment', caption: 'Announced investment' },
      chart: 'costPerWatt',
      insight: { provenance: 'EAIQ_ANALYSIS', text: 'At {perWattUnit} the figure matches Mumbai’s construction-only cost, before land and IT.', emphasis: 'matches Mumbai’s construction-only cost', evidence: ['src.prn', 'src.tnt'],
        basis: 'US$3.3 bn ÷ 500 MW against Turner & Townsend’s Mumbai construction cost of US$6.64/W (2025 index), which excludes land, utility works and active IT equipment.' },
      answer: { provenance: 'EAIQ_ANALYSIS', text: 'Unproven: {perWattUnit} covers only Mumbai’s construction cost, leaving land and IT equipment, and no anchor tenant is named.', emphasis: 'Unproven', evidence: ['src.prn', 'src.tnt'],
        basis: 'Implied cost per watt against the Mumbai construction benchmark; tenant and contracted revenue are not public.' },
      openQuestions: [
        { id: 'com.q.tenant', provenance: 'EAIQ_ANALYSIS', text: 'No anchor tenant is named, and the contracted share of revenue is the first credit-committee question.', emphasis: 'No anchor tenant is named', evidence: ['src.prn', 'src.wmedia'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'com.q.scope', provenance: 'EAIQ_ANALYSIS', text: 'The announced figure’s scope is not stated: phase, IT equipment and land would all change it.', emphasis: 'scope is not stated', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
        { id: 'com.q.funding', provenance: 'EAIQ_ANALYSIS', text: 'Funding structure and hurdle rate are not public, so no return can be assessed.', emphasis: 'Funding structure and hurdle rate are not public', evidence: ['src.prn'],
          basis: 'Not stated in the public record cited; an EAiQ reading of what the absence means for the decision.' },
      ],
      brief: [
        { id: 'com.b.per_watt', provenance: 'EAIQ_ANALYSIS', text: 'US$3.3 billion across 500 MW implies about {perWatt} per watt.', emphasis: 'about {perWatt} per watt', evidence: ['src.prn', 'src.wmedia'],
          basis: 'US$3.3 bn ÷ 500 MW, per announced megawatt.' },
        { id: 'com.b.mumbai', provenance: 'PUBLIC_FACT', text: 'Turner & Townsend puts Mumbai construction at US$6.64 per watt, excluding land and IT equipment.', emphasis: 'US$6.64 per watt', evidence: ['src.tnt'] },
        { id: 'com.b.benchmark', provenance: 'EAIQ_ANALYSIS', text: 'That is {benchmarkShare} of Kotak’s US$7/W India benchmark, low for a liquid-cooled AI campus.', emphasis: 'low for a liquid-cooled AI campus', evidence: ['src.kotak'],
          basis: 'Implied cost per watt ÷ US$7; AI-ready liquid-cooled builds cost more per watt than conventional ones.' },
        { id: 'com.b.hyperscale', provenance: 'PUBLIC_FACT', text: 'Hyperscalers took over 80% of India’s data centre absorption in H1 2026.', emphasis: 'over 80% of India’s data centre absorption', evidence: ['src.savills'] },
      ],
      findings: [
        { id: 'com.per_watt', provenance: 'EAIQ_ANALYSIS', text: 'The announced US$3.3 billion across 500 MW implies about {perWatt} per watt.', emphasis: 'about {perWatt} per watt',
          evidence: ['src.prn', 'src.wmedia'], basis: 'US$3.3 bn ÷ 500 MW. If the 500 MW is grid intake rather than IT load, the cost per IT watt is higher.' },
        { id: 'com.mumbai', provenance: 'PUBLIC_FACT', text: 'Turner & Townsend’s 2025 index puts Mumbai at US$6.64 per watt, 51st of 52 markets, excluding land, utility works and IT equipment.', emphasis: 'US$6.64 per watt, 51st of 52 markets', evidence: ['src.tnt'] },
        { id: 'com.benchmark_view', view: true, provenance: 'EAIQ_ANALYSIS', text: 'EAiQ view: at {perWattVsMumbai} of Mumbai’s construction-only cost, the announced figure leaves little for land, IT equipment or the premium an AI-ready, liquid-cooled design carries, which suggests it covers a phase or a lighter specification.', emphasis: 'leaves little for land, IT equipment',
          evidence: ['src.tnt', 'src.prn'], basis: 'Implied US$/W ÷ US$6.64/W (construction only).' },
        { id: 'com.cheap', provenance: 'PUBLIC_FACT', text: 'India builds cheaply: about US$7 per watt against about US$10 in the USA, South Korea and Australia, US$11 in the UK and US$14 in Japan.', emphasis: 'India builds cheaply', evidence: ['src.kotak'] },
        { id: 'com.hyperscale', provenance: 'PUBLIC_FACT', text: 'Hyperscalers accounted for over 80% of India’s 278 MW IT absorption in H1 2026, with Mumbai taking 38%.', emphasis: 'over 80% of India’s 278 MW IT absorption', evidence: ['src.savills'] },
      ],
    },
  },
};
