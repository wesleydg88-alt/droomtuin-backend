// /api/recommend.js — ruimer CORS voor test
const ALLOWED_ORIGINS = [
  'https://z6wcmm-dm.myshopify.com',
  'https://z6wcmm-dm.myshopify.com/admin',  // Theme editor preview
  'https://z6wcmm-dm.myshopify.com/?',      // preview urls met query
  'https://www.JOUWDOMEIN.nl'               // optioneel: je storefront
];

function setCors(req, res) {
  const origin = req.headers.origin || '';
  // Voor nu: sta alle origins toe als origin onbekend (preview/iframes)
  const allow =
    (origin && (ALLOWED_ORIGINS.some(o => origin.startsWith(o)) ? origin : origin)) || '*';

  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Endpoint actief (GET)' });
  }

  try {
    const { area_m2 = 10, sun = '', colors = [], tags = [] } = req.body || {};
    const demo = [];
    if (colors.includes('purple') || colors.includes('white')) {
      demo.push({ title: "Allium 'Purple Sensation'", price: 8.95 });
    }
    demo.push({ title: "Tulp 'Maureen'", price: 6.95 });
    if (tags.includes('bijvriendelijk')) demo.push({ title: "Krokus Mix (bijvriendelijk)", price: 3.25 });

    return res.status(200).json({
      ok: true,
      received: { area_m2, sun, colors, tags },
      summary: { note: 'Demo-antwoord', estimated_total_bulbs: Math.round(area_m2 * 35) },
      demoProducts: demo
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'server error' });
  }
}
