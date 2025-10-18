// /api/recommend.js — live product recommendations via Shopify Storefront API

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

async function sf(query, variables = {}) {
  const url = `https://${STORE_DOMAIN}/api/2024-07/graphql.json`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await r.json();
  if (json.errors) {
    const msg = json.errors.map(e => e.message).join('; ');
    throw new Error('Storefront error: ' + msg);
  }
  return json.data;
}

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        id
        title
        handle
        tags
        featuredImage { url altText }
        images(first: 1) { nodes { url altText } }
        variants(first: 1) {
          nodes { price { amount currencyCode } }
        }
        metafield(namespace: "custom", key: "sun_exposure") { value }
        metafield(namespace: "custom", key: "flower_colour") { value }
        metafield(namespace: "custom", key: "fragrant") { value }
        metafield(namespace: "custom", key: "pollinator_friendly") { value }
        metafield(namespace: "custom", key: "cut_flower_suitable") { value }
        metafield(namespace: "custom", key: "flowering_months") { value }
      }
    }
  }
`;

function norm(v) {
  if (!v) return '';
  return String(v).toLowerCase();
}

function splitVals(v) {
  return norm(v).split(/[,/|; ]+/).filter(Boolean);
}

function scoreProduct(p, prefs) {
  let s = 0;

  // Sun exposure match
  const sun = norm(p.metafield?.sun_exposure?.value);
  if (sun && prefs.sun) {
    if (sun.includes(norm(prefs.sun))) s += 1;
    if (prefs.sun.includes('partial') && sun.includes('sun')) s += 0.5;
  }

  // Color match (weighted higher)
  const colVals = splitVals(p.metafield?.flower_colour?.value);
  if (prefs.colors?.length) {
    const wanted = prefs.colors.map(norm);
    const hits = colVals.filter(c => wanted.some(w => c.includes(w)));
    s += hits.length * 2;
  }

  // Extra options: fragrant, bee-friendly, cut flowers
  const fragrant = norm(p.metafield?.fragrant?.value);
  const pollinator = norm(p.metafield?.pollinator_friendly?.value);
  const cutFlower = norm(p.metafield?.cut_flower_suitable?.value);

  if (prefs.tags?.includes('geurig') && fragrant === 'fragrant') s += 1;
  if (prefs.tags?.includes('bijvriendelijk') && (pollinator === 'yes' || pollinator === 'true')) s += 1;
  if (prefs.tags?.includes('snijbloemen') && (cutFlower === 'suitable' || cutFlower === 'true')) s += 1;

  return s;
}

function toItem(p) {
  const firstImg = p.images?.nodes?.[0] || p.featuredImage || null;
  const priceNode = p.variants?.nodes?.[0]?.price;
  return {
    title: p.title,
    url: `https://${STORE_DOMAIN.replace('.myshopify.com', '')}.myshopify.com/products/${p.handle}`,
    price: priceNode?.amount ? Number(priceNode.amount) : null,
    currency: priceNode?.currencyCode || 'EUR',
    image: firstImg ? { url: firstImg.url, alt: firstImg.altText || p.title } : null
  };
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, message: 'Endpoint active (GET)' });

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const prefs = {
    area_m2: Number(body.area_m2 || 10),
    sun: body.sun || '',
    colors: Array.isArray(body.colors) ? body.colors : [],
    tags: Array.isArray(body.tags) ? body.tags : []
  };

  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
    return res.status(500).json({ ok: false, error: 'Missing SHOPIFY env vars' });
  }

  try {
    const data = await sf(PRODUCTS_QUERY, { first: 100 });
    const products = data?.products?.nodes || [];

    const ranked = products
      .map(p => ({ p, score: scoreProduct(p, prefs) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    const items = ranked.map(x => toItem(x.p));
    const targetBulbs = Math.round(prefs.area_m2 * 5);

    return res.status(200).json({
      ok: true,
      bundle: { items, targetBulbs }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Storefront fetch failed' });
  }
}
