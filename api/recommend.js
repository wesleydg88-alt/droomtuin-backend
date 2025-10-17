// /api/recommend.js — eenvoudige endpoint + CORS
const ALLOWED_ORIGINS = [
  'https://JOUWSHOP.myshopify.com', // ⬅️ vervang met jouw myshopify-domein
  'https://www.JOUWDOMEIN.nl'       // ⬅️ vervang met jouw storefront domein (optioneel)
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

  // Test GET
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Endpoint actief (GET)' });
  }

  // Demo: echo terug (vervangen we later door echte selectie)
  const input = req.body || {};
  return res.status(200).json({
    ok: true,
    received: input,
    demoProducts: [
      { title: "Tulp 'Maureen'", price: 6.95 },
      { title: "Allium 'Purple Sensation'", price: 8.95 }
    ]
  });
}
