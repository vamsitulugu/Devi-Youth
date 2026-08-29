// Sample data shaped exactly like the Supabase tables described in the
// project brief (announcements, events, committee_members, laddu_auctions,
// lottery, lottery_prizes, lottery_winners, photo_albums, photos, contacts).
// This lets Phase 1 pages render real-looking content before Phase 2 wires
// up Supabase — swapping this module for live queries later is a drop-in.

export const festival = {
  year: 2026,
  name: { en: 'Ganesh Chaturthi', te: 'గణేష్ చతుర్థి' },
  village: { en: 'Our Village', te: 'మన గ్రామం' },
  dates: { en: '14 Sep – 24 Sep 2026', te: 'సెప్టెంబర్ 14 – 24, 2026' },
  startDate: '2026-09-14',
  endDate: '2026-09-24',
  publicDonationTotal: '₹8,50,000',
};

export const announcements = [
  {
    id: 'a1',
    important: true,
    date: '2026-09-13',
    title: { en: "Tomorrow's Annadanam at 12:30 PM", te: 'రేపు మధ్యాహ్నం 12:30కి అన్నదానం' },
    body: {
      en: 'Annadanam will begin at 12:30 PM near the temple. Everyone from the village is welcome.',
      te: 'అన్నదానం ఆలయం సమీపంలో మధ్యాహ్నం 12:30కి ప్రారంభమవుతుంది. గ్రామస్తులందరూ ఆహ్వానితులే.',
    },
    image: null,
  },
  {
    id: 'a2',
    important: false,
    date: '2026-09-12',
    title: { en: 'Cultural program registrations open', te: 'సాంస్కృతిక కార్యక్రమ నమోదులు ప్రారంభం' },
    body: {
      en: 'Children and youth interested in performing can register with the committee by Friday.',
      te: 'ప్రదర్శన ఇవ్వాలనుకునే పిల్లలు, యువత శుక్రవారంలోగా కమిటీ వద్ద నమోదు చేసుకోవచ్చు.',
    },
    image: null,
  },
  {
    id: 'a3',
    important: false,
    date: '2026-09-10',
    title: { en: 'Idol procession route finalized', te: 'ఊరేగింపు మార్గం ఖరారు' },
    body: {
      en: 'The immersion procession will start from the temple and proceed via the main road to the tank.',
      te: 'నిమజ్జన ఊరేగింపు ఆలయం నుండి ప్రధాన రహదారి మీదుగా చెరువు వరకు సాగుతుంది.',
    },
    image: null,
  },
];

export const events = [
  {
    id: 'e1',
    date: '2026-09-14',
    time: '9:00 AM',
    title: { en: 'Idol Prathishta (Installation)', te: 'ప్రతిష్ఠ (విగ్రహ ప్రతిష్ఠాపన)' },
    location: { en: 'Village Temple Mandapam', te: 'గ్రామ ఆలయ మండపం' },
    description: {
      en: 'Ceremonial installation of the Ganesh idol with Vedic rites.',
      te: 'వేద మంత్రోచ్ఛారణలతో గణేష్ విగ్రహ ప్రతిష్ఠాపన.',
    },
  },
  {
    id: 'e2',
    date: '2026-09-16',
    time: '6:30 PM',
    title: { en: 'Cultural Program', te: 'సాంస్కృతిక కార్యక్రమం' },
    location: { en: 'Community Grounds', te: 'కమ్యూనిటీ మైదానం' },
    description: { en: 'Dance and music performances by village children.', te: 'గ్రామ పిల్లల నృత్య, సంగీత ప్రదర్శనలు.' },
  },
  {
    id: 'e3',
    date: '2026-09-20',
    time: '12:30 PM',
    title: { en: 'Annadanam', te: 'అన్నదానం' },
    location: { en: 'Temple Courtyard', te: 'ఆలయ ప్రాంగణం' },
    description: { en: 'Community lunch offered to all visitors.', te: 'సందర్శకులందరికీ సామూహిక భోజన సేవ.' },
  },
  {
    id: 'e4',
    date: '2026-09-24',
    time: '4:00 PM',
    title: { en: 'Immersion Procession', te: 'నిమజ్జన ఊరేగింపు' },
    location: { en: 'Temple to Village Tank', te: 'ఆలయం నుండి గ్రామ చెరువు వరకు' },
    description: { en: 'Grand procession concluding at the village tank.', te: 'గ్రామ చెరువు వద్ద ముగిసే గొప్ప ఊరేగింపు.' },
  },
];

export const committee = [
  { id: 'c1', name: 'K. Venkata Rao', position: { en: 'President', te: 'అధ్యక్షుడు' }, phone: '+919000000001' },
  { id: 'c2', name: 'S. Lakshmi Devi', position: { en: 'Secretary', te: 'కార్యదర్శి' }, phone: '+919000000002' },
  { id: 'c3', name: 'M. Ramesh', position: { en: 'Treasurer', te: 'కోశాధికారి' }, phone: '+919000000003' },
  { id: 'c4', name: 'P. Anitha', position: { en: 'Cultural Coordinator', te: 'సాంస్కృతిక సమన్వయకర్త' }, phone: '+919000000004' },
];

