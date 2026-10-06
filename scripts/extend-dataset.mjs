// scripts/extend-dataset.mjs
//
// Adds the sheets features 6–15 need to nexus_demo_dataset.xlsx, in the
// workbook's own style, so every number the product shows still comes from
// one workbook. Idempotent: re-running replaces these sheets and the
// energy_reused_kwh column rather than duplicating them.
//
//   23_runbooks         ordered response steps per component failure mode
//   24_site_risk        natural-hazard and grid-reliability exposure per site
//   25_supply_chain     vendor, origin and lead time per component type
//   26_thermal_sensors  MUM-1 cold-aisle inlet and CRAH supply-air readings
//   13_energy           + energy_reused_kwh (EU EED energy reuse factor)
//
// Values follow the README's rules for extending the data: the existing
// naming scheme, no real operators, no round-number placeholders. Each value
// is cross-checked against the existing sheets by lib/nexus/consistency.test.mjs.
//
// Run with `node scripts/extend-dataset.mjs`, then `npm run import:dataset`.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'nexus_demo_dataset.xlsx');
const json = (name) => JSON.parse(readFileSync(join(root, 'data', 'nexus', `${name}.json`), 'utf8'));

// ── 23_runbooks ─────────────────────────────────────────────────────────────
// One row per step. match_terms are pipe-separated phrases found in the alert
// messages (20_active_alerts) and incident root causes (11_incidents) that
// this runbook answers. owner_team uses the teams already named in 20_active_alerts.
const RUNBOOKS = [
  ['RB-UPS-BAT', 'ups', 'Battery string degradation', 'resistance trending|capacity fade|Battery batch', [
    ['Confirm the string resistance trend against the last discharge test', 'Electrical', 30],
    ['Verify the redundant module can carry the full load, then transfer the affected string', 'Electrical', 60],
    ['Issue tenant notifications for every contract on the affected UPS chain', 'Leadership', 120],
    ['Raise an emergency string replacement with the vendor and pull the depot spare', 'Facilities', 240],
    ['Audit every string from the same batch across the portfolio', 'Electrical', 1440],
  ]],
  ['RB-CRAH-SAT', 'crah', 'Supply air above setpoint', 'Supply air temp|Actuator seized', [
    ['Check chilled-water valve actuator response at the unit', 'Facilities', 15],
    ['Raise the partner CRAH fan speed and confirm rack inlets stay under 27 C', 'Facilities', 30],
    ['Replace the actuator from site spares', 'Facilities', 180],
    ['Log the thermal excursion against the rows served', 'Capacity planning', 1440],
  ]],
  ['RB-CRAH-FLT', 'crah', 'Filter loading', 'Filter differential pressure', [
    ['Schedule a filter change in the next maintenance window', 'Facilities', 1440],
    ['Compare fan power draw against the commissioning baseline', 'Facilities', 2880],
  ]],
  ['RB-CHL-APP', 'chiller', 'Condenser approach degrading', 'Approach temperature|scale build-up', [
    ['Trend condenser approach against the 2.8 C design value', 'Facilities', 240],
    ['Test condenser water hardness and conductivity', 'Facilities', 480],
    ['Stage the chiller out and schedule tube cleaning', 'Facilities', 10080],
    ['Restate the monthly PUE impact for the energy report', 'Sustainability', 10080],
  ]],
  ['RB-CT-WTR', 'cooling_tower', 'Make-up water shortfall', 'Make-up water|Municipal supply|WUE', [
    ['Switch make-up to treated-water storage and confirm hours of reserve', 'Facilities', 30],
    ['Activate the standby tanker supply contract', 'Facilities', 240],
    ['Raise cycles of concentration within chemistry limits', 'Facilities', 480],
    ['File the state water-impact disclosure if the WUE breach is reportable', 'Sustainability', 4320],
  ]],
  ['RB-CHW-DP', 'chw_loop', 'Loop differential pressure rising', 'Differential pressure', [
    ['Inspect strainers and isolation valves on the loop', 'Facilities', 240],
    ['Flush the affected loop section during low load', 'Facilities', 4320],
  ]],
  ['RB-BUS-IMB', 'busway', 'Phase imbalance or loose joint', 'Phase imbalance|Loose connection', [
    ['Thermographic scan of every tap-off box on the run', 'Electrical', 120],
    ['Rebalance rack PDU phase assignments', 'Electrical', 1440],
    ['Torque-check busway joints in the next window', 'Electrical', 4320],
  ]],
  ['RB-PDU-OVL', 'pdu', 'Circuit near rated capacity', 'rated capacity', [
    ['Freeze new deployments on the circuit', 'Capacity planning', 60],
    ['Move the highest-draw racks to circuits with headroom', 'Capacity planning', 4320],
    ['Raise a PDU upgrade if growth continues', 'Capacity planning', 10080],
  ]],
  ['RB-GEN-FUEL', 'generator', 'Fuel supply or filtration', 'Fuel level|Fuel filter', [
    ['Order a top-up to 90% of tank capacity', 'Facilities', 240],
    ['Replace fuel filters and run a 30-minute load test', 'Electrical', 1440],
    ['Confirm the fuel polishing schedule', 'Facilities', 10080],
  ]],
  ['RB-UTIL-CAP', 'utility_feed', 'Sanctioned load near limit', 'Sanctioned load|GRID CONSTRAINED', [
    ['Cap new IT load intake at the site', 'Capacity planning', 60],
    ['Redirect planned deployments to sites with grid headroom', 'Capacity planning', 1440],
    ['File a load enhancement application with the utility', 'Leadership', 10080],
  ]],
  ['RB-ROW-CAP', 'rack_row', 'Row at full occupancy', 'rack occupancy', [
    ['Review stranded capacity elsewhere in the facility', 'Capacity planning', 1440],
    ['Run the density cascade before approving any upgrade', 'Capacity planning', 4320],
  ]],
];

