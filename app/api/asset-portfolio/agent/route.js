import { createClient } from '@/lib/supabase-server';
import { getCurrentUserId, fetchAssetRegister, fetchAssetEvents, fetchAssetIntelligence } from '@/lib/assetPortfolio';
import { ASSET_PORTFOLIO_SEED } from '@/data/assetPortfolioSeed';
import { fetchGoogleDataCenterLocations } from '@/lib/googleDCLocations';
import { callClaudeServer } from '@/lib/anthropicServer';

const SYSTEM_PROMPT = `You are the AI Portfolio Agent inside EAiQ's Asset Portfolio module, advising a data center portfolio manager.

STRICT GROUNDING RULES:
- You may ONLY reference facilities present in the ASSET REGISTER JSON provided below.
- Never invent a facility, figure, or date that is not in the supplied data.
- Whenever you reference a facility, cite both its Asset ID and Asset Name, e.g. "GDC-003 (Mayes County Data Center)".
- If the data doesn't support a confident answer, say so explicitly rather than guessing.

FORMATTING RULES:
- Use plain section headers (no ## or ### symbols), clean "-" bullet points, no markdown bold/italic symbols.
- Keep answers structured and scannable — short sections with a few bullets each.`;

async function fetchTavilyBenchmark(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return '';
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3,
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.answer || '';
  } catch {
    return '';
  }
}

function trimRegister(rows) {
  return rows.map(a => ({
    asset_id: a.asset_id, asset_name: a.asset_name, region: a.region, country: a.country, city: a.city,
    ownership_type: a.ownership_type, facility_status: a.facility_status, tier_rating: a.tier_rating,
    total_it_capacity_mw: a.total_it_capacity_mw, current_it_load_mw: a.current_it_load_mw,
    utilization_pct: a.utilization_pct, pue: a.pue,
    current_valuation_m: a.current_valuation_m, capex_budget_m: a.capex_budget_m, capex_spent_m: a.capex_spent_m, capex_remaining_m: a.capex_remaining_m,
    lease_expiry_date: a.lease_expiry_date, annual_rent_m: a.annual_rent_m,
    ppa_provider: a.ppa_provider, ppa_rate_usd_mwh: a.ppa_rate_usd_mwh, ppa_expiry_date: a.ppa_expiry_date,
    risk_flag: a.risk_flag,
  }));
}

function trimEvents(rows) {
  return rows.map(e => ({ asset_id: e.asset_id, event_type: e.event_type, event_date: e.event_date, amount_m: e.amount_m, status: e.status }));
}

function trimIntel(rows) {
  return rows.map(i => ({ asset_id: i.asset_id, headline: i.headline, severity: i.severity, category: i.category, detected_at: i.detected_at }));
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  const { message, history = [] } = body;
  if (!message) return Response.json({ error: 'message is required.' }, { status: 400 });

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);

  let register = [];
  let events = [];
  let intelligence = [];

  if (userId) {
    [register, events, intelligence] = await Promise.all([
      fetchAssetRegister(supabase, userId).catch(() => []),
      fetchAssetEvents(supabase, userId).catch(() => []),
      fetchAssetIntelligence(supabase, userId, 30).catch(() => []),
    ]);
  }

  if (!register.length) {
    try {
      register = await fetchGoogleDataCenterLocations();
    } catch {
      register = ASSET_PORTFOLIO_SEED;
    }
    intelligence = [];
  }

  let benchmarkContext = '';
  if (/benchmark|industry|average|market rate/i.test(message)) {
    benchmarkContext = await fetchTavilyBenchmark(`data center industry ${message}`);
  }

  const dataBlock = JSON.stringify({
    asset_register: trimRegister(register),
    capex_events_log: trimEvents(events),
    recent_intelligence: trimIntel(intelligence),
  });

  const historyText = history.slice(-6).map(h => `${h.role === 'user' ? 'Manager' : 'Agent'}: ${h.content}`).join('\n');

  const prompt = `ASSET REGISTER JSON (the only source of truth for facilities, financials, leases, PPAs, and events):
${dataBlock}

${benchmarkContext ? `EXTERNAL BENCHMARK CONTEXT (live web research, use only as supporting context, not as a facility source):\n${benchmarkContext}\n` : ''}
${historyText ? `CONVERSATION SO FAR:\n${historyText}\n` : ''}
Manager's question: ${message}

Answer using only the asset register data above, citing Asset ID + Name for every facility you reference.`;

  try {
    const text = await callClaudeServer({ prompt, system: SYSTEM_PROMPT, maxTokens: 1500 });
    return Response.json({ content: text });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
