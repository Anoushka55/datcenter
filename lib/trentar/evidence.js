// Trentar source register - generated, do not edit by hand.
// Regenerate with trentar-ont/src/build.py.
//
// Every PUBLIC_FACT in the ontology cites one of these ids. A source without
// a url and an asOf is not evidence, and the validator refuses it.

/**
 * @typedef {Object} Source
 * @property {string} id
 * @property {string} label
 * @property {string} publisher
 * @property {string} url
 * @property {string} asOf     ISO date the source was published or current
 */

/** @type {Source[]} */
export const sources = [
  { id: "t.ev.prnewswire", label: "Trentar signs INR 30,000 crore MoU with Maharashtra for 500 MW green integrated data centre park", publisher: "PR Newswire (Trentar Private Limited release)", url: "https://www.prnewswire.com/in/news-releases/trentar-signs-30-000-crore-3-3-bn-mou-with-maharashtra-for-500-mw-green-integrated-data-center-park-302899623.html", asOf: "2026-10-06" },
  { id: "t.ev.wmedia", label: "Trentar signs MoU for US$3.3 billion, 500 MW data center in Maharashtra", publisher: "W.Media", url: "https://w.media/trentar-signs-mou-for-us-3-3-billion-500-mw-data-center-in-maharashtra/", asOf: "2026-10-07" },
];

const byId = new Map(sources.map((s) => [s.id, s]));

/** @param {string} id */
export const getSource = (id) => byId.get(id);

/**
 * True only when the id resolves to a source carrying both a link and a date.
 * @param {string} id
 */
export function isCitable(id) {
  const s = byId.get(id);
  return Boolean(s && s.url && s.asOf);
}

