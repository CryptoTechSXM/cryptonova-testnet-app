/**
 * api/pif-request.js — Pay It Forward waitlist (V8.50, built 2026-08-26 launch day).
 * Two actions, both committing to PIF_WAITLIST.md on the admin branch via the same
 * GitHub-API pattern as submit-bug.js (Vercel env: GITHUB_TOKEN; Telegram notify is
 * best-effort via TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).
 *
 *   action:"request" {wallet, name?, why?, contact?}  -> append a [WAITING] line
 *   action:"gifted"  {wallet, by}                     -> flip that line to [GIFTED by ...]
 *
 * Owner's dials (2026-08-26): open waitlist on testnet; gifter funds the coupon;
 * one active gift per member (enforced on the page); no weekly cap (insolvency
 * floor is the guard). The coupon CODE is never sent here — it stays between
 * gifter and recipient; the chain only ever sees its hash.
 * Anti-noise: honeypot field + length caps. Testnet stakes; revisit for mainnet.
 */
const GH_OWNER  = 'CryptoTechSXM';
const GH_REPO   = 'cryptonova-testnet-app';
const GH_BRANCH = 'admin';
const GH_FILE   = 'PIF_WAITLIST.md';

async function ghRequest(method, path, body, token) {
  const url  = `https://api.github.com${path}`;
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'CryptoNova-PIF/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await r.text();
  try { return { status: r.status, body: text ? JSON.parse(text) : {} }; }
  catch (e) { return { status: r.status, body: {} }; }
}

async function notifyTelegram(msg) {
  try {
    const t = process.env.TELEGRAM_BOT_TOKEN, c = process.env.TELEGRAM_CHAT_ID;
    if (!t || !c) return;
    await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: c, text: msg, parse_mode: 'HTML' })
    });
  } catch (e) { /* best-effort, never blocks */ }
}

const clean = (s, max) => String(s || '').replace(/[|\r\n<>]/g, ' ').trim().slice(0, max);