const runbookRows = RUNBOOKS.flatMap(([id, type, mode, match, steps]) =>
  steps.map(([action, owner, within], i) => [id, type, mode, match, i + 1, action, owner, within]));

// ── 24_site_risk ────────────────────────────────────────────────────────────
// Seismic zone per BIS IS 1893 (Part 1):2016. Exposure scored 1 (low) to 5
// (severe) from the IMD hazard atlas and NDMA flood-prone district lists.
// Grid trips are feed interruptions over the last 12 months at site metering.
const SITE_RISK = [
  ['MUM-1', 'III', 4, 3, 2, 3, 18, 'July 2005 Mumbai floods; Cyclone Tauktae, May 2021'],
  ['MUM-2', 'III', 4, 3, 2, 5, 23, 'Low-lying plot; same 2005 and 2021 events as MUM-1'],
  ['CHN-1', 'III', 4, 4, 4, 4, 27, 'December 2015 Chennai floods; Cyclone Michaung, December 2023'],
  ['HYD-1', 'II', 3, 1, 4, 2, 11, 'October 2020 Hyderabad floods'],
  ['NCR-1', 'IV', 2, 1, 5, 7, 34, 'May 2024 north India heatwave and peak-demand curtailment'],
  ['BLR-1', 'II', 3, 1, 2, null, null, 'September 2022 Bengaluru flooding; site not yet energised'],
];

// ── 25_supply_chain ─────────────────────────────────────────────────────────
// Lead times match 06_upgrade_options where a component type appears there.
const SUPPLY = [
  ['ups', 'Vendor A', 'China', 'yes', 16, 0, 'Cells shipped via the Red Sea route; 2024 diversions added 2-3 weeks'],
  ['pdu', 'Vendor C', 'India', 'no', 10, 2, 'Domestic assembly; two units held at the regional depot'],
  ['rpp', 'Vendor C', 'India', 'no', 9, 1, 'Domestic assembly'],
  ['busway', 'Vendor D', 'Germany', 'yes', 14, 0, 'Single qualified supplier for the installed rating'],
  ['crah', 'Vendor E', 'Italy', 'no', 8, 1, 'Fans and actuators stocked locally; full units imported'],
  ['chiller', 'Vendor F', 'United States', 'yes', 22, 0, 'Compressor allocation constrained since 2023'],
  ['cooling_tower', 'Vendor G', 'India', 'no', 12, 0, 'Fill media sourced domestically'],
  ['chw_loop', 'Vendor G', 'India', 'no', 6, 0, 'Pipework and valves from local fabricators'],
  ['generator', 'Vendor H', 'United Kingdom', 'no', 26, 0, 'Engine imported, alternator and enclosure assembled in India'],
  ['transformer', 'Vendor J', 'India', 'no', 34, 0, 'Grain-oriented steel shortage pushed lead times past 30 weeks'],
  ['switchgear', 'Vendor K', 'France', 'yes', 20, 0, 'Breaker frames allocated quarterly'],
];

