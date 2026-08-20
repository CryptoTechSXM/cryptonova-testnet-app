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
const GH_BRANCH = 'admin';
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
