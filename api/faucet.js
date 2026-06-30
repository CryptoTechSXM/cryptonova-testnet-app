/**
 * /api/faucet.js — CryptoNova Testnet Faucet (USDC + ETH gas)
 *
 * POST /api/faucet  { "address": "0x..." }
 *
 * Sends test USDC AND a small amount of Base Sepolia ETH (for gas) to any
 * wallet that hasn't already claimed, out of a pre-funded faucet wallet —
 * the SAME wallet/key the Telegram bot's faucet uses (api/telegram-qa.js).
 * Deliberately does NOT use the deployer key for anything on this site;
 * that key never touches a web-facing endpoint.
 *
 * Without the ETH leg, a brand new tester could claim USDC but have nothing
 * to pay gas with for approve()/register() — still stuck. Mirrors the bot's
 * sendFaucetFunds() behavior (ETH first, then USDC).
 *
 * Rate-limited to 1 claim per wallet (in-memory; resets on cold start).
 *
 * Required Vercel env vars (already set for the Telegram bot — reused here):
 *   FAUCET_PRIVATE_KEY    — pre-funded wallet, plain ERC-20 transfer() + sendTransaction() only
 *   BASE_SEPOLIA_RPC      — e.g. https://sepolia.base.org
 *
 * Optional:
 *   FAUCET_AMOUNT_USDC    — how much USDC to send per claim (default: 20, matches bot)
 *   FAUCET_AMOUNT_ETH     — how much ETH to send per claim (default: 0.002, matches bot)
 */

import { ethers } from 'ethers';

const USDC_ADDRESS = '0x2D8B7b5eDec96bE441b6fb0D45D74a2BcE2C639a';
const USDC_ABI      = [
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
    return res.status(429).json({ error: 'This wallet has already claimed testnet funds.' });
  }

  const faucetKey = process.env.FAUCET_PRIVATE_KEY;
  if (!faucetKey) {
    console.error('FAUCET_PRIVATE_KEY not set in Vercel env');
    return res.status(500).json({ error: 'Faucet not configured' });
  }

  const rpcUrl    = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
  const usdcAmt   = BigInt(Number(process.env.FAUCET_AMOUNT_USDC || 20) * 1_000_000); // 6 decimals
  const ethAmt    = ethers.parseEther(process.env.FAUCET_AMOUNT_ETH || '0.002');

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl, 84532, { staticNetwork: true });
    const wallet   = new ethers.Wallet(faucetKey, provider);
    const usdc     = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

    const [usdcBal, ethBal] = await Promise.all([
      usdc.balanceOf(wallet.address),
      provider.getBalance(wallet.address),
    ]);

    if (usdcBal < usdcAmt) {
      console.error(`Faucet wallet low on USDC: has ${Number(usdcBal) / 1e6}, needs ${Number(usdcAmt) / 1e6}`);
      return res.status(503).json({ error: 'Faucet is temporarily out of test USDC — try the Telegram bot or check back later.' });
    }
    if (ethBal < ethAmt) {
      console.error(`Faucet wallet low on ETH: has ${ethers.formatEther(ethBal)}, needs ${ethers.formatEther(ethAmt)}`);
      return res.status(503).json({ error: 'Faucet is temporarily out of test ETH — try the Telegram bot or check back later.' });
    }

    // ETH first (so the wallet can pay gas for the USDC approve/register that follows)
    const ethTx = await wallet.sendTransaction({ to: address, value: ethAmt });
    await ethTx.wait(1);
    console.log(`Faucet: sent ${ethers.formatEther(ethAmt)} ETH to ${address} | tx: ${ethTx.hash}`);

    const usdcTx = await usdc.transfer(address, usdcAmt, { gasLimit: 100_000 });
    await usdcTx.wait(1);
    console.log(`Faucet: sent ${Number(usdcAmt) / 1e6} USDC to ${address} | tx: ${usdcTx.hash}`);

    // Mark as claimed only after both TXs succeed
    claimed.set(normalised, true);

    return res.status(200).json({
      success:  true,
      amount:   `$${Number(usdcAmt) / 1e6}`,
      ethAmount: ethers.formatEther(ethAmt),
      tx:       usdcTx.hash,
      ethTx:    ethTx.hash,
      message:  `$${Number(usdcAmt) / 1e6} test USDC + ${ethers.formatEther(ethAmt)} ETH sent to ${address}`,
    });

  } catch (e) {
    console.error('Faucet error:', e.message);
    return res.status(500).json({ error: 'Faucet TX failed: ' + (e.reason || e.message || 'unknown') });
  }
}
