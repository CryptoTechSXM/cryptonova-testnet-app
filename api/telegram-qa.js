// CryptoNova Support Bot - Claude-powered Telegram Q&A
// Vercel serverless webhook handler
//
// ENV VARS:
//   TELEGRAM_QA_BOT_TOKEN, ANTHROPIC_API_KEY,
//   FAUCET_PRIVATE_KEY, BASE_SEPOLIA_RPC

import { ethers } from 'ethers';

const BOT_USERNAME      = 'cnova_support_bot';
const USDC_ADDRESS      = '0x2D8B7b5eDec96bE441b6fb0D45D74a2BcE2C639a';
const TIER_ROUTER       = '0x73772F4f4ACF7DcE64a69060878A92fD272c7CD8'; // V8.51
const CNOVA_TOKEN       = '0x486580A65A4952Ad79cCC14C1593BE6dB1A62d4B'; // V8.51
const CNOVA_TREASURY    = '0x31eD4325F0a75FFA061F3ca8de613f8e0df2c6af'; // V8.51 — floorPrice() lives here

// Group moderation — set these in Vercel env vars after creating the groups
// SUPPORT_GROUP_ID: the numeric chat ID of the support group (e.g. -1001234567890)
// COMMUNITY_GROUP_LINK: invite link for the community group (e.g. https://t.me/+abc123)
const SUPPORT_GROUP_ID       = process.env.SUPPORT_GROUP_ID             || '';
const COMMUNITY_GROUP_URL    = process.env.COMMUNITY_GROUP_LINK          || 'https://t.me/CryptoNovaHQ';
// Private errors channel (keeper/system alerts) → auto-log to BUGS.md
const PRIVATE_ERRORS_CHAT_ID  = process.env.TELEGRAM_CHAT_ID              || '';
// Community chat → /bug command
const COMMUNITY_CHAT_ID        = process.env.TELEGRAM_ANNOUNCE_CHANNEL_ID  || '';
const GITHUB_REPO              = process.env.GITHUB_REPO || 'CryptoTechSXM/cryptonova-testnet-app';
const BASESCAN          = 'https://sepolia.basescan.org';
const FAUCET_AMOUNT     = 20_000_000n;
const FAUCET_ETH_AMOUNT = '0.002';

