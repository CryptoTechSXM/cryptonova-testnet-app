/**
 * api/submit-bug.js
 * Receives bug reports from bug-report.html and commits them to BUGS.md
 * via the GitHub API. Uses built-in fetch (Node 18+) — no imports needed.
 *
 * Required Vercel env vars:
 *   BUG_REPORT_PASSWORD  — shared password for the bug report page
 *   GITHUB_TOKEN         — fine-grained PAT with Contents: Read+Write
 *                          on the cryptonova-testnet-app repo
 */

const GH_OWNER  = 'CryptoTechSXM';
const GH_REPO   = 'cryptonova-testnet-app';
// ⛔ MEMBER-WRITTEN DATA LIVES ON `data` — A BRANCH VERCEL NEVER DEPLOYS (s45,
// 2026-08-28). Every write below is a real git commit, so while this pointed at
// `admin` EVERY member action was a Vercel deployment: 121 of the last 300
// commits on admin were API-written, which exhausted the Hobby plan's 100
// deployments/day and silently stopped the real site from updating — pushes
// succeeded in git and produced no deployment, with no error anywhere.
// vercel.json sets git.deploymentEnabled:{"data": false}, so these commits now
// create no deployment at all. ⛔ The Ignored Build Step is NOT the fix — Vercel
// counts canceled builds as full deployments against the same quota. If this
// constant is ever pointed back at a deployable branch, the cap comes back with
// it, and all three API files must move together.
const GH_BRANCH = 'data';
const GH_FILE   = 'BUGS.md';

