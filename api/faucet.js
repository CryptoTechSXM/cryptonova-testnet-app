/**
 * /api/faucet.js — CryptoNova Testnet USDC Faucet
 *
 * POST /api/faucet  { "address": "0x..." }
 *
 * Sends test USDC to any wallet that hasn't already claimed, by transferring
 * out of a pre-funded faucet wallet — the SAME wallet/key the Telegram bot's
 * faucet uses (api/telegram-qa.js). Deliberately does NOT use the deployer
 * key for anything on this site; that key never touches a web-facing endpoint.
 * Rate-limited to 1 claim per wallet (in-memory; resets on cold start).
 *
 * Required Vercel env vars (already set for the Telegram bot — reused here):
 *   FAUCET_PRIVATE_KEY    — pre-funded wallet, plain ERC-20 transfer() only
 *   BASE_SEPOLIA_RPC      — e.g. https://sepolia.base.org
 *
 * Optional:
 *   FAUCET_AMOUNT_USDC    — how much to send per claim (default: 20, matches bot)
 */

import { ethers } from 'ethers';

const USDC_ADDRESS  = '0x2D8B7b5eDec96bE441b6fb0D45D74a2BcE2C639a';
const USDC_ABI       = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
];

// In-memory rate-limit store: address → true
// Resets on Vercel cold start, which is fine for testnet
const claimed = new Map();

export default async function handler(req, res) {
  // CORS — allow v8.crypto-nova.app, early.crypto-nova.app, and localhost
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

  if (claimed.has(normalised)) {
    return res.status(429).json({ error: 'This wallet has already claimed testnet USDC.' });
  }

  const faucetKey = process.env.FAUCET_PRIVATE_KEY;
  if (!faucetKey) {
    console.error('FAUCET_PRIVATE_KEY not set in Vercel env');
    return res.status(500).json({ error: 'Faucet not configured' });
  }

  const rpcUrl = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
  const amount = BigInt(Number(process.env.FAUCET_AMOUNT_USDC || 20) * 1_000_000); // 6 decimals

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl, 84532, { staticNetwork: true });
    const wallet   = new ethers.Wallet(faucetKey, provider);
    const usdc     = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

    const faucetBal = await usdc.balanceOf(wallet.address);
    if (faucetBal < amount) {
      console.error(`Faucet wallet low on USDC: has ${Number(faucetBal) / 1e6}, needs ${Number(amount) / 1e6}`);
      return res.status(503).json({ error: 'Faucet is temporarily out of test USDC — try the Telegram bot or check back later.' });
    }

    const tx = await usdc.transfer(address, amount, { gasLimit: 100_000 });
    await tx.wait(1);

    // Mark as claimed only after successful TX
    claimed.set(normalised, true);

    console.log(`Faucet: sent ${Number(amount) / 1e6} USDC to ${address} | tx: ${tx.hash}`);

    return res.status(200).json({
      success: true,
      amount:  `$${Number(amount) / 1e6}`,
      tx:      tx.hash,
      message: `$${Number(amount) / 1e6} test USDC sent to ${address}`,
    });

  } catch (e) {
    console.error('Faucet error:', e.message);
    return res.status(500).json({ error: 'Faucet TX failed: ' + (e.reason || e.message || 'unknown') });
  }
}