// ── 26_thermal_sensors ──────────────────────────────────────────────────────
// Two cold-aisle inlet sensors per MUM-1 row. The far-end sensor is the row's
// worst inlet, so 27 C (ASHRAE A1 recommended upper limit) minus that reading
// is the row's thermal_margin_c in 03_rows. The near-end sensor sits beside
// the CRAH and reads cooler. CRAH supply air runs to an 18 C setpoint;
// CRAH-K-01 reads 2.1 C over it, which is alert ALM-4821.
const READ_AT = '2026-09-29 03:00';
const round1 = (v) => Math.round(v * 10) / 10;

function sensorRows() {
  const rows = json('rows').filter((r) => r.facility_id === 'MUM-1');
  const out = [];
  rows.forEach((row, i) => {
    const far = round1(27 - row.thermal_margin_c);
    const near = round1(far - (0.6 + ((i * 7) % 6) / 10));
    out.push([`TS-${row.row_id}1`, 'MUM-1', row.hall_id, row.row_id, `CRAH-${row.row_id}-01`, 'cold aisle inlet, CRAH end', near, null, 27, READ_AT]);
    out.push([`TS-${row.row_id}2`, 'MUM-1', row.hall_id, row.row_id, `CRAH-${row.row_id}-02`, 'cold aisle inlet, far end', far, null, 27, READ_AT]);
  });
  rows.forEach((row, i) => {
    for (const unit of ['01', '02']) {
      const id = `CRAH-${row.row_id}-${unit}`;
      const reading = id === 'CRAH-K-01' ? 20.1 : round1(18 + (((i * 2 + Number(unit)) * 37) % 9 - 4) / 10);
      out.push([`SAT-${id}`, 'MUM-1', row.hall_id, row.row_id, id, 'CRAH supply air', reading, 18, 20, READ_AT]);
    }
  });
  return out;
}

const SHEETS = [
  {
    name: '23_runbooks',
    header: ['runbook_id', 'component_type', 'failure_mode', 'match_terms', 'step', 'action', 'owner_team', 'within_min'],
    widths: [14, 15, 30, 44, 6, 72, 18, 11],
    rows: runbookRows,
    notes: [
      'Steps run in order. within_min is the target time from detection to completing the step.',
      'Owner teams are the teams already named in 20_active_alerts.',
    ],
  },
  {
    name: '24_site_risk',
    header: ['facility_id', 'seismic_zone', 'flood_exposure', 'cyclone_exposure', 'heat_exposure', 'grid_trips_12m', 'avg_trip_min', 'reference_event'],
    widths: [11, 12, 13, 15, 13, 14, 12, 64],
    rows: SITE_RISK,
    notes: [
      'Seismic zone per BIS IS 1893 (Part 1):2016.',
      'Exposure 1 (low) to 5 (severe), from the IMD hazard atlas and NDMA flood-prone district lists.',
      'Grid trips are feed interruptions over the last 12 months at site metering. BLR-1 is not yet energised.',
    ],
  },
  {
    name: '25_supply_chain',
    header: ['component_type', 'vendor', 'origin_country', 'single_source', 'lead_time_weeks', 'spares_on_site', 'disruption_note'],
    widths: [15, 11, 15, 13, 15, 14, 64],
    rows: SUPPLY,
    notes: [
      'Lead times match 06_upgrade_options for every component type that appears there.',
      'Vendor A also supplied the Q4-2023 battery batch named in 11_incidents.',
    ],
  },
  {
    name: '26_thermal_sensors',
    header: ['sensor_id', 'facility_id', 'hall_id', 'row_id', 'component_id', 'location', 'reading_c', 'setpoint_c', 'limit_c', 'read_at'],
    widths: [16, 11, 11, 7, 13, 26, 10, 10, 8, 17],
    rows: sensorRows(),
    notes: [
      'Inlet limit 27 C is the ASHRAE A1 recommended upper bound. 27 C minus the far-end reading is the row thermal_margin_c.',
      'CRAH supply air runs to an 18 C setpoint and alarms at 20 C. CRAH-K-01 at 20.1 C is alert ALM-4821.',
    ],
  },
];

// ── write ───────────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(SOURCE);