const SYSTEM_PROMPT = `You are the CryptoNova Support Bot. Answer questions from members about the CryptoNova Matrix platform.

## Tone and Format
- Friendly, concise, mobile-first.
- Use Telegram HTML only: <b>bold</b>, <i>italic</i>, <code>code</code>, <a href="URL">link</a>
- Under 250 words unless a walkthrough is needed.
- No Markdown (no asterisks, backticks, or dashes for bullets).
- Never make up numbers, addresses, or facts.

## What Is CryptoNova?
Decentralized matrix platform on Base blockchain. Members pay USDC to join a binary matrix and earn USDC as it fills. Also features CNOVA utility token mined automatically through cycles. Currently on <b>Base Sepolia testnet</b>.

<b>LAUNCH DATE POLICY (updated 2026-07-23):</b> The mainnet soft launch date is <b>to be determined</b> — it opens when testing proves the system ready, not on a calendar date. No more moving target dates. The <b>official flagship launch is June 19, 2027 (Juneteenth)</b> at cryptonova.ai — that date stands. Meanwhile the FULL experience is live today on testnet at crypto-nova.app (zero risk, every mainnet mechanic). If members ask "when is mainnet?": soft launch = when it's ready (announced in advance); flagship = June 19, 2027.

## The Matrix System (verified from contract, V8.51)
Each tier has <b>two matrices</b>: <b>Matrix A (MatA)</b> and <b>Matrix B (MatB)</b> — each a 127-seat, 7-level BFS queue. They form a figure-eight: MatA is phase 1, MatB is phase 2 of one full journey.

1. You join a tier and take the next open seat in <b>MatA</b>. You hold <b>one seat</b> per registration — MatA or MatB, never both.
2. Once a matrix is full (127), <b>every new entry rotates it</b>: the root (seat 1) cycles out, everyone shifts up one seat, the newcomer takes the back seat. Members advance one at a time — the whole matrix never migrates at once.
3. When you reach root of <b>MatA</b> and cycle out, you <b>cross into MatB</b>. The crossing costs the HALF the entry fee (V8.51) — exactly your crossing reserve, which pre-paid it when you entered: nothing is drawn from your earnings, and your earned balance travels with you. Starting the next full cycle after MatB is a new full entry from your accumulated funds; if they come up short, you are parked until the gap is covered (see Rescue).
4. When you reach root of <b>MatB</b> and cycle out, your accumulated withdrawable funds the additive automation: re-entry first, then next-tier upgrade, then optional double seat (each step only if remaining funds cover it).
5. You may pass through MatA → MatB multiple times. There is no fixed "254-seat payout event."

Key nuances:
- <b>MatA and MatB are the same tier</b> — the crossing between them is a mid-point, not an upgrade.
- Do not promise upgrade after exactly one fill or after MatA alone.
- <b>Exception — Double Entry (see below):</b> a member with Double Entry enabled holds two simultaneous registrations, each progressing independently through MatA→MatB.

## Compensation Plan (verified from contract, V8.51)
Every entry fee, at every tier, splits identically:
- <b>50% crossing reserve</b> — held for the member; pre-funds HALF of their MatA→MatB crossing (the crossing costs the full entry fee; earnings cover the rest).
- <b>2.5% instant earn</b> — credited to withdrawable the moment they register.
- <b>5% L1 direct referral</b> — paid instantly, on registration AND on every tier upgrade the referred member ever makes. Referrer locked on-chain for life.
- <b>13.5% chain pay</b> — 2.7% to each of 5 upline matrix positions (L2–L6), fired by every entry below them, referred or not.
- <b>18% equalization pool</b> — accumulates per matrix. On EVERY rotation the pool splits across seats 2–127, <b>weighted by seat depth</b> — deeper seats receive larger shares; the cycling root receives none that rotation. Pool earnings drip continuously as the matrix rotates. There is NO lump-sum "root wins the whole pool" payout and NO "earn 2x your entry" payout — never claim either.
- Remaining 11% protocol reserves: CNOVA Treasury 5%, Stability Fund 3%, Dev 1%, Ops 0.5%, Community Wallet 1%, Buyback 0.25%, Liquidity 0.25%.
Total cycle earnings = accumulated chain pay + pool shares + referral bonuses + instant earn — never a fixed multiple of the entry fee.

## Double Entry (opt-in feature)
Double entry is an <b>opt-in toggle</b> per member (off by default). When a member cycles out of a matrix, the contract fires a <b>second registerFor() call immediately</b> using the remaining escrow/withdrawable surplus. This second registration is placed <b>at the same moment</b> as the primary one — not in a future cycle.

<b>Two seats simultaneously.</b> The member now has two active positions progressing through the matrix independently. Each seat moves through MatA → MatB on its own.

What tier the second seat lands in:

<b>Scenario A — Re-entering same tier (no upgrade yet):</b>
Primary: placed in <b>T1</b>. Second: also placed in <b>T1</b>.
Result: <b>two seats in T1 at the same time</b>. Each progresses independently.

<b>Scenario B — Upgrading (T1→T2):</b>
Primary: placed in <b>T2</b> (the upgrade). Second: placed back in <b>T1</b>.
Result: <b>one seat in T2 + one seat in T1 simultaneously</b>.

Key rules:
- <b>Escrow surplus must cover the second entry fee</b> — if not, double entry is silently skipped.
- Requires completing at least 2 cycles before it activates.
- Toggle via the Dashboard (Member Options → Double Entry).
- This is an advanced feature. Most members leave it off.
- Do NOT say "one position at a time" when double entry is enabled — that rule only applies to a single registration without double entry.

Common question — answer exactly this way:
Q: "Can I hold 2 positions in the same tier? / Can I be in MatA and MatB at the same time?"
A: "<b>Without Double Entry:</b> No — within a single registration you move through MatA then MatB sequentially, one phase at a time. <b>With Double Entry enabled:</b> Yes — you hold two simultaneous registrations in the same tier. Each progresses through MatA → MatB independently. So you can have one seat in MatA and one in MatB at the same time, or both in MatA, depending on where each registration is in its cycle."

## The 10 Tiers
<code>
T1  Nova Seed        $10
T2  Nova Rise        $25
T3  Nova Star        $50
T4  Nova Core        $100
T5  Nova Prime       $250
T6  Nova Apex        $500
T7  Nova Pinnacle    $1,000
T8  SuperNova Titan  $2,500
T9  SuperNova Legend $5,000
T10 SuperNova Apex   $10,000
</code>

## CNOVA Token
- Minted automatically on every matrix event (register, cross, rotate).
- Mechanical floor price: Treasury USDC divided by total CNOVA minted. NEVER call it "guaranteed" — it is a redeemable on-chain floor, not a promised return. Market price above the floor is not guaranteed.
- 5% of every entry fee goes to the Treasury permanently (treasury BPS = 500).
- Every tier contributes to the floor — T2–T7 push it up faster than T1; T8–T10 push it up fastest.
- Redeem CNOVA for USDC at floor price from the Dashboard anytime.
- Floor price only ever goes up — every activity adds more USDC per CNOVA than the current floor.

## CNOVA Floor Price by Tier (Epoch 1, 5% treasury BPS)
T1=$10 fee → $0.0100/CNOVA  |  T2–T7 → $0.0125/CNOVA  |  T8–T10 → $0.01563/CNOVA
Tier multipliers: T1=1×, T2=2×, T3=4×, T4=8×, T5=20×, T6=40×, T7=80×, T8=160×, T9=320×, T10=640×

## CNOVA Epochs (from CNOVAToken.sol)
<b>Global and platform-wide</b> - not per-member. <b>9 epochs total.</b>
Epoch advances when the FIRST fires: 1,000,000 CNOVA minted, 1,000 new members, or 180 days elapsed (V8.51 policy — item 42).

Base T1 rewards: Ep1=50, Ep2=40, Ep3=20, Ep4=10, Ep5=5, Ep6-8=2.5, Ep9=2.5 CNOVA.

<b>Tier multipliers:</b>
<code>T1=1x T2=2x T3=4x T4=8x T5=20x T6=40x T7=80x T8=160x T9=320x T10=640x</code>

T5 in Epoch 1 = 50x20 = <b>1,000 CNOVA</b>. T10 in Epoch 1 = 50x640 = <b>32,000 CNOVA</b>.

Mining stops after all 9 epochs (21M hard cap). Do NOT say "after your 8th cycle you stop mining" - epochs are global.

## Community Pool
<b>1% of every entry fee</b> (100 BPS) plus orphan fees (entries with no valid upline). First 1,000 wallets eligible — enrollment automatic and permanent, closes forever at member 1,000.
Genesis (#1-500) = 60%, Pioneer (#501-1000) = 40%, split evenly within each cohort.
On the 25TH of every month a distribution can be triggered (calendar-day model, V8.51): half the pool pays out, half rolls over and compounds. Members then have 30 days to claim; unclaimed amounts sweep back into the pool by design. Payouts begin at mainnet (policy).

## How to Register
1. Visit <a href="https://crypto-nova.app">crypto-nova.app</a>
2. Connect your wallet — MetaMask, Rabby, TokenPocket, Coinbase Wallet, Trust Wallet, or OKX all supported
3. Switch to <b>Base Sepolia</b> (auto-prompted)
4. Need funds? Use <code>/faucet 0xYourAddress</code> - bot sends $20 USDC + 0.002 ETH instantly
5. Approve USDC, then Register
6. Member ID and referral link appear immediately

## Getting Test Funds
Bot sends <b>$20 testnet USDC + 0.002 ETH for gas</b> automatically.
Use: <code>/faucet 0xYourWalletAddress</code>
Or post your address and mention needing USDC/test funds.
Limit: one drop per address per 24 hours.

## Dashboard
Withdrawable, Total Earned, CNOVA Balance, CNOVA Value, CNOVA Burned, Community Pool share.

## Withdrawals
1.5% fee deducted. Instant to Base Sepolia wallet. Can also redeem CNOVA for USDC.

## Upgrades, Re-entry & Rescue (verified from contract, V8.51)
At MatB cycle-out the <b>additive engine</b> buys seats from your cycle-out funds in priority order: <b>re-entry → next-tier upgrade → double seat</b>. Each step fires only if the remaining funds cover its fee; otherwise it is silently skipped.
- Defaults: auto re-entry ON, auto-upgrade ON for your first 5 cycles, double OFF. Change anytime via Dashboard toggles (Member Options). Each enabled toggle holds back its fee from withdrawals so your automation stays funded.
- Fees come from your in-contract funds (crossing reserve + withdrawable) — NOT from your external wallet. Not free — it comes from earnings.
- <b>Manual upgrade eligibility:</b> complete a cycle at your current tier, or cross into its MatB — or the target tier's Whale Gate is open (T2–T5 open together once 25 pioneers reach T5; T6–T10 each at their own pioneer milestone — 15 for T6, 10 for T7, and 5 each for T8/T9/T10). Auto-upgrades are never whale-gated.
- <b>Parked / rescue:</b> if crossing funds come up short, you are parked — earnings, reserve, and CNOVA are never confiscated. Three paths back in:
  1. <b>Auto-rescue</b> — if your balance covers the fee, the keeper re-enters you automatically within ~24 hours, no cost.
  2. <b>Self-rescue</b> — pay only the shortfall from your wallet. NO loan, NO debt, nothing owed back.
  3. <b>coPayRescue</b> — keeper-driven StabilityFund co-pay for eligible cases; any SF loan portion is repaid gradually from future pool shares.
- Long-idle parked seats can be cleared by the keeper (slot cleared): tier status and earnings preserved; rejoin by paying the re-entry fee.
- When the newest pair FILLS, the factory spawns the next pair and overflow routes into it automatically (V8.51 — the old fixed 375/381 entry thresholds are GONE from the contracts; think seats remaining, not entry counts).
- <b>"Why is T1.2 (or any new pair) empty?"</b> New pairs deploy when the newest pair is FULL (V8.51 item 33 — no more fixed entry thresholds). A new pair can sit empty until routing reaches it — only then does new activity flow into it automatically. An empty freshly-deployed pair is the system working correctly: the runway is built before the plane needs it. It is NOT stalled, and nobody is "stuck" in it — reassure members this is by design (V8.51 anti-freeze buffer).
- Do NOT say upgrade is free. Do NOT describe rescue as a loan by default — self-rescue is debt-free.

## Network Setup (Base Sepolia)
Chain ID: <code>84532</code> | RPC: <code>https://sepolia.base.org</code> | Explorer: <code>https://sepolia.basescan.org</code>

## Common Issues
<b>Transaction failed:</b> Approve USDC first (Step 1 before Step 2). Check you have ETH for gas.
<b>Already registered:</b> Open Dashboard to see your account.
<b>Wrong network:</b> Use site prompt or add Base Sepolia manually.
<b>No USDC/ETH (testnet):</b> Use /faucet command with your address.
<b>No USDC/ETH (mainnet):</b> Swap any crypto to USDC on Base using <a href="https://changenow.app.link/referral?link_id=c66940e36c06c9">ChangeNow</a> — works with most coins, no account required.
<b>Wallet won't connect:</b> Refresh and try again. Supported wallets: MetaMask, Rabby, TokenPocket, Coinbase Wallet, Trust Wallet, OKX Wallet. Phantom is not supported on testnet (Base Sepolia) but works on mainnet.
<b>Dashboard shows 0:</b> Connect with same wallet you registered with.

## Referral System
The referral system is fully live in the smart contracts.
- When you register using someone's referral link, their <b>wallet address</b> is recorded on-chain permanently and they earn the L1 direct fee (5% of your entry fee) instantly.
- The referrer field always shows a <b>wallet address</b> (e.g. 0x1a2b...3c4d). There are no usernames or Member IDs — it is wallet-address based.
- <b>"Direct"</b> means the member registered without a referral link (no referrer address passed). This happens on testnet AND mainnet — it is not a testnet limitation.
- On testnet, most members show "Direct" because they were added via automated stress-testing with no referrer, not because referrals aren't working.
- On mainnet, members who use a referral link will show the referrer's wallet address. Members who register directly will always show "Direct" — permanently.
- Do NOT say referrer will show "Member ID" or "username" — those are not built. Do NOT say "Direct" is only a testnet thing.

## Contracts (Base Sepolia — V8.51)
TierRouter: <code>0x73772F4f4ACF7DcE64a69060878A92fD272c7CD8</code>
MatrixKeeper: <code>0x693519F442cE01633954D9E700B6faC3F96d25FA</code>
CNOVA Token: <code>0x486580A65A4952Ad79cCC14C1593BE6dB1A62d4B</code>
USDC: <code>0x2D8B7b5eDec96bE441b6fb0D45D74a2BcE2C639a</code>

## Links
<a href="https://crypto-nova.app">crypto-nova.app</a> | <a href="https://crypto-nova.app/faq">FAQ</a>
<a href="https://changenow.app.link/referral?link_id=c66940e36c06c9">ChangeNow</a> — swap any crypto to USDC on Base (no account needed)

## Escalate to @admin when
- Missing payment or stuck transaction
- Bug or unexpected site behaviour
- Anything needing admin access

## Never
- Share private keys or seed phrases
- Promise earnings or give financial advice
- Answer off-topic questions (crypto markets, other projects) - stay on CryptoNova support`;

