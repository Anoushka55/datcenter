'use client';
// The drill-down as an in-page popup over the cockpit: dimmed backdrop, the
// panel centred, scale-from-0.98 with a fade (~200ms). Clicking the backdrop,
// Escape or the panel's close control returns to the cockpit.
import { AnimatePresence, motion } from 'framer-motion';
import { useTrentarSession } from '@/lib/trentar/session';
import DrillPanel from './DrillPanel';
import { cardHue } from '../tokens';

export default function DrillOverlay() {
  const openCard = useTrentarSession((s) => s.openCard);
  const close = useTrentarSession((s) => s.close);
  return (
    <AnimatePresence>
      {openCard && (
        <motion.div key="drill-overlay" className="absolute inset-0 z-40 flex items-center justify-center" style={{ padding: '36px 48px' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0" onClick={close} aria-hidden
            style={{ background: 'rgba(8,20,44,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
          <motion.div className="relative w-full h-full" style={{ maxWidth: 1680 }}
            initial={{ scale: 0.98 }} animate={{ scale: 1 }} exit={{ scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <DrillPanel cardId={openCard} accent={cardHue[openCard].hue} fill />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