// ⛔ This repo is "type":"module" (35.9 lesson): api functions are ESM.
// `module.exports` here crashed the function on first live test (owner, 2026-08-26)
// with a generic non-JSON 500 — export default is the working pattern (submit-bug.js).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'server not configured' });

  // ── GET = read the list (V8.50 / session 44, handoff 43.10) ────────────────
  // ⛔ WHY THIS EXISTS. pif.html used to render `/PIF_WAITLIST.md` — its OWN
  // deployment's static copy — while every request here commits to GH_BRANCH.
  // On www (main) that made the waitlist permanently empty: requesters never saw
  // themselves and sponsors saw nobody to sponsor, on the day PIF was announced.
  // Requests were being captured the whole time; only the list half was broken.
  // Pushing admin -> main was a stopgap that re-broke with the very next request.
  // The list is now served from the same branch it is written to — ONE source of
  // truth, and it stays correct on whatever branch the page happens to be served
  // from. If GH_BRANCH ever changes, both halves move together by construction.
  if (req.method === 'GET') {
    const get = await ghRequest('GET', `/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}?ref=${GH_BRANCH}`, null, token);
    if (get.status !== 200 || !get.body.content) return res.status(502).json({ error: 'waitlist unavailable' });
    const content = Buffer.from(get.body.content, 'base64').toString('utf-8');
    // A page load must not cost a GitHub API call every time. 30s of shared cache
    // is invisible to a member reading the list — but a page that has just changed
    // the list asks with ?fresh=1 and gets an uncached read, so a member never sees
    // their own request or reservation missing from the refresh right after it.
    const fresh = 'fresh' in (req.query || {});
    res.setHeader('Cache-Control', fresh ? 'no-store' : 's-maxage=30, stale-while-revalidate=120');
    return res.status(200).json({ ok: true, branch: GH_BRANCH, sha: get.body.sha, content });
  }

  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' });

  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true });   // honeypot: pretend success
  const wallet = clean(b.wallet, 42);
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) return res.status(400).json({ error: 'valid wallet required' });
  const ACTIONS = ['request', 'gifted', 'reserve', 'unreserve'];
  const action = ACTIONS.includes(b.action) ? b.action : 'request';

  // GET-modify-PUT with one retry on 409 (concurrent commit), same as submit-bug.js.
  for (let attempt = 0; attempt < 2; attempt++) {
    const get = await ghRequest('GET', `/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}?ref=${GH_BRANCH}`, null, token);
    if (get.status !== 200 || !get.body.content) return res.status(502).json({ error: 'waitlist unavailable' });
    let content = Buffer.from(get.body.content, 'base64').toString('utf-8');
    const today = new Date().toISOString().slice(0, 10);

    if (action === 'request') {
      if (content.toLowerCase().includes(wallet.toLowerCase()))
        return res.status(200).json({ ok: true, note: 'already listed' });
      const name    = clean(b.name, 40)  || 'anonymous';
      const why     = clean(b.why, 200)  || '';
      const contact = clean(b.contact, 60) || '';
      content += `- [WAITING] ${today} · ${wallet} · ${name}${why ? ' · ' + why : ''}${contact ? ' · contact: ' + contact : ''}\n`;
      notifyTelegram(`\u{1F91D} <b>PIF request</b>\n${name} — <code>${wallet}</code>\n${why || '(no note)'}`);
    } else if (action === 'reserve') {
      // 2026-08-26 (owner's find): two wallets could fund the SAME waitlist person.
      // Reserving flips [WAITING] -> [RESERVED by X @epoch] BEFORE any money moves;
      // the sha-guarded PUT below is compare-and-swap, so concurrent reserves lose
      // cleanly (409 -> retry -> sees RESERVED -> conflict). A reservation older than
      // 15 MINUTES is re-claimable (owner, 2026-08-27: an hour-long hold made ready
      // sponsors wait behind a walkaway; 15 min still covers a slow human working
      // through the two wallet confirmations, which is what actually spends the clock).
      const by = clean(b.by, 42);
      const nowE = Math.floor(Date.now() / 1000);
      const reW = new RegExp(`^(- )\\[WAITING\\](.*${wallet.slice(2, 10)}.*)$`, 'mi');
      const reR = new RegExp(`^(- )\\[RESERVED by [^\\]@]+ @(\\d+)\\](.*${wallet.slice(2, 10)}.*)$`, 'mi');
      if (reW.test(content)) {
        content = content.replace(reW, `$1[RESERVED by ${by || 'a member'} @${nowE}]$2`);
      } else {
        const m = content.match(reR);
        if (!m) return res.status(404).json({ error: 'not on the waitlist (already gifted?)' });
        if (nowE - Number(m[2]) < 900) return res.status(409).json({ error: 'someone is already gifting this person' });
        content = content.replace(reR, `$1[RESERVED by ${by || 'a member'} @${nowE}]$3`);
      }
    } else if (action === 'unreserve') {
      const reR = new RegExp(`^(- )\\[RESERVED by [^\\]@]+ @\\d+\\](.*${wallet.slice(2, 10)}.*)$`, 'mi');
      if (!reR.test(content)) return res.status(200).json({ ok: true, note: 'nothing to release' });
      content = content.replace(reR, `$1[WAITING]$2`);
    } else {
      const by = clean(b.by, 42);
      // gifted: accepted from WAITING or RESERVED (reserve-first is the normal path now)
      const reAny = new RegExp(`^(- )\\[(?:WAITING|RESERVED by [^\\]]+)\\](.*${wallet.slice(2, 10)}.*)$`, 'mi');
      if (!reAny.test(content)) return res.status(404).json({ error: 'no waiting entry for that wallet' });
      content = content.replace(reAny, `$1[GIFTED by ${by || 'a member'} ${today}]$2`);
      notifyTelegram(`\u{1F49A} <b>PIF gifted</b>\n<code>${wallet}</code> ← ${by}`);
    }

    const put = await ghRequest('PUT', `/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`, {
      message: `pif(${today}): ${action} ${wallet.slice(0, 10)}…`,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      sha: get.body.sha, branch: GH_BRANCH
    }, token);
    if (put.status === 200 || put.status === 201) return res.status(200).json({ ok: true });
    if (put.status !== 409) return res.status(502).json({ error: 'could not save' });
    // 409 -> loop retries with fresh sha
  }
  return res.status(502).json({ error: 'busy, try again' });
}