const HELP_TEXT = `<b>CryptoNova Support Bot</b>

I can answer questions about:
1. How the matrix works
2. Registration and entry fees
3. CNOVA token and mining
4. Tiers, upgrades and earnings
5. Withdrawals and fee structure
6. Community Pool eligibility
7. Dashboard breakdown
8. Troubleshooting

<b>Commands:</b>
/status — platform status &amp; member count
/stats — live on-chain stats (SF, CNOVA supply)
/price — live CNOVA floor price
/tier — entry fees and earnings per tier
/register — how to get started
/faucet 0xYourAddress — get $20 USDC + 0.002 ETH
/help — this message

<a href="https://crypto-nova.app">crypto-nova.app</a> | <a href="https://crypto-nova.app/faq">FAQ</a>`;

const REGISTER_TEXT = `<b>How to Register on CryptoNova</b>

1. Visit <a href="https://crypto-nova.app">crypto-nova.app</a>
2. Connect your wallet — MetaMask, Rabby, TokenPocket, Coinbase Wallet, Trust Wallet, or OKX all supported
3. Switch to <b>Base Sepolia</b> (auto-prompted)
4. Need testnet funds? Use: <code>/faucet 0xYourWalletAddress</code>
   Bot sends $20 USDC + 0.002 ETH for gas instantly.
5. Approve USDC and confirm
6. Register and confirm
7. Member ID and referral link appear instantly

Have a referral link? Use it to pre-fill your referrer.
Questions? Mention @cnova_support_bot`;

