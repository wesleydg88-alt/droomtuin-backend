// Simpele testfunctie voor Shopify App Proxy
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: "App Proxy werkt (GET)" });
  }
  const input = req.body || {};
  return res.status(200).json({ ok: true, received: input });
}
