/**
 * /api/gas-gift-address.js — Returns the gas gift wallet's public address
 *
 * GET /api/gas-gift-address
 *
 * The gas gift wallet address is not a secret — it's a receive-only address.
 * We expose it via API so the frontend can prompt the coupon issuer to send
 * a small amount of ETH to it during coupon issuance, topping up the pool
 * that funds gas gifts for incoming members.
 *
 * Derives the address from FAUCET_PRIVATE_KEY (never returns the key itself).
 * Falls back to GAS_GIFT_WALLET_ADDR env var if set directly.
 *
 * Required Vercel env var (one of):
 *   FAUCET_PRIVATE_KEY    — derives address from key (preferred)
 *   GAS_GIFT_WALLET_ADDR  — override: use this address directly
 */

import { ethers } from 'ethers';

let _cached = null; // cache the derived address for the lifetime of this function instance

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1h in browser/CDN

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Use override if set
  if (process.env.GAS_GIFT_WALLET_ADDR) {
    return res.status(200).json({ address: process.env.GAS_GIFT_WALLET_ADDR });
  }

  const faucetKey = process.env.FAUCET_PRIVATE_KEY;
  if (!faucetKey) {
    return res.status(503).json({ error: 'Gas gift not configured' });
  }

  if (!_cached) {
    try {
      _cached = new ethers.Wallet(faucetKey).address;
    } catch(e) {
      return res.status(500).json({ error: 'Invalid key configuration' });
    }
  }

  return res.status(200).json({ address: _cached });
}
