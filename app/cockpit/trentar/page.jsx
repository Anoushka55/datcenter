// Trentar Investment-Readiness Cockpit. Static and deterministic: every figure
// comes from the claim spine in lib/trentar, minted from the Trentar FID
// Decision Ontology. Opened from the EAiQ Guide by lib/trentar/matcher.js.
//
// The side-effect import mints every claim at module load, so a malformed
// ontology node fails `next build` on this route.
import '@/lib/trentar/view';
import TrentarCockpit from '@/components/trentar/TrentarCockpit';
import { trentar } from '@/data/cockpit/trentar';

export const metadata = { title: 'Trentar Investment-Readiness Cockpit — EAiQ' };

export default function TrentarCockpitPage() {
  return <TrentarCockpit client={trentar.client} />;
}
