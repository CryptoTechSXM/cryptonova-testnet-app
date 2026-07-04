/**
 * /api/gas-gift.js — ETH gas gift for coupon registrants
 *
 * POST /api/gas-gift  { "address": "0x..." }
 *
 * When a new member redeems a coupon they may have 0 ETH — they need gas
 * to call approve() + registerWithCoupon() on Base. This endpoint checks
 * their ETH balance and, if it's below MIN_ETH_THRESHOLD, sends a small
 * amount (~$0.25 worth) from the funder wallet.
 *
 * Called silently by the frontend during validateCouponCode() after a
 * valid coupon is confirmed. If this call fails for any reason the user
 * can still attempt registration — it just might fail if they truly have
 * 0 ETH. Non-critical path.
 *
 * Required Vercel env vars (reuse faucet key — same pre-funded wallet):
 *   FAUCET_PRIVATE_KEY   — pre-funded wallet, send-ETH only
 *   BASE_SEPOLIA_RPC     — RPC URL (or BASE_RPC for mainnet)
 *
 * Optional:
 *   GAS_GIFT_AMOUNT_ETH  — how much ETH to send (default: 0.0001)
 *   GAS_GIFT_MIN_ETH     — minimum balance below which gift is sent (default: 0.0005)
 *   GAS_GIFT_CHAIN_ID    — 84532 = Base Sepolia (default), 8453 = Base Mainnet
 */

import { ethers } from 'ethers';

// In-memory dedup: address → timestamp gifted
// Resets on cold start. Combined with the min-balance check this prevents spam.
const gifted = new Map();
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address } = req.body || {};
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const normalised = address.toLowerCase();

  // Dedup check: only one gift per address per 24h
  const lastGift = gifted.get(normalised);
  if (lastGift && Date.now() - lastGift < DEDUP_TTL_MS) {
    return res.status(200).json({ ok: false, reason: 'already_gifted' });
  }

  // Prefer dedicated GAS_GIFT_PRIVATE_KEY (mainnet); fall back to FAUCET_PRIVATE_KEY (testnet)
  const faucetKey = process.env.GAS_GIFT_PRIVATE_KEY || process.env.FAUCET_PRIVATE_KEY;
  if (!faucetKey) {
    console.error('[gas-gift] Neither GAS_GIFT_PRIVATE_KEY nor FAUCET_PRIVATE_KEY is set');
    return res.status(500).json({ error: 'Gas gift not configured' });
  }

  const chainId   = Number(process.env.GAS_GIFT_CHAIN_ID  || 84532);
  const rpcUrl    = process.env.BASE_SEPOLIA_RPC || process.env.BASE_RPC || 'https://sepolia.base.org';
  const giftAmt   = ethers.parseEther(process.env.GAS_GIFT_AMOUNT_ETH || '0.0001');  // ~$0.25-0.35
  const minBal    = ethers.parseEther(process.env.GAS_GIFT_MIN_ETH    || '0.0005');  // only gift if below this

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, { staticNetwork: true });
    const wallet   = new ethers.Wallet(faucetKey, provider);

    const [memberBal, funderBal] = await Promise.all([
      provider.getBalance(address),
      provider.getBalance(wallet.address),
    ]);

    // Member already has enough ETH — no gift needed
    if (memberBal >= minBal) {
      return res.status(200).json({ ok: false, reason: 'sufficient_balance', balance: ethers.formatEther(memberBal) });
    }

    // Funder wallet low
    if (funderBal < giftAmt * 2n) {
      console.error(`[gas-gift] Funder wallet low on ETH: ${ethers.formatEther(funderBal)}`);
      return res.status(503).json({ error: 'Gas gift temporarily unavailable — funder wallet low' });
    }

    // Send the gift
    const tx = await wallet.sendTransaction({
      to:    address,
      value: giftAmt,
    });
    await tx.wait(1);

    gifted.set(normalised, Date.now());

    console.log(`[gas-gift] Sent ${ethers.formatEther(giftAmt)} ETH to ${address} | tx: ${tx.hash}`);

    return res.status(200).json({
      ok:     true,
      amount: ethers.formatEther(giftAmt),
      tx:     tx.hash,
    });

  } catch (e) {
    console.error('[gas-gift] Error:', e.message);
    return res.status(500).json({ error: 'Gas gift failed: ' + (e.reason || e.message || 'unknown') });
  }
}
