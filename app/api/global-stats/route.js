/**
 * app/api/global-stats/route.js
 *
 * Fetches real global datacenter market statistics from PeeringDB.
 * Used to enrich the dashboard with live global coverage data.
 * Cached for 1 hour to avoid hammering the API.
 */

export const revalidate = 3600; // cache 1 hour

const PEERINGDB_API = 'https://www.peeringdb.com/api';

// Key global datacenter markets to display as filters
const GLOBAL_MARKETS = [
  'United States', 'United Kingdom', 'Germany', 'Netherlands', 'France',
  'Singapore', 'Japan', 'Australia', 'India', 'Hong Kong',
  'Canada', 'Brazil', 'Sweden', 'Switzerland', 'Ireland',
  'UAE', 'South Korea', 'China', 'Spain', 'Italy',
  'Denmark', 'Norway', 'Finland', 'Poland', 'South Africa',
];

export async function GET() {
  try {
    // Fetch global facility count from PeeringDB
    const [facRes, ixRes] = await Promise.allSettled([
      fetch(`${PEERINGDB_API}/fac?depth=0&limit=1`, {
        headers: { 'User-Agent': 'EAiQ Intelligence Platform', 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      }),
      fetch(`${PEERINGDB_API}/ix?depth=0&limit=1`, {
        headers: { 'User-Agent': 'EAiQ Intelligence Platform', 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      }),
    ]);

    let globalFacilities = null;
    let globalExchanges = null;

    if (facRes.status === 'fulfilled' && facRes.value.ok) {
      const data = await facRes.value.json();
      // PeeringDB returns meta.total for count
      globalFacilities = data.meta?.total || null;
    }

    if (ixRes.status === 'fulfilled' && ixRes.value.ok) {
      const data = await ixRes.value.json();
      globalExchanges = data.meta?.total || null;
    }

    return Response.json({
      globalFacilities,
      globalExchanges,
      globalMarkets: GLOBAL_MARKETS,
      marketsCount: GLOBAL_MARKETS.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Return fallback data if PeeringDB is unreachable
    return Response.json({
      globalFacilities: null,
      globalExchanges: null,
      globalMarkets: GLOBAL_MARKETS,
      marketsCount: GLOBAL_MARKETS.length,
      timestamp: new Date().toISOString(),
    });
  }
}
