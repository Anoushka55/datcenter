'use client';
// Trentar Investment-Readiness Cockpit: base view.
//
// An abstract hero with the public anchors and FID counts, then the six
// cards, each with its evidence-base line. The cards are the navigation: a
// click opens that card's detail as a popup over the page, so this cockpit
// runs without the shell's sidebar or top bar. Every figure is a claim
// rendered by <ClaimValue>; this file holds ids and words, never values.
import CockpitShell from '@/components/cockpit/CockpitShell';
import Hero from './overview/Hero';
import CardGrid from './overview/CardGrid';
import DrillOverlay from './drill/DrillOverlay';
import EstateOverlay from './estate/EstateOverlay';

function Overview() {
  return (
    <div className="h-full flex flex-col overflow-auto" data-cockpit-scroll>
      <Hero />
      <div className="flex-1 min-h-0" style={{ background: 'linear-gradient(165deg, #ECEDFB 0%, #EEF1FB 45%, #F2F3FC 100%)', padding: '22px 32px 24px' }}>
        <CardGrid />
      </div>
    </div>
  );
}

export default function TrentarCockpit({ client }) {
  return (
    <CockpitShell client={client} topBar={false} sidebar={false} tagline="Preliminary Investment Intelligence">
      <div className="relative h-full">
        <Overview />
        <DrillOverlay />
        <EstateOverlay />
      </div>
    </CockpitShell>
  );
}
