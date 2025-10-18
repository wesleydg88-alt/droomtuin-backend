// /api/recommend.js — robuste CORS + simpele POST respons (test)

// Whitelist jouw domeinen
const ALLOWED_ORIGINS = [
  'https://z6wcmm-dm.myshopify.com',
  'https://flowerbulb.nl',
  'https://www.flowerbulb.nl'
];

// Zet tijdelijk op true als je CORS wil uitsluiten tijdens testen
const CORS_ALLOW_ALL_TEMP = false;

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const allow = CORS_ALLOW_ALL_TEMP
    ? (origin || '*')
    : (ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Endpoint actief (GET)' });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    return res.status(200).json({
      ok: true,
      received: body,
      demoProducts: [
        { title: 'Tulp “Maureen”', price: 6.95 },
        { title: 'Allium “Purple Sensation”', price: 9.50 }
      ]
    });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
