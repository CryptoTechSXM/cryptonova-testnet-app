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
function buildEntry({ reporter, page, wallet, walletAddress, frequency, happened, expected, notes }) {
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
  if (notes && notes.trim()) lines.push(`- **Notes:** ${notes.trim()}`);
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
  const TOKEN = process.env.GITHUB_TOKEN;

  if (!PASS || !TOKEN) {
    console.error('Missing BUG_REPORT_PASSWORD or GITHUB_TOKEN env var');
    return res.status(500).json({ error: 'Server misconfigured — contact admin' });
  }

  const body = req.body || {};
  const { action, password, reporter, page, wallet, walletAddress, frequency, happened, expected, notes } = body;

  // ── Auth ──
  if (password !== PASS) return res.status(401).json({ error: 'Incorrect password' });

  // ── Verify only ──
  if (action === 'verify') return res.status(200).json({ ok: true });

  // ── Submit ──
  if (action === 'submit') {
    if (!reporter || !page || !wallet || !frequency || !happened || !expected) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    const entry   = buildEntry({ reporter, page, wallet, walletAddress, frequency, happened, expected, notes });
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

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