const OFFTOPIC_REDIRECT = `👋 This is the <b>CryptoNova Support Channel</b> — for technical help, bug reports, and platform questions.

💬 For general chat, join the community here:
<a href="${COMMUNITY_GROUP_URL}">CryptoNova Community →</a>

Have a support question? Just ask it here and I'll answer right away! 🛠️`;

const rateLimits = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_MSGS  = 6;

function checkRateLimit(userId) {
  const now = Date.now();
  let rec = rateLimits.get(userId);
  if (!rec || now - rec.start > RATE_WINDOW_MS) rec = { count: 0, start: now };
  rec.count++;
  rateLimits.set(userId, rec);
  return rec.count <= RATE_MAX_MSGS;
}

const faucetCooldowns = new Map();
const FAUCET_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function checkFaucetCooldown(addr) {
  const key = addr.toLowerCase();
  const last = faucetCooldowns.get(key);
  if (!last) return { allowed: true };
  const remaining = FAUCET_COOLDOWN_MS - (Date.now() - last);
  if (remaining <= 0) return { allowed: true };
  return { allowed: false, hoursLeft: Math.ceil(remaining / 3_600_000) };
}

function markFaucetUsed(addr) {
  faucetCooldowns.set(addr.toLowerCase(), Date.now());
}

async function sendFaucetFunds(toAddress) {
  const FAUCET_KEY = process.env.FAUCET_PRIVATE_KEY;
  if (!FAUCET_KEY) return { ok: false, reason: 'Faucet not configured - tag @admin for test funds.' };

  const rpcUrl = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet   = new ethers.Wallet(FAUCET_KEY, provider);

    const usdc = new ethers.Contract(USDC_ADDRESS, [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
    ], wallet);

    const usdcBal = await usdc.balanceOf(wallet.address);
    if (usdcBal < FAUCET_AMOUNT) return { ok: false, reason: 'Faucet is low on USDC - tag @admin to refill.' };

    const ethBal  = await provider.getBalance(wallet.address);
    const ethSend = ethers.parseEther(FAUCET_ETH_AMOUNT);
    if (ethBal < ethSend) return { ok: false, reason: 'Faucet is low on ETH - tag @admin to refill.' };

    const ethTx      = await wallet.sendTransaction({ to: toAddress, value: ethSend });
    const ethReceipt = await ethTx.wait(1);
    console.log(`[faucet] ETH sent to ${toAddress} - ${ethReceipt.hash}`);

    const usdcTx      = await usdc.transfer(toAddress, FAUCET_AMOUNT);
    const usdcReceipt = await usdcTx.wait(1);
    console.log(`[faucet] USDC sent to ${toAddress} - ${usdcReceipt.hash}`);

    return { ok: true, ethHash: ethReceipt.hash, usdcHash: usdcReceipt.hash };
  } catch (e) {
    console.error('[faucet] Error:', e.message);
    return { ok: false, reason: 'Transaction failed - tag @admin for help.' };
  }
}

async function tgPost(method, token, body) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json().catch(() => ({}));
}

async function sendReply(token, chatId, text, replyToId) {
  return tgPost('sendMessage', token, {
    chat_id: chatId,
    text: text.slice(0, 4096),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyToId ? { reply_to_message_id: replyToId } : {}),
  });
}

async function sendTyping(token, chatId) {
  return tgPost('sendChatAction', token, { chat_id: chatId, action: 'typing' }).catch(() => {});
}

async function deleteMessage(token, chatId, messageId) {
  return tgPost('deleteMessage', token, { chat_id: chatId, message_id: messageId }).catch(() => {});
}

async function isGroupAdmin(token, chatId, userId) {
  try {
    const r = await tgPost('getChatMember', token, { chat_id: chatId, user_id: userId });
    return ['administrator', 'creator'].includes(r?.result?.status);
  } catch { return false; }
}

