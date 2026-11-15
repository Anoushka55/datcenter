// Datacenter Lifecycle Ontology — static knowledge graph data

export const CATEGORIES = [
  { id: 'infrastructure', label: 'Infrastructure', color: '#1e40af' },
  { id: 'power',          label: 'Power Systems',         color: '#dc2626' },
  { id: 'cooling',        label: 'Cooling & Thermal',     color: '#0ea5e9' },
  { id: 'network',        label: 'Network & Connectivity', color: '#7c3aed' },
  { id: 'operations',     label: 'Operations & DCIM',     color: '#059669' },
  { id: 'business',       label: 'Business & Commercial', color: '#d97706' },
  { id: 'compliance',     label: 'Compliance & Standards', color: '#64748b' },
  { id: 'sustainability', label: 'Sustainability & ESG',   color: '#16a34a' },
];

/** @type {import('./types').OntologyNode[]} */
export const DC_NODES = [
  // ─── CORE ───────────────────────────────────────────────────────────────
  {
    id: 'dc-core',
    label: 'Data Center',
    category: 'infrastructure',
    type: 'ontology',
    isCore: true,
    connections: 14,
    businessIntent:
      'The physical facility housing compute, storage, and networking assets. Serves as the root entity connecting every operational, commercial, and compliance domain in the lifecycle.',
    defaultGrain: 'facility_id',
    dimensions: ['Tier Classification', 'Gross Area (sqft)', 'IT Load (MW)', 'Region', 'Ownership Model'],
    componentNodes: [
      { label: 'White Space', category: 'infrastructure', relationship: 'contains' },
      { label: 'Power System', category: 'power', relationship: 'powered by' },
      { label: 'Cooling System', category: 'cooling', relationship: 'cooled by' },
      { label: 'Network Infrastructure', category: 'network', relationship: 'connected via' },
    ],
  },

  // ─── INFRASTRUCTURE ─────────────────────────────────────────────────────
  {
    id: 'white-space',
    label: 'White Space',
    category: 'infrastructure',
    type: 'ontology',
    connections: 4,
    businessIntent:
      'The leasable computer room area (CRA) where racks, cages, and suites are deployed for clients. Core revenue-generating real estate within the facility.',
    defaultGrain: 'zone_id',
    dimensions: ['Zone Type', 'Power Density (kW/rack)', 'Occupancy %', 'Client Segment'],
    componentNodes: [
      { label: 'Rack & Cabinet', category: 'infrastructure', relationship: 'filled with' },
      { label: 'Colocation Space', category: 'business', relationship: 'sold as' },
    ],
  },
  {
    id: 'server-hall',
    label: 'Server Hall',
    category: 'infrastructure',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Managed server rooms housing dedicated hardware for enterprise or hyperscaler clients. Distinct from shared colocation — higher SLA and security requirements.',
    defaultGrain: 'hall_id',
    dimensions: ['Dedicated / Shared', 'Security Zone', 'Access Tier'],
  },
  {
    id: 'rack-cabinet',
    label: 'Rack & Cabinet',
    category: 'infrastructure',
    type: 'ontology',
    connections: 5,
    businessIntent:
      'The basic unit of IT deployment. Power, cooling, and space are sold and monitored at rack level. PDU and patch panel configurations determine density limits.',
    defaultGrain: 'rack_id',
    dimensions: ['Height (U)', 'Power Draw (kW)', 'Vendor', 'Fill Level %'],
    componentNodes: [
      { label: 'PDU', category: 'power', relationship: 'fed by' },
      { label: 'DCIM Platform', category: 'operations', relationship: 'monitored by' },
    ],
  },
  {
    id: 'pdu',
    label: 'PDU',
    category: 'power',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Power Distribution Units distribute conditioned power from UPS output to individual rack equipment. Metered PDUs feed real-time consumption data to DCIM.',
    defaultGrain: 'pdu_id',
    dimensions: ['Amperage', 'Phase', 'Redundancy Level', 'Rack ID'],
  },

  // ─── POWER ──────────────────────────────────────────────────────────────
  {
    id: 'power-system',
    label: 'Power System',
    category: 'power',
    type: 'ontology',
    isCore: true,
    connections: 6,
    businessIntent:
      'The entire electrical supply chain from utility intake to IT load. Redundancy architecture (N, N+1, 2N) directly determines Uptime Tier classification and SLA commitments.',
    defaultGrain: 'facility_id',
    dimensions: ['IT Load (MW)', 'PUE', 'Redundancy (N/N+1/2N)', 'Utility Feed Count'],
    componentNodes: [
      { label: 'UPS', category: 'power', relationship: 'backed by' },
      { label: 'Diesel Generator', category: 'power', relationship: 'failover to' },
      { label: 'Electrical Infrastructure', category: 'power', relationship: 'distributed through' },
    ],
  },
  {
    id: 'ups',
    label: 'UPS',
    category: 'power',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Uninterruptible Power Supplies bridge the gap between utility failure and generator start-up. Runtime capacity and bypass configuration are critical for Tier III/IV compliance.',
    defaultGrain: 'ups_id',
    dimensions: ['Capacity (kVA)', 'Runtime (min)', 'Topology', 'Battery Chemistry'],
  },
  {
    id: 'generator',
    label: 'Diesel Generator',
    category: 'power',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Provides sustained power during extended grid outages. Fuel storage duration, transfer switch speed, and regular load testing are auditable SLA requirements.',
    defaultGrain: 'gen_id',
    dimensions: ['Capacity (MW)', 'Fuel Storage (hrs)', 'Transfer Time (sec)', 'Emission Class'],
  },
  {
    id: 'electrical-infra',
    label: 'Electrical Infrastructure',
    category: 'power',
    type: 'ontology',
    connections: 4,
    businessIntent:
      'MV/LV switchgear, transformers, busways, and distribution panels. Capital-intensive; lead times of 12–52 weeks drive project schedule risk in greenfield builds.',
    defaultGrain: 'facility_id',
    dimensions: ['Voltage Level', 'Bus Configuration', 'Switchgear Vendor', 'Lead Time (weeks)'],
  },
  {
    id: 'pue-metric',
    label: 'PUE',
    category: 'power',
    type: 'metric',
    connections: 4,
    businessIntent:
      'Power Usage Effectiveness (total facility power / IT load). Industry standard efficiency KPI. Hyperscaler tenants mandate PUE ≤ 1.3; anything above 1.5 is a competitive liability.',
    defaultGrain: 'facility_id · month',
    dimensions: ['Annualised PUE', 'Design PUE', 'Delta to Target', 'Season'],
  },

  // ─── COOLING ────────────────────────────────────────────────────────────
  {
    id: 'cooling-system',
    label: 'Cooling System',
    category: 'cooling',
    type: 'ontology',
    isCore: true,
    connections: 6,
    businessIntent:
      'Removes heat generated by IT equipment. Cooling architecture choice (air vs. liquid, direct vs. indirect) impacts PUE, capital cost, and density ceilings.',
    defaultGrain: 'facility_id',
    dimensions: ['Cooling Capacity (kW)', 'Architecture Type', 'Redundancy', 'Design Temp (°C)'],
    componentNodes: [
      { label: 'CRAC/CRAH Units', category: 'cooling', relationship: 'includes' },
      { label: 'Chilled Water System', category: 'cooling', relationship: 'uses' },
      { label: 'Hot/Cold Aisle', category: 'cooling', relationship: 'requires' },
    ],
  },
  {
    id: 'crac-crah',
    label: 'CRAC/CRAH Units',
    category: 'cooling',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Computer Room Air Conditioning/Handling units deliver conditioned airflow to the white space. Oversizing drives poor PUE; undersizing causes hotspots and downtime.',
    defaultGrain: 'unit_id',
    dimensions: ['Cooling Capacity (kW)', 'Airflow (CFM)', 'Setpoint (°C)', 'Free-Cooling Capable'],
  },
  {
    id: 'chilled-water',
    label: 'Chilled Water System',
    category: 'cooling',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Central plant generating chilled water distributed to CRAH coils and CDUs. More energy-efficient at scale vs. DX systems; enables economizer / free-cooling at low ambient temps.',
    defaultGrain: 'plant_id',
    dimensions: ['Chiller Capacity (RT)', 'Design Supply Temp (°C)', 'Economizer Mode', 'WUE'],
  },
  {
    id: 'hot-cold-aisle',
    label: 'Hot/Cold Aisle',
    category: 'cooling',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Airflow containment strategy separating cold supply from hot exhaust. Reduces mixing losses, improving cooling efficiency by 10–30% vs. open-floor layouts.',
    defaultGrain: 'zone_id',
    dimensions: ['Containment Type', 'Blanking Panel Coverage %', 'Return Air Temp (°C)'],
  },
  {
    id: 'liquid-cooling',
    label: 'Liquid Cooling',
    category: 'cooling',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Direct liquid cooling (DLC), immersion, or rear-door heat exchangers. Mandatory for AI/GPU racks exceeding 20 kW/rack. Enables PUE < 1.1 in optimised designs.',
    defaultGrain: 'rack_id',
    dimensions: ['Technology (DLC/Immersion/RDHx)', 'Rack Power (kW)', 'Coolant Type', 'Design PUE'],
  },

  // ─── NETWORK ────────────────────────────────────────────────────────────
  {
    id: 'network-infra',
    label: 'Network Infrastructure',
    category: 'network',
    type: 'ontology',
    isCore: true,
    connections: 6,
    businessIntent:
      'In-building and external connectivity fabric. Carrier-neutral status, IXP proximity, and diverse fibre entry are primary location-selection criteria for hyperscaler and enterprise clients.',
    defaultGrain: 'facility_id',
    dimensions: ['Carrier Count', 'Total Capacity (Tbps)', 'IXP Distance', 'Dark Fibre Availability'],
    componentNodes: [
      { label: 'Fiber Connectivity', category: 'network', relationship: 'runs on' },
      { label: 'Internet Exchange Point', category: 'network', relationship: 'peers at' },
      { label: 'BGP & Routing', category: 'network', relationship: 'routes via' },
    ],
  },
  {
    id: 'fiber-connectivity',
    label: 'Fiber Connectivity',
    category: 'network',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Physical fibre routes into and through the facility. Diverse entry points (minimum two physically separate conduits) prevent single-point connectivity failures.',
    defaultGrain: 'route_id',
    dimensions: ['Carriers', 'Entry Points', 'Latency (ms)', 'Wavelength Capacity'],
  },
  {
    id: 'ixp',
    label: 'Internet Exchange Point',
    category: 'network',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'On-site or nearby IXP membership reduces latency and transit costs by enabling direct peering. A key differentiator for content and cloud-edge deployments.',
    defaultGrain: 'ixp_id',
    dimensions: ['IXP Name', 'Port Speed (Gbps)', 'Connected ASNs', 'Distance (km)'],
  },
  {
    id: 'bgp-routing',
    label: 'BGP & Routing',
    category: 'network',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Border Gateway Protocol routing provides multi-homed internet access and traffic engineering. Essential for 99.999% uptime SLAs that require automatic path failover.',
    defaultGrain: 'asn',
    dimensions: ['ASN Count', 'Upstream Providers', 'Routing Policy', 'Failover Time (sec)'],
  },
  {
    id: 'bandwidth-capacity',
    label: 'Bandwidth Capacity',
    category: 'network',
    type: 'metric',
    connections: 3,
    businessIntent:
      'Committed and burstable bandwidth available to tenants. Pricing is typically 95th-percentile billing (Mbps). Capacity planning must keep utilisation below 60% to avoid congestion.',
    defaultGrain: 'port_id · month',
    dimensions: ['Committed (Mbps)', '95th Percentile (Mbps)', 'Utilisation %', 'Overage Rate'],
  },

  // ─── OPERATIONS ─────────────────────────────────────────────────────────
  {
    id: 'dcim-platform',
    label: 'DCIM Platform',
    category: 'operations',
    type: 'decision',
    isCore: true,
    connections: 7,
    businessIntent:
      'Data Center Infrastructure Management software providing real-time asset, power, and environmental monitoring. Single source of truth for capacity planning, change management, and SLA reporting.',
    defaultGrain: 'facility_id',
    dimensions: ['Asset Count', 'Power Accuracy (%)', 'Integration Count', 'Alert Response Time (min)'],
    componentNodes: [
      { label: 'Capacity Planning', category: 'operations', relationship: 'drives' },
      { label: 'Monitoring & Alerting', category: 'operations', relationship: 'integrates' },
      { label: 'Incident Management', category: 'operations', relationship: 'triggers' },
    ],
  },
  {
    id: 'capacity-planning',
    label: 'Capacity Planning',
    category: 'operations',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Forecasting available power, space, and cooling headroom against committed and pipeline demand. Mis-forecasting leads to either stranded capital or SLA breaches.',
    defaultGrain: 'facility_id · quarter',
    dimensions: ['Power Headroom (MW)', 'Space Headroom (sqft)', 'Lead Time (months)', 'Confidence %'],
  },
  {
    id: 'monitoring-alerting',
    label: 'Monitoring & Alerting',
    category: 'operations',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Continuous sensor-based monitoring of power, temperature, humidity, and physical security. Threshold alerts feed NOC and on-call rotations to maintain uptime SLAs.',
    defaultGrain: 'sensor_id · minute',
    dimensions: ['Sensor Count', 'Alert Volume/day', 'MTTR (min)', 'False Positive Rate %'],
  },
  {
    id: 'incident-management',
    label: 'Incident Management',
    category: 'operations',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Structured process for detecting, classifying, escalating, and resolving infrastructure failures. Metrics (MTTR, P1 count) feed SLA credits and Uptime Institute audit reports.',
    defaultGrain: 'incident_id',
    dimensions: ['Severity', 'MTTR (min)', 'Root Cause Category', 'SLA Impact (min)'],
  },
  {
    id: 'change-management',
    label: 'Change Management',
    category: 'operations',
    type: 'ontology',
    connections: 2,
    businessIntent:
      'Controlled process for approving, scheduling, and documenting infrastructure changes. Unmanaged changes are the #1 cause of preventable outages in colocation environments.',
    defaultGrain: 'change_id',
    dimensions: ['Change Type', 'Risk Level', 'Approval Stage', 'Implementation Status'],
  },

  // ─── BUSINESS ───────────────────────────────────────────────────────────
  {
    id: 'tenant-hyperscaler',
    label: 'Tenant / Hyperscaler',
    category: 'business',
    type: 'ontology',
    isCore: true,
    connections: 6,
    businessIntent:
      'The revenue-generating client occupying white space under a Master Service Agreement. Hyperscalers (AWS, Azure, GCP) drive scale requirements; enterprises require high-touch SLA management.',
    defaultGrain: 'client_id',
    dimensions: ['Client Type', 'Contract Term (years)', 'Power Committed (MW)', 'Revenue ($M/yr)'],
    componentNodes: [
      { label: 'MSA & Contracts', category: 'business', relationship: 'governed by' },
      { label: 'Pricing Model', category: 'business', relationship: 'billed via' },
      { label: 'Colocation Revenue', category: 'business', relationship: 'generates' },
    ],
  },
  {
    id: 'colocation-space',
    label: 'Colocation Space',
    category: 'business',
    type: 'ontology',
    connections: 4,
    businessIntent:
      'Physical space product sold to clients — cabinets, cages, suites, or halls. Pricing is typically per kW of committed power; floor space is a secondary metric.',
    defaultGrain: 'lease_id',
    dimensions: ['Product Type', 'Power (kW)', 'SLA Tier', 'Lease Term (months)'],
  },
  {
    id: 'msa-contracts',
    label: 'MSA & Contracts',
    category: 'business',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Master Service Agreement and Order Forms defining SLA commitments, pricing, term, and credit structures. Contract tenor (3–15 years for hyperscalers) drives financing and IRR calculations.',
    defaultGrain: 'contract_id',
    dimensions: ['Term (years)', 'ACV ($M)', 'SLA Uptime %', 'Exit Provisions'],
  },
  {
    id: 'pricing-model',
    label: 'Pricing Model',
    category: 'business',
    type: 'ontology',
    connections: 2,
    businessIntent:
      'Commercial structure for monetising space, power, and services. Power-based pricing ($/kW/month) dominates hyperscaler deals; MRC + usage suits SME colocation.',
    defaultGrain: 'product_id',
    dimensions: ['Model Type', 'Power Rate ($/kW)', 'MRC', 'Cross-Connect Rate ($/port)'],
  },
  {
    id: 'colo-revenue',
    label: 'Colocation Revenue',
    category: 'business',
    type: 'metric',
    connections: 3,
    businessIntent:
      'Monthly and annual recurring revenue from colocation, power, cross-connects, and managed services. Occupancy-weighted revenue per kW is the primary financial health metric.',
    defaultGrain: 'facility_id · month',
    dimensions: ['MRR ($M)', 'ARR ($M)', 'Revenue/kW', 'Occupancy %', 'Churn Rate %'],
  },

  // ─── COMPLIANCE ─────────────────────────────────────────────────────────
  {
    id: 'tier-standard',
    label: 'Uptime Tier Standard',
    category: 'compliance',
    type: 'ontology',
    isCore: true,
    connections: 5,
    businessIntent:
      'Uptime Institute Tier I–IV classification defines redundancy, concurrently maintainable, and fault-tolerant requirements. Tier is a key commercial differentiator and SLA foundation.',
    defaultGrain: 'facility_id',
    dimensions: ['Tier Level', 'Uptime Guarantee (%)', 'Annual Downtime (min)', 'Certification Body'],
    componentNodes: [
      { label: 'ISO 27001', category: 'compliance', relationship: 'aligned with' },
      { label: 'SOC 2 Type II', category: 'compliance', relationship: 'requires' },
      { label: 'PCI-DSS', category: 'compliance', relationship: 'enables' },
    ],
  },
  {
    id: 'iso27001',
    label: 'ISO 27001',
    category: 'compliance',
    type: 'ontology',
    connections: 2,
    businessIntent:
      'Information Security Management System standard. Required by financial services, healthcare, and government clients. Annual surveillance audit with full recertification every 3 years.',
    defaultGrain: 'facility_id',
    dimensions: ['Scope', 'Last Audit Date', 'Non-Conformances', 'Certifying Body'],
  },
  {
    id: 'soc2-type2',
    label: 'SOC 2 Type II',
    category: 'compliance',
    type: 'ontology',
    connections: 2,
    businessIntent:
      'AICPA trust-services criteria audit over a minimum 6-month period. Mandatory for US tech clients and increasingly required by EU enterprises. Covers security, availability, confidentiality.',
    defaultGrain: 'facility_id',
    dimensions: ['Trust Service Categories', 'Audit Period (months)', 'Exceptions', 'Auditor Firm'],
  },
  {
    id: 'pci-dss',
    label: 'PCI-DSS',
    category: 'compliance',
    type: 'ontology',
    connections: 2,
    businessIntent:
      'Payment Card Industry Data Security Standard for facilities hosting card-processing workloads. Network segmentation, access controls, and quarterly vulnerability scans are key requirements.',
    defaultGrain: 'facility_id',
    dimensions: ['Level', 'Last QSA Audit', 'Compensating Controls', 'Scope Boundaries'],
  },

  // ─── SUSTAINABILITY ─────────────────────────────────────────────────────
  {
    id: 'sustainability',
    label: 'Sustainability',
    category: 'sustainability',
    type: 'ontology',
    isCore: true,
    connections: 6,
    businessIntent:
      'ESG strategy encompassing energy efficiency, renewable sourcing, water management, and carbon accountability. Hyperscalers demand 100% renewable match; ESG scoring influences financing cost.',
    defaultGrain: 'facility_id · year',
    dimensions: ['Renewable Energy % ', 'Carbon Intensity (gCO2/kWh)', 'PUE', 'WUE', 'LEED / BREEAM Grade'],
    componentNodes: [
      { label: 'Carbon Footprint', category: 'sustainability', relationship: 'measures' },
      { label: 'Renewable Energy', category: 'sustainability', relationship: 'sources from' },
      { label: 'WUE', category: 'sustainability', relationship: 'tracks' },
    ],
  },
  {
    id: 'carbon-footprint',
    label: 'Carbon Footprint',
    category: 'sustainability',
    type: 'metric',
    connections: 3,
    businessIntent:
      'Scope 1 (diesel generators), Scope 2 (grid electricity), and Scope 3 (supply chain) greenhouse gas emissions. Tenant ESG reporting requirements are increasingly binding on operators.',
    defaultGrain: 'facility_id · year',
    dimensions: ['Scope 1 (tCO2e)', 'Scope 2 (tCO2e)', 'Scope 3 (tCO2e)', 'Intensity (gCO2/kWh)'],
  },
  {
    id: 'renewable-energy',
    label: 'Renewable Energy',
    category: 'sustainability',
    type: 'ontology',
    connections: 3,
    businessIntent:
      'Sourcing electricity from wind, solar, or hydro via PPAs, RECs, or on-site generation. 24/7 carbon-free energy (CFE) matching is the emerging standard beyond annual renewable certificates.',
    defaultGrain: 'facility_id · month',
    dimensions: ['Source Type', 'PPA Coverage %', 'CFE Score', 'Cost ($/MWh)'],
  },
  {
    id: 'wue-metric',
    label: 'WUE',
    category: 'sustainability',
    type: 'metric',
    connections: 2,
    businessIntent:
      'Water Usage Effectiveness (litres per kWh of IT load). Cooling towers and evaporative economisers drive water consumption. Water stress regions require WUE targets below 0.5 L/kWh.',
    defaultGrain: 'facility_id · month',
    dimensions: ['Annual WUE', 'Source (Municipal/Recycled)', 'Discharge Compliance', 'Region Water Stress'],
  },
  {
    id: 'green-certification',
    label: 'Green Certification',
    category: 'sustainability',
    type: 'ontology',
    connections: 2,
    businessIntent:
      'LEED, BREEAM, or Green Star building certification signals design and operational sustainability commitments. Premium certification supports higher rental rates and ESG fund eligibility.',
    defaultGrain: 'facility_id',
    dimensions: ['Scheme (LEED/BREEAM)', 'Rating Level', 'Points Achieved', 'Certified Area (sqft)'],
  },

  // ─── LIFECYCLE STAGES ───────────────────────────────────────────────────
  {
    id: 'strategy-assessment',
    label: 'Strategy Assessment',
    category: 'business',
    type: 'decision',
    connections: 3,
    businessIntent:
      'Stage 01 of the EAiQ lifecycle: market sizing, site feasibility, demand forecast, and business case development. Output is a go/no-go decision with indicative IRR and capital requirements.',
    defaultGrain: 'project_id',
    dimensions: ['Market Size ($M)', 'Demand Forecast (MW)', 'Feasibility Score', 'IRR Target %'],
  },
  {
    id: 'design-build',
    label: 'Design & Build',
    category: 'infrastructure',
    type: 'decision',
    connections: 4,
    businessIntent:
      'Stage 03 of the EAiQ lifecycle: engineering design, vendor procurement, and physical construction. Critical path management; EPC contractor selection and lead-time risk mitigation are key.',
    defaultGrain: 'project_id',
    dimensions: ['CAPEX ($M)', 'Build Timeline (months)', 'EPC Contractor', 'Commissioning Date'],
  },
  {
    id: 'monetization',
    label: 'Monetization',
    category: 'business',
    type: 'decision',
    connections: 3,
    businessIntent:
      'Stage 06 of the EAiQ lifecycle: optimising revenue mix, cross-sell of managed services, and yield management across the tenant portfolio to maximise EBITDA margin.',
    defaultGrain: 'facility_id · quarter',
    dimensions: ['Revenue ($M)', 'EBITDA Margin %', 'Occupancy %', 'Managed Services Attach Rate %'],
  },
];

