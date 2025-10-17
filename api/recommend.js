// /api/recommend.js — eenvoudige endpoint + CORS (Vercel)
const ALLOWED_ORIGINS = [
  'https://z6wcmm-dm.myshopify.com', // ✅ jouw echte Shopify domein
  'https://www.JOUWDOMEIN.nl'        // optioneel: vervang later met je publieke domein
];

function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allow = ALLOWED_ORIGINS.find(o => origin && origin.startsWith(o)) || ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(req, res);

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Test GET (handig om snel te checken in de browser)
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Endpoint actief (GET)' });
  }

  // Demo echo + voorbeeldproducten (vervangen we later door echte selectie)
  const input = req.body || {};
  const { area_m2 = 10, sun = '', colors = [], tags = [] } = input;

  // heel simpele “suggestie” op basis van input (placeholder)
  const demo = [];
  if (colors.includes('purple') || colors.includes('white')) {
    demo.push({ title: "Allium 'Purple Sensation'", price: 8.95 });
  }
  demo.push({ title: "Tulp 'Maureen'", price: 6.95 });
  if (tags.includes('bijvriendelijk')) demo.push({ title: "Krokus Mix (bijvriendelijk)", price: 3.25 });

  return res.status(200).json({
    ok: true,
    received: { area_m2, sun, colors, tags },
    summary: {
      note: 'Demo-antwoord. Productlogica komt in de volgende stap.',
      estimated_total_bulbs: Math.round(area_m2 * 35)
    },
    demoProducts: demo
  });
}
