// /api/recommend.js
const ALLOWED_ORIGINS = [
  'https://z6wcmm-dm.myshopify.com',
  'https://flowerbulb.nl',
  'https://www.flowerbulb.nl'
];

function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allow = ALLOWED_ORIGINS.find(o => origin.startsWith(o));
  res.setHeader('Access-Control-Allow-Origin', allow || ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;      // z6wcmm-dm.myshopify.com
const SF_TOKEN     = process.env.SHOPIFY_STOREFRONT_TOKEN;  // uit Shopify (Storefront token)
const API_VERSION  = '2024-07';
const SF_URL       = `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`;

// Metafield-keys (pas aan als jouw shop andere keys gebruikt)
const MF = {
  ns: 'custom',
  sun: 'sun_exposure',
  color: 'flower_colour',
  fragrant: 'fragrant',
  pollinator: 'pollinator_friendly',
  cut: 'cut_flower_suitable',
  flowering: 'flowering_months',
};

const QUERY = `
query Products($first:Int!, $after:String) {
  products(first:$first, after:$after, sortKey:BEST_SELLING) {
    edges {
      cursor
      node {
        id title handle tags
        images(first:1){ edges{ node{ url altText } } }
        priceRange{ minVariantPrice{ amount currencyCode } }
        metafields(identifiers:[
          {namespace:"${MF.ns}", key:"${MF.sun}"},
          {namespace:"${MF.ns}", key:"${MF.color}"},
          {namespace:"${MF.ns}", key:"${MF.fragrant}"},
          {namespace:"${MF.ns}", key:"${MF.pollinator}"},
          {namespace:"${MF.ns}", key:"${MF.cut}"},
          {namespace:"${MF.ns}", key:"${MF.flowering}"}
        ]) { key value }
      }
    }
    pageInfo{ hasNextPage endCursor }
  }
}
`;

async function sfFetch(query, variables = {}) {
  const r = await fetch(SF_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SF_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  if (!r.ok) throw new Error(`Storefront HTTP ${r.status}`);
  const json = await r.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const norm = s => (s || '').toString().trim().toLowerCase();
const mval = (p, key) => (p.metafields || []).find(m => m.key === key)?.value || '';

function score(p, input) {
  let s = 0;
  const sun = norm(mval(p, MF.sun));                  // bv. "sun/partial shade"
  const colors = mval(p, MF.color).split(/[,/|]+/).map(norm);
  const fragrant = norm(mval(p, MF.fragrant));
  const poll = norm(mval(p, MF.pollinator));
  const cut = norm(mval(p, MF.cut));

  if (!input.sun || sun.includes(norm(input.sun))) s += 1;
  if (input.colors?.length) {
    const wanted = input.colors.map(norm);
    if (wanted.some(c => colors.includes(c))) s += 2;
  }
  if (input.tags?.includes('geurig'))      s += ['fragrant','yes','ja','true'].includes(fragrant) ? 1 : -1;
  if (input.tags?.includes('bijvriendelijk')) s += ['yes','ja','true','bijvriendelijk'].includes(poll) ? 1 : -1;
  if (input.tags?.includes('snijbloemen')) s += ['suitable','yes','ja','true'].includes(cut) ? 1 : -1;

  return s;
}

function toCard(node) {
  const img = node.images?.edges?.[0]?.node;
  const price = node.priceRange?.minVariantPrice;
  return {
    title: node.title,
    url: `https://${STORE_DOMAIN}/products/${node.handle}`,
    price: price ? Number(price.amount) : null,
    currency: price?.currencyCode || 'EUR',
    image: img ? { url: img.url, alt: img.altText || node.title } : null
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ ok:true, message:'Endpoint actief (GET)' });

  try {
    if (!STORE_DOMAIN || !SF_TOKEN) {
      return res.status(500).json({ ok:false, error:'Env vars ontbreken' });
    }

    const input = req.body || {};
    let edges = []; let after = null;

    // haal ±200 producten (2x 100)
    for (let i = 0; i < 2; i++) {
      const data = await sfFetch(QUERY, { first: 100, after });
      edges = edges.concat(data.products.edges || []);
      if (!data.products.pageInfo.hasNextPage) break;
      after = data.products.pageInfo.endCursor;
    }

    const ranked = edges.map(e => ({ node: e.node, score: score(e.node, input) }))
                        .filter(x => x.score >= 0)
                        .sort((a,b) => b.score - a.score);

    const items = ranked.slice(0, 12).map(x => toCard(x.node));
    const bulbsPerM2 = 35;
    const targetBulbs = Math.max(10, Math.round((input.area_m2 || 10) * bulbsPerM2));

    return res.status(200).json({ ok:true, received:input, bundle:{ targetBulbs, items } });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e?.message || 'server error' });
  }
}
