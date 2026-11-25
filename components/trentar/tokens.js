// Trentar cockpit tokens: the presentation-cockpit palette plus per-card icons.
import { Flag, MapPin, Zap, Landmark, Leaf, Handshake, LayoutGrid } from 'lucide-react';
import { PROVENANCE_STYLE } from './ProvenanceBadge';

export { C, FONT, enter, hero, glass, cardHue, elevation, provenance, kpmg } from '@/components/cockpit/tokens';
export { PROVENANCE_STYLE };

export const CARD_ICONS = { fid: Flag, site: MapPin, power: Zap, regulatory: Landmark, esg: Leaf, commercial: Handshake };
export const OVERVIEW_ICON = LayoutGrid;

// Provenance order used everywhere: strongest evidence first.
export const PROVENANCE_ORDER = ['PUBLIC_FACT', 'EAIQ_ANALYSIS', 'ILLUSTRATIVE_SCENARIO', 'TRENTAR_INPUT_REQUIRED'];

export const PROVENANCE_MEANING = {
  PUBLIC_FACT: 'Verifiable public source',
  EAIQ_ANALYSIS: 'Derived by EAiQ, basis shown',
  ILLUSTRATIVE_SCENARIO: 'Design assumption, not a target',
  TRENTAR_INPUT_REQUIRED: "Needs Trentar's data",
};