// Borrow the workbook's own styles from an existing sheet.
const template = wb.getWorksheet('15_grid');
const headerStyle = structuredClone(template.getRow(1).getCell(1).style);
const textStyle = structuredClone(template.getRow(2).getCell(1).style);
const numberStyle = structuredClone(template.getRow(2).getCell(4).style);
const noteStyle = structuredClone(template.getRow(template.rowCount).getCell(1).style);
const decimalStyle = { ...structuredClone(numberStyle), numFmt: '0.0' };

for (const spec of SHEETS) {
  const existing = wb.getWorksheet(spec.name);
  if (existing) wb.removeWorksheet(existing.id);
  const ws = wb.addWorksheet(spec.name, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = spec.widths.map((width) => ({ width }));
  const header = ws.addRow(spec.header);
  header.eachCell((cell) => { cell.style = headerStyle; });
  for (const values of spec.rows) {
    const row = ws.addRow(values);
    spec.header.forEach((_, i) => {
      const cell = row.getCell(i + 1);
      const v = values[i];
      cell.style = typeof v === 'number' ? (Number.isInteger(v) ? numberStyle : decimalStyle) : textStyle;
    });
  }
  ws.addRow([]);
  for (const note of spec.notes) ws.addRow([note]).getCell(1).style = noteStyle;
}

// 13_energy gets energy_reused_kwh. No facility runs a heat-reuse plant, so
// the energy reuse factor is reported honestly as zero.
const energy = wb.getWorksheet('13_energy');
const headers = energy.getRow(1).values.slice(1);
let col = headers.indexOf('energy_reused_kwh') + 1;
if (col === 0) col = headers.length + 1;
energy.getRow(1).getCell(col).value = 'energy_reused_kwh';
energy.getRow(1).getCell(col).style = headerStyle;
energy.getColumn(col).width = 17;
let lastData = 1;
energy.eachRow((row, n) => { if (n > 1 && row.getCell(2).value) lastData = n; });
for (let n = 2; n <= lastData; n += 1) {
  const cell = energy.getRow(n).getCell(col);
  cell.value = 0;
  cell.style = numberStyle;
}
const reuseNote = 'energy_reused_kwh is zero: no facility exports waste heat, so the EU EED energy reuse factor is 0.';
let hasNote = false;
energy.eachRow((row) => { if (row.getCell(1).value === reuseNote) hasNote = true; });
if (!hasNote) energy.addRow([reuseNote]).getCell(1).style = noteStyle;

// ── reconcile the monthly ledgers ───────────────────────────────────────────
// 22_timeseries is the authority for monthly IT load, PUE and WUE ("24 months
// to September 2026"). Its labels repeated 2024-10 and stopped at 2026-08, so
// rows are relabelled in order. 13_energy and 14_water are then restated from
// it so that every view of the same month agrees:
//   IT kWh       = it_load_kw × hours in the month
//   total_kwh    = IT kWh × PUE                  (renewable share, tariff unchanged)
//   total_litres = IT kWh × WUE                  (WUE is litres per IT kWh)
//   peak LPM     = average LPM × seasonal peaking factor (pre-monsoon summer highest)
const cellsByHeader = (ws) => {
  const names = ws.getRow(1).values;
  return (row, name) => row.getCell(names.indexOf(name));
};
const dataRows = (ws) => {
  const out = [];
  ws.eachRow((row, n) => { if (n > 1 && row.getCell(2).value && row.getCell(3).value !== null && row.getCell(3).value !== undefined) out.push(row); });
  return out;
};
const addMonths = (month, k) => {
  const [y, m] = month.split('-').map(Number);
  const i = y * 12 + (m - 1) + k;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
};
const hoursIn = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate() * 24;
};
const round = (v, dp = 0) => Math.round(v * 10 ** dp) / 10 ** dp;

const tsSheet = wb.getWorksheet('22_timeseries');
const ts = cellsByHeader(tsSheet);
const seen = new Map();
const series = new Map();
for (const row of dataRows(tsSheet)) {
  const id = ts(row, 'facility_id').value;
  const k = seen.get(id) ?? 0;
  seen.set(id, k + 1);
  const month = addMonths('2024-10', k);
  ts(row, 'month').value = month;
  series.set(`${id}:${month}`, {
    it: ts(row, 'it_load_kw').value, pue: ts(row, 'pue').value, wue: ts(row, 'wue_l_per_kwh').value,
  });
}

const facilityById = new Map(json('facilities').map((f) => [f.facility_id, f]));