// Classifies a group message as 'support', 'offtopic', or 'spam'.
// Defaults to 'support' on any error so the bot never silently drops a real question.
async function classifyMessage(apiKey, text) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        system: `Classify this Telegram message into exactly one word — no punctuation, no explanation:
"support" = help request, technical question about CryptoNova, faucet request, bug report, wallet issue, registration question

## Supported Wallets
MetaMask ✅, Rabby ✅, TokenPocket ✅, Coinbase Wallet ✅, Trust Wallet ✅, OKX Wallet ✅
Phantom ❌ on testnet (Base Sepolia not supported by Phantom) — will work on mainnet Base.
"offtopic" = casual greetings (GM/GN/hi), general crypto chat, price talk, unrelated conversation, sharing wins
"spam" = marketing links, promotional content, scam attempts, unrelated project shilling, gibberish
Reply with only one word.`,
        messages: [{ role: 'user', content: text }],
      }),
    });
    const data = await r.json();
    const result = data.content?.[0]?.text?.trim().toLowerCase().split(/\s/)[0];
    return ['support', 'offtopic', 'spam'].includes(result) ? result : 'support';
  } catch { return 'support'; }  // fail-safe: never drop a real question
}

async function fetchLiveStats() {
  const RPC = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
  async function call(to, selector) {
    const r = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to, data: selector }, 'latest'] }),
    });
    const json = await r.json();
    if (json.error || !json.result || json.result === '0x') return null;
    return parseInt(json.result, 16);
  }
  // globalJoinedCount() — true running total (not capped like getSystemEntryCount)
  // selector: keccak256("globalJoinedCount()") = 0xfbcfd600
  const countRaw = await call(TIER_ROUTER, '0xfbcfd600');
  const memberDisplay = countRaw && countRaw > 0 ? `<b>${countRaw.toLocaleString()}</b> members registered` : 'member count unavailable';
  return `<b>CryptoNova Testnet - Live Stats</b>\n\nMembers: ${memberDisplay}\nNetwork: Base Sepolia\nContract: <code>${TIER_ROUTER}</code>\n\n<a href="https://crypto-nova.app">Open Dashboard for full stats</a>`;
}

function mdToTg(text) {
  return text
    .replace(/^#{1,3}\s+(.+)$/gm, '<b>$1</b>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<b>$1</b>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<i>$1</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^[ \t]*[-*]\s+/gm, '• ')
    .replace(/^[-*_]{3,}$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function askClaude(apiKey, question) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: question }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `HTTP ${r.status}`);
  return mdToTg(data.content?.[0]?.text?.trim() || '');
}

function extractAddress(text) {
  const m = text.match(/0x[0-9a-fA-F]{40}/);
  return m ? m[0] : null;
}

function faucetKeywordsPresent(text) {
  return /\bfaucet\b|need\s+usdc|send\s+usdc|test\s+usdc|test\s+funds|need\s+test|want\s+usdc|get\s+usdc/i.test(text);
}

function shortAddr(addr) { return `${addr.slice(0, 8)}...${addr.slice(-6)}`; }

async function handleFaucetRequest(token, chatId, msgId, rawAddress) {
  if (!rawAddress || !/^0x[0-9a-fA-F]{40}$/.test(rawAddress)) {
    await sendReply(token, chatId, `Please include a valid wallet address.\n\nExample:\n<code>/faucet 0xYourWalletAddress</code>`, msgId);
    return;
  }
  let toAddress;
  try { toAddress = ethers.getAddress(rawAddress); }
  catch { await sendReply(token, chatId, `That doesn't look like a valid Ethereum address. Double-check and try again.`, msgId); return; }

  const cd = checkFaucetCooldown(toAddress);
  if (!cd.allowed) {
    await sendReply(token, chatId, `Address <code>${shortAddr(toAddress)}</code> already received test funds. Try again in <b>${cd.hoursLeft}h</b>.`, msgId);
    return;
  }

  await sendTyping(token, chatId);
  const result = await sendFaucetFunds(toAddress);

  if (result.ok) {
    markFaucetUsed(toAddress);
    await sendReply(token, chatId,
      `Funds sent to\n<code>${toAddress}</code>\n\n` +
      `<b>$20 testnet USDC</b> - <a href="${BASESCAN}/tx/${result.usdcHash}">View tx</a>\n` +
      `<b>0.002 ETH</b> for gas - <a href="${BASESCAN}/tx/${result.ethHash}">View tx</a>\n\n` +
      `You're ready to register!\n<a href="https://crypto-nova.app">crypto-nova.app</a>`,
      msgId);
  } else {
    await sendReply(token, chatId, result.reason, msgId);
  }
}

// ── BUGS.md auto-log helpers ──────────────────────────────────────────────────
// Used by: private errors channel monitor + /bug command

async function bugsGetFile(token) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/BUGS.md`;
  const r = await fetch(`${url}?ref=admin`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'cnova-bot' },
  });
  if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
  const j = await r.json();
  return { sha: j.sha, content: Buffer.from(j.content, 'base64').toString('utf8') };
}

async function bugsPutFile(token, content, sha, message) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/BUGS.md`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
      'User-Agent': 'cnova-bot', 'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), sha, branch: 'admin' }),
  });
  if (!r.ok) throw new Error(`GitHub PUT ${r.status} ${await r.text()}`);
}

function isDuplicateInBugs(bugsContent, checkText) {
  const openStart    = bugsContent.indexOf('## Open Issues');
  const resolvedStart = bugsContent.indexOf('## Resolved Issues');
  if (openStart === -1) return false;
  const openBlock = (resolvedStart !== -1
    ? bugsContent.slice(openStart, resolvedStart)
    : bugsContent.slice(openStart)).toLowerCase();

  // Match by wallet address
  const addrs = checkText.match(/0x[0-9a-fA-F]{40}/g) || [];
  for (const addr of addrs) {
    if (openBlock.includes(addr.toLowerCase())) return true;
  }
  // Match by leading text snippet (first 60 chars)
  const snippet = checkText.slice(0, 60).toLowerCase().trim();
  if (snippet.length > 20 && openBlock.includes(snippet)) return true;
  return false;
}

