// api/recommend.js
export default async function handler(req, res) {
  // CORS voor Shopify (eerst open zetten; later kun je whitelisten)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Endpoint actief (GET)' });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const { area_m2 } = body;

    // Demo-antwoord (straks vervangen door echte Shopify data)
    const demoProducts = [
      { title: 'Tulipa Yellow', price: 3.99 },
      { title: 'Hyacinthus Blue', price: 4.49 },
      { title: 'Narcissus White', price: 2.99 }
    ];

    const bundle = {
      items: demoProducts,
      targetBulbs: Math.round((area_m2 || 10) * 5)
    };

    return res.status(200).json({ ok: true, bundle, demoProducts });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
