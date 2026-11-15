/**
 * app/api/facility/route.js
 *
 * Fetches real live data from PeeringDB (free, no API key needed)
 * for a specific datacenter facility, then asks Claude to summarize
 * what it finds alongside the existing facility data.
 *
 * Called when user clicks "Ask AI about this facility" on the map.
 */

const PEERINGDB_API = 'https://www.peeringdb.com/api';

async function fetchPeeringDBFacility(name, city) {
  try {
    // Search by city first (more reliable than name matching)
    const res = await fetch(
      `${PEERINGDB_API}/fac?city=${encodeURIComponent(city)}&depth=2`,
      {
        headers: {
          'User-Agent': 'EAiQ Datacenter Intelligence Platform',
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 }, // cache 1 hour
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data?.length) return null;

    // Find best match by name similarity
    const facilities = data.data;
    const nameLower = name.toLowerCase();
    const match =
      facilities.find(f => f.name?.toLowerCase().includes(nameLower.split(' ')[0])) ||
      facilities[0];

    return {
      peeringdb_id: match.id,
      name: match.name,
      aka: match.aka,
      website: match.website,
      clli: match.clli,
      renew_fy: match.renew_fy,
      npanxx: match.npanxx,
      tech_phone: match.tech_phone,
      org: match.org?.name,
      address: `${match.address1}, ${match.city}, ${match.state || ''} ${match.zipcode}, ${match.country}`,
      latitude: match.latitude,
      longitude: match.longitude,
      region_continent: match.region_continent,
      status: match.status,
      ix_count: match.ix_count,       // number of internet exchanges
      net_count: match.net_count,     // number of networks present
      url_stats: match.url_stats,
      notes: match.notes,
    };
  } catch {
    return null;
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, city, country, existingData } = body;

  if (!name || !city) {
    return Response.json({ error: 'name and city required' }, { status: 400 });
  }

  // Fetch live PeeringDB data
  const liveData = await fetchPeeringDBFacility(name, city);

  // Build enriched context for Claude
  const prompt = `You are analyzing a real datacenter facility using both our internal data and live PeeringDB data.

## Internal Facility Data
${existingData}

${liveData ? `## Live PeeringDB Data (real-time)
- PeeringDB ID: ${liveData.peeringdb_id}
- Registered Name: ${liveData.name}
- Organisation: ${liveData.org || 'N/A'}
- Address: ${liveData.address}
- Internet Exchanges present: ${liveData.ix_count ?? 'N/A'}
- Networks present: ${liveData.net_count ?? 'N/A'}
- Status: ${liveData.status}
- Region: ${liveData.region_continent}
- Notes: ${liveData.notes || 'None'}
` : '## PeeringDB Data\nNo match found in PeeringDB for this facility.'}

Provide a concise 3-paragraph intelligence briefing on this facility:
1. Operational status and connectivity significance (use PeeringDB data if available)
2. Key strengths and strategic position in its market
3. One key risk or consideration for potential tenants or investors

Keep it sharp, data-driven, under 200 words total.`;

  if (!process.env.ANTHROPIC_API_KEY) {
    // Return raw data even without AI summary
    return Response.json({ liveData, summary: null });
  }

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const claudeData = await claudeRes.json();
    const summary = claudeData.content?.[0]?.text || null;

    return Response.json({ liveData, summary });
  } catch {
    return Response.json({ liveData, summary: null });
  }
}
