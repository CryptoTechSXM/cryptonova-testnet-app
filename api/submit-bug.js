/**
 * api/submit-bug.js
 * Receives bug reports from bug-report.html and commits them to BUGS.md
 * via the GitHub API.
 *
 * Required Vercel env vars:
 *   BUG_REPORT_PASSWORD  — shared password for the bug report page
 *   GITHUB_TOKEN         — fine-grained PAT with Contents: Read+Write
 *                          on the cryptonova-testnet-app repo
 */

import https from 'https';

const GH_OWNER  = 'CryptoTechSXM';
const GH_REPO   = 'cryptonova-testnet-app';
const GH_BRANCH = 'admin';
const GH_FILE   = 'BUGS.md';

// ── GitHub API helper ─────────────────────────────────────────────────────────
function ghRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        Authorization:           `Bearer ${token}`,
        Accept:                  'application/vnd.github+json',
        'User-Agent':            'CryptoNova-BugReport/1.0',
        'X-GitHub-Api-Version':  '2022-11-28',
        ...(data ? {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(data)
        } : {})
      }
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : {} }); }
        catch (e) { resolve({ status: res.statusCode, body: {} }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Build the markdown entry ──────────────────────────────────────────────────
function buildEntry({ reporter, page, wallet, frequency, happened, expected, notes }) {
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toUTCString();
  const title = happened.length > 60 ? happened.slice(0, 60) + '…' : happened;

  const lines = [
    `### [${date}] ${page} — ${title}`,
    `- **Reporter:** ${reporter}`,
    `- **Page:** ${page}`,
    `- **Wallet:** ${wallet}`,
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
  if (markerIdx === -1) {
    // No section found — append at end
    return current.trimEnd() + '\n\n' + entry;
  }

  const afterMarker = markerIdx + MARKER.length;
  const checkSlice  = current.slice(afterMarker, afterMarker + PLACEHOLDER.length);

  if (checkSlice === PLACEHOLDER) {
    // Replace placeholder with new entry
    return (
      current.slice(0, afterMarker) +
      '\n\n' + entry +
      current.slice(afterMarker + PLACEHOLDER.length)
    );
  }

  // Already has entries — prepend after the header line
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

  const { action, password, reporter, page, wallet, frequency, happened, expected, notes } = req.body || {};

  // ── Auth ──
  if (password !== PASS) return res.status(401).json({ error: 'Incorrect password' });

  // ── Verify only ──
  if (action === 'verify') return res.status(200).json({ ok: true });

  // ── Submit ──
  if (action === 'submit') {
    if (!reporter || !page || !wallet || !frequency || !happened || !expected) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Fetch current BUGS.md
    const getRes = await ghRequest(
      'GET',
      `/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}?ref=${GH_BRANCH}`,
      null,
      TOKEN
    );
    if (getRes.status !== 200) {
      console.error('GitHub GET failed:', getRes.status, getRes.body);
      return res.status(502).json({ error: 'Could not read BUGS.md from GitHub' });
    }

    const sha     = getRes.body.sha;
    const current = Buffer.from(getRes.body.content, 'base64').toString('utf8');

    // 2. Build and insert entry
    const entry   = buildEntry({ reporter, page, wallet, frequency, happened, expected, notes });
    const updated = insertEntry(current, entry);

    // 3. Commit back
    const date      = new Date().toISOString().slice(0, 10);
    const shortPage = page.split(' ')[0];
    const putRes = await ghRequest(
      'PUT',
      `/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`,
      {
        message: `bug-report(${date}): ${shortPage} reported by ${reporter}`,
        content: Buffer.from(updated).toString('base64'),
        sha,
        branch: GH_BRANCH
      },
      TOKEN
    );

    if (putRes.status !== 200 && putRes.status !== 201) {
      console.error('GitHub PUT failed:', putRes.status, putRes.body);
      return res.status(502).json({ error: 'Failed to save bug report to GitHub' });
    }

    console.log(`Bug report committed: ${date} — ${page} — ${reporter}`);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
};