const en = cellsByHeader(energy);
for (const row of dataRows(energy)) {
  const id = en(row, 'facility_id').value;
  const month = en(row, 'month').value;
  const t = series.get(`${id}:${month}`);
  if (!t) throw new Error(`13_energy ${id} ${month} has no 22_timeseries month`);
  const f = facilityById.get(id);
  const total = round(t.it * hoursIn(month) * t.pue);
  const renewable = round(total * f.renewable_pct / 100);
  const gridKwh = total - renewable;
  en(row, 'total_kwh').value = total;
  en(row, 'renewable_kwh').value = renewable;
  en(row, 'grid_kwh').value = gridKwh;
  en(row, 'tariff_inr_kwh').value = f.tariff_inr_kwh;
  en(row, 'cost_inr_lakh').value = round(total * f.tariff_inr_kwh / 1e5, 1);
  en(row, 'measured_pue').value = t.pue;
  en(row, 'emissions_tco2').value = round(gridKwh * en(row, 'grid_carbon_kg_per_kwh').value / 1000, 1);
}

const PEAKING = { '04': 1.27, '05': 1.29, '06': 1.24, '07': 1.18, '08': 1.17, '09': 1.19 };
const waterSheet = wb.getWorksheet('14_water');
const wa = cellsByHeader(waterSheet);
for (const row of dataRows(waterSheet)) {
  const id = wa(row, 'facility_id').value;
  const month = wa(row, 'month').value;
  const t = series.get(`${id}:${month}`);
  if (!t) throw new Error(`14_water ${id} ${month} has no 22_timeseries month`);
  // Keep each month's existing treated-water share.
  const treatedShare = wa(row, 'treated_litres').value / (wa(row, 'treated_litres').value + wa(row, 'freshwater_litres').value);
  const hours = hoursIn(month);
  const total = round(t.it * hours * t.wue);
  const treated = round(total * treatedShare);
  wa(row, 'total_litres').value = total;
  wa(row, 'measured_wue_l_per_kwh').value = t.wue;
  wa(row, 'treated_litres').value = treated;
  wa(row, 'freshwater_litres').value = total - treated;
  wa(row, 'peak_demand_lpm').value = round(total / (hours * 60) * (PEAKING[month.slice(5)] ?? 1.14), 1);
}

const ledgerNotes = [
  [energy, 'Restated from 22_timeseries: total_kwh = IT load x hours x PUE. Renewable share and tariff per 01_facilities.'],
  [waterSheet, 'Restated from 22_timeseries: total_litres = IT load x hours x WUE (litres per IT kWh). Peak LPM applies a seasonal peaking factor.'],
];
for (const [ws, note] of ledgerNotes) {
  let present = false;
  ws.eachRow((row) => { if (row.getCell(1).value === note) present = true; });
  if (!present) ws.addRow([note]).getCell(1).style = noteStyle;
}

// README: list the added sheets once.
const readme = wb.getWorksheet('00_README');
const marker = 'Operations sheets (23-26)';
let listed = false;
readme.eachRow((row) => { if (row.getCell(1).value === marker) listed = true; });
if (!listed) {
  const label = readme.getRow(3).getCell(1).style;
  const body = readme.getRow(3).getCell(2).style;
  readme.addRow([]);
  for (const [k, v] of [
    [marker, 'Runbooks, site hazard exposure, supply chain and MUM-1 thermal sensors. These feed incident response, site risk and the thermal twin.'],
    ['23_runbooks', 'Ordered response steps per component failure mode, with owner team and target time.'],
    ['24_site_risk', 'Seismic zone, flood, cyclone and heat exposure, and grid trips per facility.'],
    ['25_supply_chain', 'Vendor, origin, single-source flag and lead time per component type.'],
    ['26_thermal_sensors', 'Cold-aisle inlet and CRAH supply-air readings for every MUM-1 row.'],
  ]) {
    const row = readme.addRow([k, v]);
    row.getCell(1).style = label;
    row.getCell(2).style = body;
  }
}

// Keep 18_checks last, after the new sheets.
const order = wb.worksheets.map((ws) => ws.name).filter((n) => n !== '18_checks').concat('18_checks');
order.forEach((name, i) => { wb.getWorksheet(name).orderNo = i; });

await wb.xlsx.writeFile(SOURCE);
for (const spec of SHEETS) console.log(`  ${spec.name}`.padEnd(24), String(spec.rows.length).padStart(4), 'rows');
console.log('  13_energy               + energy_reused_kwh');