/** @type {Array<{source: string, target: string, label: string}>} */
export const DC_EDGES = [
  // Core hub
  { source: 'dc-core', target: 'power-system',       label: 'powered by' },
  { source: 'dc-core', target: 'cooling-system',     label: 'cooled by' },
  { source: 'dc-core', target: 'network-infra',      label: 'connected via' },
  { source: 'dc-core', target: 'tier-standard',      label: 'certified under' },
  { source: 'dc-core', target: 'sustainability',     label: 'measures' },
  { source: 'dc-core', target: 'dcim-platform',      label: 'managed by' },
  { source: 'dc-core', target: 'white-space',        label: 'contains' },
  { source: 'dc-core', target: 'server-hall',        label: 'houses' },
  { source: 'dc-core', target: 'colocation-space',   label: 'offers' },

  // Power chain
  { source: 'power-system', target: 'ups',                label: 'backed by' },
  { source: 'power-system', target: 'generator',          label: 'failover to' },
  { source: 'power-system', target: 'electrical-infra',   label: 'distributed through' },
  { source: 'power-system', target: 'pue-metric',         label: 'measured by' },
  { source: 'electrical-infra', target: 'pdu',            label: 'feeds' },
  { source: 'pdu',           target: 'rack-cabinet',      label: 'powers' },
  { source: 'generator',     target: 'ups',               label: 'backs up' },
  { source: 'pue-metric',    target: 'sustainability',    label: 'feeds into' },
  { source: 'pue-metric',    target: 'cooling-system',    label: 'impacted by' },

  // Cooling chain
  { source: 'cooling-system', target: 'crac-crah',       label: 'deploys' },
  { source: 'cooling-system', target: 'chilled-water',   label: 'uses' },
  { source: 'cooling-system', target: 'hot-cold-aisle',  label: 'requires' },
  { source: 'cooling-system', target: 'liquid-cooling',  label: 'extends to' },
  { source: 'hot-cold-aisle', target: 'rack-cabinet',    label: 'contains' },
  { source: 'liquid-cooling', target: 'rack-cabinet',    label: 'cools' },

  // Network chain
  { source: 'network-infra',    target: 'fiber-connectivity', label: 'runs on' },
  { source: 'network-infra',    target: 'ixp',                label: 'peers at' },
  { source: 'network-infra',    target: 'bgp-routing',        label: 'routes via' },
  { source: 'network-infra',    target: 'bandwidth-capacity', label: 'delivers' },
  { source: 'fiber-connectivity', target: 'ixp',             label: 'connects to' },

  // Operations chain
  { source: 'dcim-platform',  target: 'capacity-planning',   label: 'drives' },
  { source: 'dcim-platform',  target: 'monitoring-alerting', label: 'integrates' },
  { source: 'dcim-platform',  target: 'incident-management', label: 'triggers' },
  { source: 'dcim-platform',  target: 'change-management',   label: 'tracks' },
  { source: 'dcim-platform',  target: 'rack-cabinet',        label: 'monitors' },
  { source: 'monitoring-alerting', target: 'incident-management', label: 'escalates to' },
  { source: 'capacity-planning',   target: 'white-space',    label: 'forecasts' },

  // Business chain
  { source: 'tenant-hyperscaler', target: 'msa-contracts',   label: 'governed by' },
  { source: 'tenant-hyperscaler', target: 'pricing-model',   label: 'billed via' },
  { source: 'tenant-hyperscaler', target: 'colo-revenue',    label: 'generates' },
  { source: 'tenant-hyperscaler', target: 'dcim-platform',   label: 'monitored through' },
  { source: 'colocation-space',   target: 'tenant-hyperscaler', label: 'leased to' },
  { source: 'white-space',        target: 'colocation-space', label: 'sold as' },
  { source: 'msa-contracts',      target: 'colo-revenue',    label: 'determines' },
  { source: 'pricing-model',      target: 'colo-revenue',    label: 'drives' },

  // Compliance chain
  { source: 'tier-standard', target: 'iso27001',   label: 'aligned with' },
  { source: 'tier-standard', target: 'soc2-type2', label: 'requires' },
  { source: 'tier-standard', target: 'pci-dss',    label: 'enables' },
  { source: 'tier-standard', target: 'power-system', label: 'governs' },

  // Sustainability chain
  { source: 'sustainability', target: 'carbon-footprint',  label: 'measures' },
  { source: 'sustainability', target: 'renewable-energy',  label: 'sources from' },
  { source: 'sustainability', target: 'wue-metric',        label: 'tracks' },
  { source: 'sustainability', target: 'green-certification', label: 'achieves' },
  { source: 'renewable-energy', target: 'carbon-footprint', label: 'reduces' },
  { source: 'chilled-water', target: 'wue-metric',          label: 'drives' },

  // Lifecycle stages
  { source: 'strategy-assessment', target: 'dc-core',            label: 'scopes' },
  { source: 'design-build',        target: 'dc-core',            label: 'constructs' },
  { source: 'design-build',        target: 'electrical-infra',   label: 'procures' },
  { source: 'design-build',        target: 'cooling-system',     label: 'installs' },
  { source: 'dcim-platform',       target: 'monetization',       label: 'enables' },
  { source: 'tenant-hyperscaler',  target: 'monetization',       label: 'drives' },
  { source: 'strategy-assessment', target: 'tier-standard',      label: 'targets' },
  { source: 'colo-revenue',        target: 'monetization',       label: 'feeds' },
];