export const laddu = {
  current: {
    year: 2026,
    title: { en: 'Grand Laddu 2026', te: 'గ్రాండ్ లడ్డు 2026' },
    image: null,
    startingPrice: '₹21,000',
    finalPrice: null,
    winner: null,
    date: '2026-09-22',
    time: '7:00 PM',
    location: { en: 'Temple Mandapam', te: 'ఆలయ మండపం' },
  },
  history: [
    { year: 2025, finalPrice: '₹1,05,000', winner: 'G. Suresh Babu' },
    { year: 2024, finalPrice: '₹86,000', winner: 'T. Nagaraju' },
    { year: 2023, finalPrice: '₹72,500', winner: 'B. Sita Mahalakshmi' },
  ],
};

export const lottery = {
  drawDate: '2026-09-23',
  drawTime: '6:00 PM',
  location: { en: 'Community Grounds', te: 'కమ్యూనిటీ మైదానం' },
  prizes: [
    { id: 'p1', name: { en: 'First Prize — Two-Wheeler', te: 'ప్రథమ బహుమతి — ద్విచక్ర వాహనం' }, value: '₹85,000', image: null },
    { id: 'p2', name: { en: 'Second Prize — Gold Coin', te: 'ద్వితీయ బహుమతి — బంగారు నాణెం' }, value: '₹15,000', image: null },
    { id: 'p3', name: { en: 'Third Prize — Mixer Grinder', te: 'తృతీయ బహుమతి — మిక్సర్ గ్రైండర్' }, value: '₹4,500', image: null },
    { id: 'p4', name: { en: 'Fourth Prize — Steel Cookware Set', te: 'నాలుగవ బహుమతి — స్టీల్ వంటపాత్రల సెట్' }, value: '₹2,500', image: null },
  ],
  winners: [], // populated by the committee after the physical draw
  history: [
    { year: 2025, topPrize: { en: 'Two-Wheeler', te: 'ద్విచక్ర వాహనం' }, winner: 'D. Krishna Murthy' },
    { year: 2024, topPrize: { en: 'Gold Coin', te: 'బంగారు నాణెం' }, winner: 'V. Padmavathi' },
  ],
};

export const galleryYears = [2026, 2025, 2024];

export const galleryPhotos = {
  2026: [
    { id: 'g1', album: { en: 'Prathishta', te: 'ప్రతిష్ఠ' } },
    { id: 'g2', album: { en: 'Cultural Program', te: 'సాంస్కృతిక కార్యక్రమం' } },
    { id: 'g3', album: { en: 'Annadanam', te: 'అన్నదానం' } },
    { id: 'g4', album: { en: 'Procession', te: 'ఊరేగింపు' } },
    { id: 'g5', album: { en: 'Pooja', te: 'పూజ' } },
    { id: 'g6', album: { en: 'Immersion', te: 'నిమజ్జనం' } },
  ],
  2025: [
    { id: 'g7', album: { en: 'Events', te: 'కార్యక్రమాలు' } },
    { id: 'g8', album: { en: 'Photos', te: 'ఫోటోలు' } },
    { id: 'g9', album: { en: 'Procession', te: 'ఊరేగింపు' } },
  ],
  2024: [
    { id: 'g10', album: { en: 'Pooja', te: 'పూజ' } },
    { id: 'g11', album: { en: 'Cultural Program', te: 'సాంస్కృతిక కార్యక్రమం' } },
  ],
};

export const history = [
  {
    year: 2026,
    highlight: { en: 'Record turnout with a new cultural stage.', te: 'కొత్త సాంస్కృతిక వేదికతో రికార్డు స్థాయి హాజరు.' },
  },
  {
    year: 2025,
    highlight: {
      en: 'Village tank ghat renovated ahead of the immersion procession.',
      te: 'నిమజ్జన ఊరేగింపుకు ముందు గ్రామ చెరువు ఘాట్ పునరుద్ధరణ.',
    },
  },
  {
    year: 2024,
    highlight: { en: 'First year of the youth cultural program.', te: 'యువజన సాంస్కృతిక కార్యక్రమం ప్రారంభమైన మొదటి సంవత్సరం.' },
  },
];

export const contacts = [
  { id: 'ct1', name: 'K. Venkata Rao', role: { en: 'Committee President', te: 'కమిటీ అధ్యక్షుడు' }, phone: '+919000000001' },
  { id: 'ct2', name: 'S. Lakshmi Devi', role: { en: 'Committee Secretary', te: 'కమిటీ కార్యదర్శి' }, phone: '+919000000002' },
  { id: 'ct3', name: 'Village Temple Office', role: { en: 'Temple Office', te: 'ఆలయ కార్యాలయం' }, phone: '+919000000005' },
  { id: 'ct4', name: 'Local Police Station', role: { en: 'Emergency', te: 'అత్యవసర సేవలు' }, phone: '100' },
];