async function appendBugEntry(token, title, details) {
  const { sha, content } = await bugsGetFile(token);
  if (isDuplicateInBugs(content, `${title} ${details}`)) {
    console.log('[bugs] duplicate, skipping:', title.slice(0, 60));
    return false;
  }
  const today  = new Date().toISOString().slice(0, 10);
  const entry  = `\n### [${today}] ${title}\n${details}\n`;
  // Insert before Template section; fall back to before Resolved
  let insertAt = content.indexOf('\n## Template');
  if (insertAt === -1) insertAt = content.indexOf('\n## Resolved');
  if (insertAt === -1) throw new Error('Cannot find insertion point in BUGS.md');
  const updated = content.slice(0, insertAt) + entry + content.slice(insertAt);
  await bugsPutFile(token, updated, sha, `bug-bot: ${title.slice(0, 70)}`);
  console.log('[bugs] logged:', title.slice(0, 60));
  return true;
}

// Handles a raw text message arriving in the private errors channel.
// Skips web-form notifications (already in BUGS.md) and very short noise.
async function handlePrivateErrorReport(rawText, token) {
  if (/🐛|New Bug Report/i.test(rawText.slice(0, 40))) return; // already logged by submit-bug.js
  if (rawText.length < 25) return;                              // noise
  const lines   = rawText.split('\n');
  const title   = lines[0].replace(/^\[.*?\]\s*/, '').slice(0, 100);
  const rest    = lines.slice(1).join('\n').trim();
  const details = `- **Source:** Keeper / system alert\n` +
    (rest ? `- **Details:** ${rest}` : `- **Raw:** ${rawText.slice(0, 500)}`);
  try {
    await appendBugEntry(token, title, details);
  } catch (e) {
    console.error('[bugs] private-errors write failed:', e.message);
  }
}

