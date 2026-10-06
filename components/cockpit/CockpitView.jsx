'use client';
// A presentation cockpit for one client. Every value comes from the client's
// data file (data/cockpit/*); nothing is fetched and nothing is random.
import CockpitShell from './CockpitShell';
import Hero from './Hero';
import KpiStrip from './KpiStrip';
import MarketPanel from './MarketPanel';
import SegmentPanel from './SegmentPanel';
import GeographyPanel from './GeographyPanel';
import InsightsPanel from './InsightsPanel';
import OpportunitiesTable from './OpportunitiesTable';
import RoadmapPanel from './RoadmapPanel';
import { ENTER } from './tokens';

export default function CockpitView({ data, heroImage = null }) {
  const r1 = (i) => ENTER.row1Start + i * ENTER.row1Step;
  const r2 = (i) => ENTER.row2Start + i * ENTER.row2Step;
  return (
    <CockpitShell client={data.client}>
      <div className="h-full flex flex-col">
      <Hero client={data.client} image={heroImage} />
      <div className="flex-1 flex flex-col gap-4 min-h-0" style={{ padding: 20 }}>
        <KpiStrip kpis={data.kpis} />
        <div className="flex-1 min-h-0 grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
          <div className="grid gap-4 min-w-0 min-h-0" style={{ gridTemplateRows: 'minmax(300px, 1.04fr) minmax(300px, 1fr)' }}>
            <div className="grid gap-4 min-h-0" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.1fr) minmax(0, 0.9fr)' }}>
              <MarketPanel market={data.market} delay={r1(0)} />
              <SegmentPanel segments={data.segments} delay={r1(1)} />
              <GeographyPanel geography={data.geography} delay={r1(2)} />
            </div>
            <div className="grid gap-4 min-h-0" style={{ gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)' }}>
              <OpportunitiesTable opportunities={data.opportunities} delay={r2(0)} />
              <RoadmapPanel roadmap={data.roadmap} delay={r2(1)} />
            </div>
          </div>
          <InsightsPanel insights={data.insights} delay={r1(3)} />
        </div>
      </div>
      </div>
    </CockpitShell>
  );
}
