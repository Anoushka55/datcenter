'use client';
// The six cards as rows, three across on desktop (two on tablet width, one on
// phone width, measured on the container because the cockpit shell scales
// its design canvas). A card click opens its drill-down as a popup over the
// page (see DrillOverlay); focus moves into it and returns to the card on close.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CARD_IDS } from '@/lib/trentar/view';
import { useTrentarSession } from '@/lib/trentar/session';
import PlayCard from '../PlayCard';

const GAP = 20;

function useColumns(ref) {
  const [cols, setCols] = useState(3);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth;
      setCols(w >= 1180 ? 3 : w >= 720 ? 2 : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return cols;
}

export default function CardGrid() {
  const ref = useRef(null);
  const cols = useColumns(ref);
  const openCard = useTrentarSession((s) => s.openCard);

  // Focus follows the panel: into it on open, back to the card on close.
  const lastOpen = useRef(null);
  useEffect(() => {
    if (openCard) {
      lastOpen.current = openCard;
      const t = setTimeout(() => {
        const panel = document.querySelector(`[data-drill-panel="${openCard}"]`);
        panel?.focus({ preventScroll: true });
      }, 240);
      return () => clearTimeout(t);
    }
    if (lastOpen.current) {
      document.querySelector(`article[data-card="${lastOpen.current}"]`)?.focus({ preventScroll: true });
      lastOpen.current = null;
    }
    return undefined;
  }, [openCard]);

  return (
    // Three across: two rows share the height exactly, so hero plus six cards
    // fit one 1920x1080 screen. Narrower widths fall back to scrolling rows.
    <div ref={ref} className="grid h-full" style={{ gap: GAP, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridTemplateRows: cols === 3 ? 'repeat(2, minmax(0, 1fr))' : undefined, gridAutoRows: cols === 3 ? undefined : 'minmax(330px, auto)' }}>
      {CARD_IDS.map((id, i) => <PlayCard key={id} cardId={id} delay={0.3 + i * 0.06} />)}
    </div>
  );
}