export default async function handler(req, res) {
  const ok = () => res.status(200).json({ ok: true });
  if (req.method !== 'POST') return ok();

  const BOT_TOKEN = process.env.TELEGRAM_QA_BOT_TOKEN;
  const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  if (!BOT_TOKEN || !ANTHROPIC) { console.error('[telegram-qa] Missing env vars'); return ok(); }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (e) { console.error('[telegram-qa] Bad JSON:', e.message); return ok(); }

  const msg = body?.message || body?.channel_post;
  if (!msg) return ok();

  const chatId   = msg.chat?.id;
  const msgId    = msg.message_id;
  const userId   = msg.from?.id || 0;
  const chatType = msg.chat?.type;
  const rawText  = (msg.text || msg.caption || '').trim();
  const fromBot  = !!msg.from?.is_bot;

  // ── New member welcome ─────────────────────────────────────────────────────
  // Fires when someone joins the support group (new_chat_members service message).
  // No rawText on these, so we must check BEFORE the rawText guard below.
  if (msg.new_chat_members && Array.isArray(msg.new_chat_members)) {
    const isSupportGroupJoin = SUPPORT_GROUP_ID && String(chatId) === String(SUPPORT_GROUP_ID);
    if (isSupportGroupJoin) {
      const newcomers = msg.new_chat_members.filter(u => !u.is_bot);
      if (newcomers.length > 0) {
        const names = newcomers.map(u =>
          u.username ? `@${u.username}` : `<b>${u.first_name}</b>`
        ).join(', ');

        await tgPost('sendMessage', BOT_TOKEN, {
          chat_id: chatId,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          text:
            `👋 Welcome to the CryptoNova Support Group, ${names}!\n\n` +
            `<b>How this group works:</b>\n` +
            `• Type your question here and I'll answer it automatically\n` +
            `• I'll repost your question cleanly and reply below it\n` +
            `• For private questions, DM me directly: @${BOT_USERNAME}\n\n` +
            `<b>Not for general chat</b> — join our community group for that:\n` +
            `<a href="${COMMUNITY_GROUP_URL}">CryptoNova Community →</a>\n\n` +
            `<b>Quick commands:</b>\n` +
            `<code>/faucet 0x…</code> — get testnet USDC + ETH\n` +
            `<code>/price</code> — current CNOVA floor price\n` +
            `<code>/tier</code> — tier entry fees and earnings\n\n` +
            `🚀 <b>Flagship launch June 19, 2027</b> — <a href="https://cryptonova.ai">cryptonova.ai</a>`,
        });
      }
    }
    return ok();
  }

  if (fromBot || !chatId || !rawText) return ok();

  const mentionPattern = new RegExp(`@${BOT_USERNAME}`, 'i');
  const isMentioned    = mentionPattern.test(rawText);
  const isPrivate      = chatType === 'private';
  const isCommand      = rawText.startsWith('/');
  const isSupportGroup = SUPPORT_GROUP_ID && String(chatId) === String(SUPPORT_GROUP_ID);

  // ── Support group moderation ────────────────────────────────────────────────
  // Any plain message in the support group (not a command, not an @mention):
  //   spam    → delete silently
  //   offtopic → delete + "please DM the bot" notice
  //   support  → delete original, repost with @username attribution, answer below
  //
  // ⚠️  Bot must be a group ADMIN with "Delete messages" permission for this to work.
  if (isSupportGroup && !isCommand && !isMentioned && !fromBot) {
    const senderName = msg.from?.username
      ? `@${msg.from.username}`
      : `<b>${msg.from?.first_name || 'Member'}</b>`;

    const verdict = await classifyMessage(ANTHROPIC, rawText);

    if (verdict === 'spam') {
      // Silently delete — no notification to avoid drawing attention
      await deleteMessage(BOT_TOKEN, chatId, msgId);
      return ok();
    }

    if (verdict === 'offtopic') {
      // Delete + polite redirect
      await deleteMessage(BOT_TOKEN, chatId, msgId);
      await tgPost('sendMessage', BOT_TOKEN, {
        chat_id: chatId,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        text:
          `👋 Hey ${senderName} — this group is for <b>support questions only</b>.\n\n` +
          `For general chat and community discussion:\n` +
          `<a href="${COMMUNITY_GROUP_URL}">CryptoNova Community →</a>\n\n` +
          `To ask a support question, DM me directly: @${BOT_USERNAME}\n` +
          `Or just ask it in this group and tag me: <code>@${BOT_USERNAME} your question</code>`,
      });
      return ok();
    }

    // verdict === 'support': delete original, repost with attribution, then answer
    await deleteMessage(BOT_TOKEN, chatId, msgId);

    const repostResult = await tgPost('sendMessage', BOT_TOKEN, {
      chat_id: chatId,
      parse_mode: 'HTML',
      text: `💬 ${senderName} asked:\n\n${rawText}`,
    });

    const repostMsgId = repostResult?.result?.message_id;
    await sendTyping(BOT_TOKEN, chatId);
    try {
      const answer = await askClaude(ANTHROPIC, rawText);
      if (answer) await sendReply(BOT_TOKEN, chatId, answer, repostMsgId);
      else throw new Error('empty');
    } catch (e) {
      console.error('[group-qa] Claude error:', e.message);
      await sendReply(BOT_TOKEN, chatId,
        `Having trouble right now — try DM-ing me directly: @${BOT_USERNAME}`, repostMsgId);
    }
    return ok();
  }

  // ── Private errors channel → auto-log to BUGS.md ────────────────────────────
  // Keeper/system alerts sent here are written as open issues automatically.
  // Web-form bug report notifications (already in BUGS.md) are skipped.
  if (PRIVATE_ERRORS_CHAT_ID && String(chatId) === String(PRIVATE_ERRORS_CHAT_ID)) {
    const ghToken = process.env.GITHUB_TOKEN;
    if (ghToken && rawText) await handlePrivateErrorReport(rawText, ghToken);
    return ok();
  }

  if (!isPrivate && !isMentioned && !isCommand) return ok();

  const question = rawText.replace(mentionPattern, '').trim();
  if (!question) { await sendReply(BOT_TOKEN, chatId, HELP_TEXT); return ok(); }

  if (isCommand) {
    const parts  = question.split(/\s+/);
    const cmd    = parts[0].toLowerCase().replace(`@${BOT_USERNAME}`, '');
    const cmdArg = parts[1] || '';

    if (cmd === '/start' || cmd === '/help') { await sendReply(BOT_TOKEN, chatId, HELP_TEXT); return ok(); }
    if (cmd === '/register') { await sendReply(BOT_TOKEN, chatId, REGISTER_TEXT); return ok(); }
    if (cmd === '/status') {
      await sendTyping(BOT_TOKEN, chatId);
      try {
        const RPC = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
        const ethCall = async (to, sel) => {
          const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_call', params:[{to, data:sel},'latest'] }) });
          const j = await r.json();
          return (j.error || !j.result || j.result==='0x') ? null : BigInt(j.result);
        };
        // globalJoinedCount() selector: 0xfbcfd600
        const countRaw = await ethCall(TIER_ROUTER, '0xfbcfd600');
        const memberCount = countRaw !== null ? Number(countRaw) : null;
        const countLine = memberCount !== null ? `👥 <b>Members:</b> ${memberCount}` : `👥 <b>Members:</b> —`;
        await sendReply(BOT_TOKEN, chatId,
          `<b>CryptoNova Status</b> 🟢\n\n` +
          `🌐 <b>Network:</b> Base Sepolia (testnet)\n` +
          countLine + `\n` +
          `📊 <b>Matrix:</b> Operational — register, earn USDC, mine CNOVA\n` +
          `💰 <b>Test Funds:</b> /faucet 0xYourAddress\n` +
          `🚀 <b>Mainnet:</b> soft launch TBD · flagship June 19, 2027 — <a href="https://cryptonova.ai">cryptonova.ai</a>\n\n` +
          `For live chain stats use /stats`,
          msgId);
      } catch(e) {
        await sendReply(BOT_TOKEN, chatId,
          `<b>CryptoNova Status</b> 🟢\n\nPlatform is live on Base Sepolia.\nVisit <a href="https://crypto-nova.app">crypto-nova.app</a> for your dashboard.`,
          msgId);
      }
      return ok();
    }
    if (cmd === '/stats') {
      await sendTyping(BOT_TOKEN, chatId);
      try { await sendReply(BOT_TOKEN, chatId, await fetchLiveStats(), msgId); }
      catch (e) { await sendReply(BOT_TOKEN, chatId, 'Unable to fetch live stats. Check the <a href="https://crypto-nova.app">Dashboard</a>.', msgId); }
      return ok();
    }
    if (cmd === '/price') {
      await sendTyping(BOT_TOKEN, chatId);
      try {
        const RPC = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
        const eth = async (to, sel) => {
          const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_call', params:[{to, data:sel},'latest'] }) });
          const j = await r.json();
          return (j.error || !j.result || j.result==='0x') ? null : BigInt(j.result);
        };
        // floorPrice() on CNOVATreasury — returns uint256 in 6-decimal USDC
        // selector: keccak256("floorPrice()") = 0x9363c812
        const raw = await eth(CNOVA_TREASURY, '0x9363c812');
        if (raw !== null) {
          const price = (Number(raw) / 1e6).toFixed(6);
          await sendReply(BOT_TOKEN, chatId,
            `💰 <b>CNOVA Floor Price</b>\n\n` +
            `<b>$${price} USDC</b> per CNOVA\n\n` +
            `<i>Floor price is backed by the Treasury and can only go up.</i>\n` +
            `Redeem on the <a href="https://crypto-nova.app">Dashboard</a> → Withdraw Earnings → Redeem CNOVA.`,
            msgId);
        } else {
          await sendReply(BOT_TOKEN, chatId, 'Unable to fetch CNOVA price right now — check the <a href="https://crypto-nova.app">Dashboard</a>.', msgId);
        }
      } catch(e) {
        await sendReply(BOT_TOKEN, chatId, 'Price fetch error. Try the <a href="https://crypto-nova.app">Dashboard</a> instead.', msgId);
      }
      return ok();
    }
    if (cmd === '/tier') {
      await sendReply(BOT_TOKEN, chatId,
        `📊 <b>CryptoNova — 10 Tiers</b>\n\n` +
        `<code>` +
        `T1  Nova Seed         $10\n` +
        `T2  Nova Rise         $25\n` +
        `T3  Nova Star         $50\n` +
        `T4  Nova Core        $100\n` +
        `T5  Nova Prime       $250\n` +
        `T6  Nova Apex        $500\n` +
        `T7  Nova Pinnacle   $1,000\n` +
        `T8  SuperNova Titan $2,500\n` +
        `T9  SuperNova Legend$5,000\n` +
        `T10 SuperNova Apex $10,000` +
        `</code>\n\n` +
        `<b>How earnings work:</b>\n` +
        `• 127-seat matrix rotates → you advance seat by seat\n` +
        `• 18% pool pays every seat per rotation, weighted by depth\n` +
        `• Chain pay: L1 5% direct bonus · L2–L6 2.7% each · 18.5% total\n` +
        `• 2.5% instant earn on join · 50% crossing reserve (pre-pays your crossing in full — V8.51)\n` +
        `• MatB cycle-out → auto re-entry/upgrade + CNOVA mined on every event\n\n` +
        `Register at T1 and get your referral link: <a href="https://crypto-nova.app">crypto-nova.app</a>`,
        msgId);
      return ok();
    }
    if (cmd === '/faucet') {
      if (!cmdArg) {
        await sendReply(BOT_TOKEN, chatId,
          `<b>Testnet Faucet</b>\n\nSends <b>$20 testnet USDC + 0.002 ETH</b> for gas instantly.\n\nUsage:\n<code>/faucet 0xYourWalletAddress</code>\n\nLimit: one drop per address per 24 hours.`,
          msgId);
        return ok();
      }
      await handleFaucetRequest(BOT_TOKEN, chatId, msgId, cmdArg);
      return ok();
    }
    if (cmd === '/del') {
      // Admin-only: delete the replied-to message (+ the /del command itself)
      const targetMsgId = msg.reply_to_message?.message_id;
      if (!targetMsgId) {
        await sendReply(BOT_TOKEN, chatId, `Reply to a message with /del to remove it.`, msgId);
        return ok();
      }
      const adminOk = await isGroupAdmin(BOT_TOKEN, chatId, userId);
      if (!adminOk) {
        await sendReply(BOT_TOKEN, chatId, `Only group admins can delete messages.`, msgId);
        return ok();
      }
      await deleteMessage(BOT_TOKEN, chatId, targetMsgId);
      await deleteMessage(BOT_TOKEN, chatId, msgId);  // also remove the /del command itself
      return ok();
    }
    if (cmd === '/bug') {
      // Submit a bug report directly from Telegram — logged to BUGS.md via GitHub API
      const description = parts.slice(1).join(' ').trim();
      if (!description) {
        await sendReply(BOT_TOKEN, chatId,
          `<b>Report a Bug</b>\n\nUsage:\n<code>/bug [what happened and which page]</code>\n\nExample:\n<code>/bug index.html — upgrade button not loading after wallet connect</code>`,
          msgId);
        return ok();
      }
      const reporterName = msg.from?.username
        ? `@${msg.from.username}`
        : (msg.from?.first_name || 'Member');
      const bugTitle   = description.slice(0, 100);
      const bugDetails = `- **Reporter:** ${reporterName}\n- **Source:** Telegram /bug command\n- **Description:** ${description}`;
      const ghToken    = process.env.GITHUB_TOKEN;
      if (ghToken) {
        try {
          const logged = await appendBugEntry(ghToken, bugTitle, bugDetails);
          await sendReply(BOT_TOKEN, chatId,
            logged
              ? `✅ <b>Bug logged!</b> We'll look into it.\n\n<i>Track status at <a href="https://admin.crypto-nova.app/reports">admin.crypto-nova.app/reports</a></i>`
              : `ℹ️ Looks like we already have this one on our radar. Tag @admin if it's urgent.`,
            msgId);
        } catch (e) {
          console.error('[bugs] /bug write failed:', e.message);
          await sendReply(BOT_TOKEN, chatId, `Got it — we'll look into it. Tag @admin if urgent.`, msgId);
        }
      } else {
        await sendReply(BOT_TOKEN, chatId, `Thanks for the report! Tag @admin if it's urgent.`, msgId);
      }
      return ok();
    }
  }

  const detectedAddr = extractAddress(question);
  if (detectedAddr && faucetKeywordsPresent(question)) {
    if (!checkRateLimit(userId)) { await sendReply(BOT_TOKEN, chatId, `Too many messages. Please wait a moment.`, msgId); return ok(); }
    await handleFaucetRequest(BOT_TOKEN, chatId, msgId, detectedAddr);
    return ok();
  }

  if (!checkRateLimit(userId)) {
    await sendReply(BOT_TOKEN, chatId, `Too many messages. Please wait a moment before asking again.`, msgId);
    return ok();
  }

  await sendTyping(BOT_TOKEN, chatId);
  try {
    const answer = await askClaude(ANTHROPIC, question);
    if (answer) await sendReply(BOT_TOKEN, chatId, answer, msgId);
    else throw new Error('Empty response');
  } catch (e) {
    console.error('[telegram-qa] Claude error:', e.message);
    await sendReply(BOT_TOKEN, chatId, `Having trouble right now. Try again in a moment.\n<a href="https://crypto-nova.app/faq">FAQ</a> | Tag @admin for urgent help.`, msgId);
  }

  return ok();
}
