export const revalidate = 3600;

const PEERINGDB_API = 'https://www.peeringdb.com/api';
const PAGE_SIZE = 500;
const HEADERS = {
  'User-Agent': 'EAiQ Intelligence Platform',
  'Accept': 'application/json',
};

export async function GET() {
  try {
    const firstRes = await fetch(
      `${PEERINGDB_API}/fac?format=json&status=ok&country=IN&limit=${PAGE_SIZE}&skip=0`,
      { headers: HEADERS, next: { revalidate: 3600 } }
    );
    if (!firstRes.ok) throw new Error(`PeeringDB error: ${firstRes.status}`);

    const firstData = await firstRes.json();
    const total = firstData.meta?.total ?? 0;
    let all = [...(firstData.data ?? [])];

    // Fetch remaining pages in parallel if India has > 500 facilities
    const offsets = [];
    for (let skip = PAGE_SIZE; skip < total; skip += PAGE_SIZE) {
      offsets.push(skip);
    }

    if (offsets.length > 0) {
      const pages = await Promise.allSettled(
        offsets.map(skip =>
          fetch(`${PEERINGDB_API}/fac?format=json&status=ok&country=IN&limit=${PAGE_SIZE}&skip=${skip}`, {
            headers: HEADERS,
            next: { revalidate: 3600 },
          }).then(r => r.json())
        )
      );
      for (const page of pages) {
        if (page.status === 'fulfilled') all.push(...(page.value.data ?? []));
      }
    }

    const facilities = all
      .filter(f => f.latitude != null && f.latitude !== '' && f.longitude != null && f.longitude !== '')
      .map(f => ({
        id: f.id,
        name: f.name || '',
        city: f.city || '',
        country: 'IN',
        latitude: parseFloat(f.latitude),
        longitude: parseFloat(f.longitude),
        org_name: f.org?.name || '',
        status: f.status || 'ok',
      }))
      .filter(f => !isNaN(f.latitude) && !isNaN(f.longitude));

    return Response.json({ facilities, total: facilities.length });
  } catch {
    return Response.json({ facilities: [], total: 0 });
  }
}
