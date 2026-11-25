// lib/trentar/session.js — cockpit context that survives drill-downs.
//
// Module-level store, so the selected card, open drill-down
// outlive client navigation: returning to the cockpit restores what was
// selected. The vanilla store is exported for tests; components use the hook.
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

const CARDS = ['fid', 'site', 'power', 'regulatory', 'esg', 'commercial'];

function card(id) {
  if (!CARDS.includes(id)) throw new Error(`Unknown play card "${id}"`);
  return id;
}

export const initialSession = Object.freeze({
  selectedCard: null, // single click: highlighted on the cockpit
  openCard: null, // double click: analytical view open
  evidenceFor: null, // claim id whose evidence drawer is open
  estateOpen: false, // the estate knowledge graph view
  focus: {}, // per card: the row or item focused inside its analytical view
});

export const trentarStore = createStore((set) => ({
  ...initialSession,
  select: (id) => set({ selectedCard: card(id) }),
  open: (id) => set({ selectedCard: card(id), openCard: card(id) }),
  // A card click: opens that card's panel, or closes it if it is already open.
  toggle: (id) => set((s) => (s.openCard === card(id) ? { openCard: null } : { selectedCard: card(id), openCard: card(id) })),
  // Closing a view keeps the selection, which is the "context preserved" rule.
  close: () => set({ openCard: null }),
  openEstate: () => set({ estateOpen: true, openCard: null }),
  closeEstate: () => set({ estateOpen: false }),
  showEvidence: (claimId) => set({ evidenceFor: claimId }),
  hideEvidence: () => set({ evidenceFor: null }),
  setFocus: (id, itemId) => set((s) => ({ focus: { ...s.focus, [card(id)]: itemId } })),
  reset: () => set({ ...initialSession }),
}));

/** @template T @param {(s: ReturnType<typeof trentarStore.getState>) => T} selector */
export const useTrentarSession = (selector) => useStore(trentarStore, selector);