// Fixed positions for static layout (canvas ~1200 wide, ~700 tall)
// Centered around (0, 0); the graph component auto-fits
export const FIXED_POSITIONS = {
  // Core
  'dc-core':             { x:    0, y:    0 },

  // Infrastructure ring
  'white-space':         { x:  -80, y:  110 },
  'server-hall':         { x: -130, y:  -70 },
  'rack-cabinet':        { x:   70, y:  110 },
  'pdu':                 { x:  -60, y:  190 },
  'colocation-space':    { x:  130, y:  -70 },

  // Power cluster (left)
  'power-system':        { x: -270, y:    0 },
  'ups':                 { x: -370, y:  -90 },
  'generator':           { x: -370, y:   90 },
  'electrical-infra':    { x: -250, y:  170 },
  'pue-metric':          { x: -200, y: -150 },

  // Cooling cluster (top-left)
  'cooling-system':      { x: -150, y: -230 },
  'crac-crah':           { x: -290, y: -310 },
  'chilled-water':       { x:  -80, y: -340 },
  'hot-cold-aisle':      { x: -260, y: -190 },
  'liquid-cooling':      { x:  -30, y: -270 },

  // Network cluster (top-right)
  'network-infra':       { x:  200, y: -200 },
  'fiber-connectivity':  { x:  110, y: -330 },
  'ixp':                 { x:  330, y: -290 },
  'bgp-routing':         { x:  370, y: -160 },
  'bandwidth-capacity':  { x:  240, y: -120 },

  // Operations cluster (right)
  'dcim-platform':       { x:  300, y:   50 },
  'capacity-planning':   { x:  420, y:  -50 },
  'monitoring-alerting': { x:  420, y:  130 },
  'incident-management': { x:  330, y:  220 },
  'change-management':   { x:  200, y:  195 },

  // Business cluster (bottom-right)
  'tenant-hyperscaler':  { x:  150, y:  310 },
  'msa-contracts':       { x:   60, y:  410 },
  'pricing-model':       { x:  250, y:  410 },
  'colo-revenue':        { x:  360, y:  330 },

  // Compliance cluster (top)
  'tier-standard':       { x:    0, y: -290 },
  'iso27001':            { x: -160, y: -400 },
  'soc2-type2':          { x:  160, y: -400 },
  'pci-dss':             { x:    0, y: -450 },

  // Sustainability cluster (bottom-left)
  'sustainability':      { x: -195, y:  250 },
  'carbon-footprint':    { x: -340, y:  300 },
  'renewable-energy':    { x: -320, y:  175 },
  'wue-metric':          { x: -145, y:  375 },
  'green-certification': { x: -340, y:  400 },

  // Lifecycle stages (outer)
  'strategy-assessment': { x: -440, y: -260 },
  'design-build':        { x: -440, y:  220 },
  'monetization':        { x:  430, y:  380 },
};

// Alias exports matching the component imports
export const TMT_NODES = DC_NODES;
export const TMT_EDGES = DC_EDGES;