// ── GitHub API helper (uses built-in fetch) ───────────────────────────────────
async function ghRequest(method, path, body, token) {
  const url  = `https://api.github.com${path}`;
  const opts = {
    method,
    headers: {
      Authorization:          `Bearer ${token}`,
      Accept:                 'application/vnd.github+json',
      'User-Agent':           'CryptoNova-BugReport/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  const r    = await fetch(url, opts);
  const text = await r.text();
  try { return { status: r.status, body: text ? JSON.parse(text) : {} }; }
  catch (e) { return { status: r.status, body: {} }; }
}

// ── Canonical funding list (session 36, 2026-08-24) ───────────────────────────
// Owner: "any new wallet that submits a bug gets added."
//
// WHY THIS EXISTS. Three funding lists had drifted apart — this repo's, the keepers
// repo's, and the owner's own document — and the wallets that fell through the gaps
// were the BUG REPORTERS: Sherwyn (more accepted bounties than anyone), @Koach100/
// June, @queensonnie, Cynthia Brown, CryptoJan22. They found the bugs and they were
// the ones never funded, and every funding run still printed a clean summary because
// a run cannot report a wallet it was never told about. Adding the reporter HERE, at
// the moment they report, is the one point in the system where that cannot be
// forgotten again.
//
// ⛔ BEST-EFFORT, EXACTLY LIKE THE SCREENSHOT UPLOAD ABOVE. This runs AFTER BUGS.md
//    is saved and NEVER throws. A bug report must never be lost because a list update
//    failed: an un-added wallet can be added by hand, a lost report cannot be
//    recovered. Every outcome is logged and none of them blocks the response.
//
// ⚠ THE ADDRESS IS USER-SUPPLIED AND THIS PAGE USES ONE SHARED PASSWORD, so anyone
//   holding it can put any address in here. On testnet that buys mock USDC and
//   nothing else. Auto-added lines are tagged `# auto <date>` precisely so they can
//   be reviewed, audited or stripped — do not silently trust them into mainnet.
const FUND_FILE = 'fund_list.txt';

async function addToFundList(walletAddress, reporter, token) {
  try {
    if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(String(walletAddress).trim())) {
      return 'no valid wallet on the report';
    }
    const addr = String(walletAddress).trim();

    // Two attempts: a 409 means another report committed between our GET and PUT.
    for (let attempt = 0; attempt < 2; attempt++) {
      const get = await ghRequest(
        'GET',
        `/repos/${GH_OWNER}/${GH_REPO}/contents/${FUND_FILE}?ref=${GH_BRANCH}`,
        null,
        token
      );
      if (get.status !== 200) return `list unreadable (${get.status})`;
      const current = Buffer.from(get.body.content, 'base64').toString('utf8');

      // Case-insensitive: the file mixes EIP-55 and lowercase entries by design.
      if (current.toLowerCase().includes(addr.toLowerCase())) return 'already listed';

      const date = new Date().toISOString().slice(0, 10);
      const who  = String(reporter || 'unknown').replace(/[\r\n#]/g, ' ').trim().slice(0, 40);
      const line = `${addr}  # auto ${date} — bug report by ${who}`;
      const updated = current.replace(/\s*$/, '\n') + line + '\n';

      const put = await ghRequest(
        'PUT',
        `/repos/${GH_OWNER}/${GH_REPO}/contents/${FUND_FILE}`,
        {
          message: `fund-list(${date}): add ${addr.slice(0, 10)}… — reported a bug`,
          content: Buffer.from(updated).toString('base64'),
          branch:  GH_BRANCH,
          sha:     get.body.sha
        },
        token
      );

      if (put.status === 200 || put.status === 201) return 'added';
      if (put.status !== 409) return `put failed (${put.status})`;
    }
    return 'conflicted twice — NOT added, add by hand';
  } catch (e) {
    console.error('fund-list update failed:', e && e.message);
    return 'threw — NOT added, add by hand';
  }
}

// ── Build the markdown entry ──────────────────────────────────────────────────
function buildEntry({ reporter, page, wallet, walletAddress, frequency, happened, expected, steps, notes, screenshotPath, screenshotError }) {
  const date  = new Date().toISOString().slice(0, 10);
  const time  = new Date().toUTCString();
  const title = happened.length > 60 ? happened.slice(0, 60) + '…' : happened;

  const lines = [
    `### [${date}] ${page} — ${title}`,
    `- **Reporter:** ${reporter}`,
    `- **Page:** ${page}`,
    `- **Wallet Type:** ${wallet}`,
    `- **Wallet Address:** ${walletAddress || 'not provided'}`,
    `- **Frequency:** ${frequency}`,
    `- **What happened:** ${happened}`,
    `- **What was expected:** ${expected}`,
  ];
  // 'steps' is new as of 2026-08-19 (@bevmawire reported the form advertising a
  // "steps to reproduce" it never had). OLD CLIENTS DO NOT SEND IT, and a cached
  // bug-report.html will keep not sending it for as long as the browser holds it — so this
  // stays optional and absent means absent. Do NOT make it required on this side.
  // Multi-line by nature, so it goes in a fenced block rather than on the bullet line,
  // where a newline would break the markdown list.
  if (steps && steps.trim()) {
    lines.push(`- **Steps to reproduce:**`);
    lines.push('');
    lines.push('  ```');
    for (const ln of steps.trim().split(/\r?\n/)) lines.push('  ' + ln);
    lines.push('  ```');
  }
  if (notes && notes.trim()) lines.push(`- **Notes:** ${notes.trim()}`);
  // A LINK, NOT AN EMBED. `![](...)` would render every screenshot full-size inline and
  // make BUGS.md unscrollable within a dozen reports.
  if (screenshotPath) lines.push(`- **Screenshot:** [${screenshotPath.split('/').pop()}](${screenshotPath})`);
  // ⛔ SAY SO WHEN IT FAILED. The member ticked the box, chose a file and was told the
  // report went in. If the image did not make it, the report must carry that fact - or the
  // next person to read this entry concludes no screenshot was ever offered.
  else if (screenshotError) lines.push(`- **Screenshot:** member attached one but it did not upload (${screenshotError}) - ask them for it`);
  lines.push(`- **Submitted:** ${time}`);
  lines.push('');
  return lines.join('\n');
}

// ── Insert entry into BUGS.md ─────────────────────────────────────────────────
function insertEntry(current, entry) {
  const MARKER      = '## Open Issues';
  const PLACEHOLDER = '\n\n_No open issues yet._';

  const markerIdx = current.indexOf(MARKER);
  if (markerIdx === -1) return current.trimEnd() + '\n\n' + entry;

  const afterMarker = markerIdx + MARKER.length;
  const checkSlice  = current.slice(afterMarker, afterMarker + PLACEHOLDER.length);

  if (checkSlice === PLACEHOLDER) {
    return (
      current.slice(0, afterMarker) +
      '\n\n' + entry +
      current.slice(afterMarker + PLACEHOLDER.length)
    );
  }
  return current.slice(0, afterMarker) + '\n\n' + entry + current.slice(afterMarker);
}

// ── Vercel handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const PASS  = process.env.BUG_REPORT_PASSWORD;

  if (!PASS) {
    console.error('Missing BUG_REPORT_PASSWORD env var');
    return res.status(500).json({ error: 'Server misconfigured — contact admin' });
  }

  const body = req.body || {};
  const { action, password, reporter, page, wallet, walletAddress, frequency, happened, expected, steps, notes,
          screenshot, screenshotName } = body;

  // ── Auth ──
  if (password !== PASS) return res.status(401).json({ error: 'Incorrect password' });

  // ── Verify only ──
  if (action === 'verify') return res.status(200).json({ ok: true });

  // ── Submit ──
  if (action === 'submit') {
    const TOKEN = process.env.GITHUB_TOKEN;
    if (!TOKEN) {
      console.error('Missing GITHUB_TOKEN env var');
      return res.status(500).json({ error: 'Server misconfigured — contact admin' });
    }
    if (!reporter || !page || !wallet || !frequency || !happened || !expected) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ── SCREENSHOT UPLOAD (owner decision 2026-08-19: keep it simple, store it in the repo,
    //    revert later if it ever becomes a problem) ────────────────────────────────────────
    // ⛔ THE REPORT MUST SURVIVE A FAILED UPLOAD. This runs BEFORE BUGS.md is touched and
    // NEVER throws: any failure is recorded as screenshotError and the report is written
    // anyway. A member who took the trouble to attach a picture must not lose their whole
    // bug report because the image did not go through - and the entry has to SAY the
    // screenshot is missing, or whoever reads it later concludes none was offered.
    // Worst case is an orphaned image in bug-screenshots/ if the BUGS.md write then fails,
    // which is cheap and obvious. The other order would lose reports.
    let screenshotPath = null, screenshotError = null;
    if (screenshot && typeof screenshot === 'string' && screenshot.length > 0) {
      try {
        // base64 inflates by 4/3. Vercel caps a serverless request body at 4.5MB and the
        // browser already downscales to ~1200px JPEG, so anything arriving above 3MB did
        // not come from our form.
        const approxBytes = Math.round(screenshot.length * 3 / 4);
        if (approxBytes > 3 * 1024 * 1024) {
          screenshotError = `too large (${Math.round(approxBytes / 1024)} KB)`;
        } else if (!/^[A-Za-z0-9+/=\r\n]+$/.test(screenshot)) {
          // Not base64. Refuse rather than commit whatever it is.
          screenshotError = 'not valid image data';
        } else {
          const stamp = new Date().toISOString().replace(/[:.]/g, '-');
          const safe  = String(screenshotName || 'shot')
            .replace(/\.[A-Za-z0-9]+$/, '')          // drop the original extension
            .replace(/[^A-Za-z0-9._-]/g, '_')        // path-safe, no traversal
            .slice(0, 40) || 'shot';
          const p = `bug-screenshots/${stamp}-${safe}.jpg`;
          const up = await ghRequest(
            'PUT',
            `/repos/${GH_OWNER}/${GH_REPO}/contents/${p}`,
            {
              message: `bug-report screenshot (${new Date().toISOString().slice(0, 10)})`,
              content: screenshot,
              branch:  GH_BRANCH
            },
            TOKEN
          );
          if (up.status >= 200 && up.status < 300) screenshotPath = p;
          else screenshotError = `upload failed (HTTP ${up.status})`;
        }
      } catch (e) {
        screenshotError = 'upload threw';
        console.error('screenshot upload failed:', e && e.message);
      }
    }

    const getRes = await ghRequest(
      'GET',
      `/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}?ref=${GH_BRANCH}`,
      null,
      TOKEN
    );

    let sha     = null;
    let current = '';

    if (getRes.status === 200) {
      sha     = getRes.body.sha;
      current = Buffer.from(getRes.body.content, 'base64').toString('utf8');
    } else if (getRes.status === 404) {
      current = [
        '# CryptoNova — Issue Tracker',
        '',
        '## Open Issues',
        '',
        '_No open issues yet._',
        '',
        '---',
        '',
        '## Resolved Issues',
        '',
        '| Date Reported | Date Fixed | Page | Summary | Commit |',
        '|---|---|---|---|---|',
        '',
      ].join('\n');
    } else {
      console.error('GitHub GET failed:', getRes.status, getRes.body);
      return res.status(502).json({ error: 'Could not read BUGS.md from GitHub' });
    }

    const entry   = buildEntry({ reporter, page, wallet, walletAddress, frequency, happened, expected, steps, notes,
                                 screenshotPath, screenshotError });
    const updated = insertEntry(current, entry);

    const date      = new Date().toISOString().slice(0, 10);
    const shortPage = page.split(' ')[0];
    const putRes = await ghRequest(
      'PUT',
      `/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`,
      {
        message: `bug-report(${date}): ${shortPage} — new report`,
        content: Buffer.from(updated).toString('base64'),
        branch:  GH_BRANCH,
        ...(sha ? { sha } : {})
      },
      TOKEN
    );

    if (putRes.status !== 200 && putRes.status !== 201) {
      console.error('GitHub PUT failed:', putRes.status, putRes.body);
      return res.status(502).json({ error: 'Could not save report — try again' });
    }

    // ── Add the reporter's wallet to the canonical funding list ────────────────
    // Runs only after BUGS.md is safely committed, so a wallet is never added for a
    // report that did not survive. Best-effort: the outcome is logged, never thrown.
    const fundResult = await addToFundList(walletAddress, reporter, TOKEN);
    console.log(`fund-list: ${fundResult} (${walletAddress || 'no address given'})`);

    // ── Telegram admin notification (best-effort — never blocks the response) ──
    const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_CHAT  = process.env.TELEGRAM_CHAT_ID;
    if (TG_TOKEN && TG_CHAT) {
      const shortSummary = happened.length > 100 ? happened.slice(0, 100) + '…' : happened;
      const addrShort    = walletAddress ? walletAddress.slice(0,6) + '…' + walletAddress.slice(-4) : 'n/a';
      const tgMsg = [
        `🐛 <b>New Bug Report</b>`,
        ``,
        `👤 <b>Reporter:</b> ${reporter}`,
        `📄 <b>Page:</b> ${page}`,
        `💳 <b>Wallet:</b> ${wallet} (${addrShort})`,
        `⚡ <b>Frequency:</b> ${frequency}`,
        `📝 ${shortSummary}`,
        // Surfaced so an auto-add is VISIBLE. A wallet quietly added to the funding
        // list is the same silent failure as a wallet quietly missing from it.
        ...(fundResult === 'added'         ? [``, `✅ <b>Funding list:</b> wallet added`] :
            fundResult === 'already listed' ? [] :
                                              [``, `⚠️ <b>Funding list:</b> ${fundResult}`]),
        ``,
        `🔗 <a href="https://admin.crypto-nova.app/reports">View all reports</a>`,
      ].join('\n');
      fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: TG_CHAT, text: tgMsg, parse_mode: 'HTML',
                                  disable_web_page_preview: true }),
      }).catch(e => console.warn('TG notify failed:', e.message));
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
