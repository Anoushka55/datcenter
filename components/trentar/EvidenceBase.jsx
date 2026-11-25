'use client';
// What a card rests on: "4 public facts · 3 EAiQ analyses · 1 illustrative".
// Only what is on screen is counted, so nothing here measures what is missing.
// The swatches repeat the line-style vocabulary (solid, dotted, hatched) so
// the line reads in greyscale; each count is a claim with its counting rule.
import ClaimValue from './ClaimValue';
import { provenance as STYLE } from './tokens';

export default function EvidenceBase({ items, size = 12 }) {
  return (
    <p data-meter-caption className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ fontSize: size, color: '#46648A' }} aria-label="What this card rests on">
      {items.map(({ provenance: p, claim }, i) => (
        <span key={p} className="inline-flex items-center gap-1.5">
          {i > 0 && <span aria-hidden style={{ color: '#B6C3D6', marginRight: 2 }}>·</span>}
          <span aria-hidden className="inline-block rounded-sm flex-shrink-0" style={{ width: 9, height: 9, boxSizing: 'border-box', ...STYLE[p].fill }} />
          <ClaimValue claim={claim} variant="inline" />
        </span>
      ))}
    </p>
  );
}
