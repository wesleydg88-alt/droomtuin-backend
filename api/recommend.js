// /api/recommend.js — robuste CORS + simpele POST respons om fetch te testen

// --- PAS DIT AAN NAAR JOUW DOMEINEN (whitelist) ---
const ALLOWED_ORIGINS = [
  'https://z6wcmm-dm.myshopify.com',
  'https://flowerbulb.nl',
  'https://www.flowerbulb.nl'
];

// Zet deze tijdelijk op true als je 100% zeker wilt weten dat CORS de oorzaak is.
// Daarna weer op false zetten (veiliger).
const CORS_ALLOW_ALL_TEMP = false;

// CORS helper
function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const allow = CORS_ALLOW_ALL_TEMP
    ? origin || '*'
    : (ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0]);

  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  applyCors(req, res);

  // Preflight altijd beantwoorden
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Snelle check dat endpoint leeft
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Endpoint actief (GET)' });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      // ---- DEMO ANTWOORD ----
      // Als dit werkt, dan is CORS oké en je frontend fetch werkt.
      return res.status(200).json({
        ok: true,
        received: body,
        demoProducts: [
          { title: 'Tulp “Maureen”', price: 6.95 },
          { title: 'Allium “Purple Sensation”', price: 9.50 }
        ]
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e?.message || 'server error' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
