// lib/trentar/regulatory.js — 04 Regulatory & Incentives, derived from the ontology.
//
// Public state support (MoU, Letter of Intent) is kept apart from
// project-specific eligibility, which is unverified. The approval path is
// laid out from the ontology's `precedes` edges, so its columns are the
// earliest stage each approval can start, not an authored order. Incentives
// carry no value: each is "potentially applicable" until verified in writing.
import { claim } from './claim.js';
import { getClaim, edges } from './registry.js';
import { reaches } from './consequence.js';

/** The requirement's approval sequence. Layout comes from edges, not this order. */
export const APPROVALS = [
  't.reg.land_title', 't.reg.landuse', 't.reg.environment', 't.reg.grid', 't.reg.electrical',
  't.reg.building', 't.reg.fire', 't.reg.telecom', 't.reg.commissioning',
];
export const SUPPORT = ['t.reg.mou', 't.reg.loi'];
export const ELIGIBILITY = ['t.reg.mou_scope', 't.reg.state_policy'];
export const INCENTIVES = ['t.reg.inc_capital_subsidy', 't.reg.inc_stamp_duty', 't.reg.inc_elec_duty', 't.reg.inc_tariff', 't.reg.inc_oa_relief'];

const STATUS_LABEL = { NOT_STARTED: 'Not started', IN_PROGRESS: 'In progress', SUBMITTED: 'Submitted', VALIDATED: 'Validated', BLOCKED: 'Blocked' };
const count = (id, label, value, unit, basis) => claim({ id, label, value, unit, basis, provenance: 'EAIQ_ANALYSIS' });

const into = (id, rel) => edges.filter((e) => e.to === id && e.relation === rel).map((e) => e.from);
const from = (id, rel) => edges.filter((e) => e.from === id && e.relation === rel).map((e) => e.to);

/** Earliest stage for each approval: longest `precedes` chain into it. */
function stages() {
  const stage = new Map();
  const visit = (id) => {
    if (stage.has(id)) return stage.get(id);
    const pre = into(id, 'precedes').filter((p) => APPROVALS.includes(p));
    const s = pre.length ? Math.max(...pre.map(visit)) + 1 : 0;
    stage.set(id, s);
    return s;
  };
  APPROVALS.forEach(visit);
  return stage;
}

let cache;
export function regulatoryModel() {
  if (cache) return cache;
  const stage = stages();
  const approvals = APPROVALS.map((id) => {
    const c = getClaim(id);
    return {
      id,
      claim: c,
      stage: stage.get(id),
      status: STATUS_LABEL[c.status] ?? 'Not recorded',
      after: into(id, 'precedes').map(getClaim),
      unlocks: from(id, 'precedes').map(getClaim),
      // site prerequisites that gate the approval itself (land control → title, zoning → land use)
      gatedBy: into(id, 'gates').map(getClaim),
      gates: from(id, 'gates').map(getClaim),
      delaysCod: from(id, 'delays').includes('t.prj.cod'),
      // blockers: risks that threaten it, and design decisions that constrain it
      blockers: [...into(id, 'threatens'), ...from(id, 'constrained_by')].map(getClaim),
    };
  });
  const incentives = INCENTIVES.map((id) => {
    const c = getClaim(id);
    return {
      claim: c,
      channels: ['capex', 'opex'].filter((k) => reaches(id, k).length > 0),
      verified: c.provenance !== 'TRENTAR_INPUT_REQUIRED',
    };
  });
  const started = approvals.filter((a) => a.status !== 'Not started' && a.status !== 'Not recorded').length;
  cache = {
    support: SUPPORT.map(getClaim),
    eligibility: ELIGIBILITY.map(getClaim),
    approvals,
    stageCount: Math.max(...approvals.map((a) => a.stage)) + 1,
    incentives,
    incentiveValue: getClaim('t.fin.incentive_value'),
    metrics: {
      mou: getClaim('t.reg.mou'),
      loi: getClaim('t.reg.loi'),
      approvals: count('t.calc.reg_approvals', 'Approvals on the path to COD', approvals.length, 'approvals',
        'Count of approval nodes on the ontology\'s consenting sequence, land title through commissioning. Each delays COD while open.'),
      started: count('t.calc.reg_started', 'Approvals started', started, `of ${approvals.length} started`,
        'Count of approval nodes whose status is past Not started. Status per approval is recorded in the ontology; no approval has a submission on record.'),
      verified: count('t.calc.reg_incentives_verified', 'Incentives verified', incentives.filter((i) => i.verified).length, `of ${incentives.length} verified`,
        'Count of incentive nodes whose eligibility is evidenced. An incentive is potentially applicable until its conditions are verified in writing; none is modelled as value before then.'),
      incentiveValue: getClaim('t.fin.incentive_value'),
    },
  };
  return cache;
}
