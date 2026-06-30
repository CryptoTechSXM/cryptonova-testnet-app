// api/verify-coupon.js — Early Access coupon gate for early.crypto-nova.app
// Env var: EA_COUPON_CODES = "CODE1,CODE2,CODE3" (set in Vercel project settings)

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing code' });
  }

  const rawCodes = process.env.EA_COUPON_CODES || '';
  if (!rawCodes) {
    // No codes configured — deny all
    return res.status(200).json({ ok: false, error: 'No codes active' });
  }

  const validCodes = rawCodes.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
  const submitted  = code.trim().toUpperCase();

  if (validCodes.includes(submitted)) {
    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: false, error: 'Invalid code — check with your leader.' });
}
