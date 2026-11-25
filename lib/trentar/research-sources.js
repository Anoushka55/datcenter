// Cockpit-level source register for EAiQ research content. Sits beside the
// generated evidence.js and follows the same rule: a source without a url and
// a date is not evidence. Hand-maintained (evidence.js is not).
//
// The cockpit cites only this register, so it has no runtime dependency on
// the generated ontology or its evidence.js. The Trentar release and the
// W.Media report appear here as src.prn and src.wmedia (the same documents
// evidence.js lists as t.ev.prnewswire and t.ev.wmedia).
//
// Checked 25 Nov 2026 against the live pages and refreshed to the latest
// sources found. Retired as superseded: the Dec 2025 Analytics India Magazine
// market figures (now Cushman & Wakefield H1 2026) and the 2023 IT-ITeS
// policy summary (now the June 2026 notification and green-park GR).

/** @type {{ id: string, label: string, publisher: string, url: string, asOf: string }[]} */
export const researchSources = [
  {
    id: 'src.prn',
    label: 'Trentar signs INR 30,000 crore MoU with Maharashtra for 500 MW green integrated data centre park',
    publisher: 'PR Newswire (Trentar Private Limited release)',
    url: 'https://www.prnewswire.com/in/news-releases/trentar-signs-30-000-crore-3-3-bn-mou-with-maharashtra-for-500-mw-green-integrated-data-center-park-302899623.html',
    asOf: '2026-10-06',
  },
  {
    id: 'src.wmedia',
    label: 'Trentar signs MoU for US$3.3 billion, 500 MW data center in Maharashtra',
    publisher: 'W.Media',
    url: 'https://w.media/trentar-signs-mou-for-us-3-3-billion-500-mw-data-center-in-maharashtra/',
    asOf: '2026-10-07',
  },
  {
    id: 'src.cw2026',
    label: 'India Data Centre H1 2026 Update',
    publisher: 'Cushman & Wakefield',
    url: 'https://www.cushmanwakefield.com/en/india/news/2026/09/india-data-centre-h1-2026-update',
    asOf: '2026-09-23',
  },
  {
    id: 'src.cwapac',
    label: 'Mumbai continues to dominate India\u2019s DC scene: Cushman & Wakefield report (Q4 2025 data)',
    publisher: 'W.Media',
    url: 'https://w.media/mumbai-continues-to-dominate-indias-dc-scene-cushman-wakefield-report/',
    asOf: '2026-03-11',
  },
  {
    id: 'src.carnegie',
    label: 'India\u2019s stake in the global subsea cable race',
    publisher: 'Carnegie Endowment for International Peace',
    url: 'https://carnegieendowment.org/research/2026/07/indias-stake-in-the-global-subsea-cable-race',
    asOf: '2026-07-23',
  },
  {
    id: 'src.iba',
    label: 'Green data centres in India: policy meets practice',
    publisher: 'International Bar Association',
    url: 'https://www.ibanet.org/green-data-centres-in-India-policy-meets-practice',
    asOf: '2026-08-12',
  },
  {
    id: 'src.ppd',
    label: 'Maharashtra expands green data center park policy statewide (GR of 9 June 2026)',
    publisher: 'Power Peak Digest',
    url: 'https://powerpeakdigest.com/maharashtra-green-data-center-policy-expansion/',
    asOf: '2026-06-15',
  },
  {
    id: 'src.duty',
    label: 'Notification on electricity duty exemptions for IT, ITeS and data centre units under the Maharashtra IT/ITeS Policy 2023 (22 June 2026)',
    publisher: 'TeamLease RegTech',
    url: 'https://teamleaseregtech.com/updates/article/57168/govt-of-maharashtra-issued-a-notification-regarding-electricity-duty-e/',
    asOf: '2026-06-24',
  },
  {
    id: 'src.tnt',
    label: 'India among top data centre markets; Mumbai costs among lowest globally (Turner & Townsend Data Centre Construction Cost Index 2025)',
    publisher: 'IBEF',
    url: 'https://www.ibef.org/news/india-among-top-data-centre-markets-mumbai-costs-among-lowest-globally',
    asOf: '2025-11-11',
  },
  {
    id: 'src.savills',
    label: 'India\u2019s data centre capacity additions surged 59% in H1 (Savills)',
    publisher: 'Gulf Today',
    url: 'https://www.gulftoday.ae/opinion/2026/08/01/indias-data-centre-capacity-additions-surged-59-in-h1',
    asOf: '2026-08-01',
  },
  {
    id: 'src.kakodkar',
    label: 'Maharashtra expands data centre network, sets up panel to assess environmental impact (via Hindustan Times)',
    publisher: 'Re-Mumbai',
    url: 'https://remumbai.in/2026/10/13/maharashtra-expands-data-centre-network-sets-up-panel-to-assess-environmental-impact/',
    asOf: '2026-10-13',
  },
  {
    id: 'src.fpj',
    label: 'Maharashtra to soon have a data centre policy to regulate sites, water consumption, noise pollution and heat generation',
    publisher: 'Free Press Journal',
    url: 'https://www.freepressjournal.in/mumbai/maharashtra-to-soon-have-a-data-centre-policy-to-regulate-sites-water-consumption-noise-pollution-heat-generation',
    asOf: '2026-09-07',
  },
  {
    id: 'src.kotak',
    label: 'Data centre development cost in India at USD 7 per watt, among global lowest (Kotak Mutual Fund report)',
    publisher: 'Tribune India / ANI',
    url: 'https://www.tribuneindia.com/news/business/data-centre-development-cost-in-india-at-usd-7-per-watt-among-global-lowest-shows-strong-growth-potential-report',
    asOf: '2025-09-16',
  },
];
