/**
 * api/get-reports.js
 * Returns parsed open + resolved bug reports from BUGS.md on the admin branch.
 * Password-protected (same BUG_REPORT_PASSWORD as submit-bug.js).
 *
 * Required Vercel env vars:
 *   BUG_REPORT_PASSWORD  — shared password
 *   GITHUB_TOKEN         — fine-grained PAT with Contents: Read on cryptonova-testnet-app
 */

const GH_OWNER  = 'CryptoTechSXM';
const GH_REPO   = 'cryptonova-testnet-app';
const GH_BRANCH = 'admin';
const GH_FILE   = 'BUGS.md';

function parseOpenIssues(section) {
  const issues = [];
  const blocks = section.split(/(?=### \[)/);
  for (const block of blocks) {
    const header = block.match(/^### \[(\d{4}-\d{2}-\d{2})\] (.+)/);
    if (!header) continue;
    const get = (label) => {
      const m = block.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`));
      return m ? m[1].trim() : '';
    };
    issues.push({
      date:          header[1],
      title:         header[2].trim(),
      reporter:      get('Reporter'),
      page:          get('Page'),
      wallet:        get('Wallet Type'),
      walletAddress: get('Wallet Address'),
      frequency:     get('Frequency'),
      happened:      get('What happened'),
      expected:      get('What was expected'),
      notes:         get('Notes'),
      submitted:     get('Submitted'),
    });
  }
  return issues;
}

function parseResolvedIssues(section) {
  const rows = [];
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 5) continue;
    if (cells[0] === 'Date Reported' || /^-+$/.test(cells[0])) continue;
    rows.push({
      dateReported: cells[0],
      dateFixed:    cells[1],
      page:         cells[2],
      summary:      cells[3],
      commit:       cells[4],
    });
  }
  return rows;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const PASS  = process.env.BUG_REPORT_PASSWORD;
  const TOKEN = process.env.GITHUB_TOKEN;

  if (!PASS || !TOKEN) {
    console.error('Missing BUG_REPORT_PASSWORD or GITHUB_TOKEN');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const { password } = req.body || {};
  if (password !== PASS) return res.status(401).json({ error: 'Incorrect password' });

  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}?ref=${GH_BRANCH}`;
  const r = await fetch(url, {
    headers: {
      Authorization:          `Bearer ${TOKEN}`,
      Accept:                 'application/vnd.github+json',
      'User-Agent':           'CryptoNova-Reports/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!r.ok) {
    const t = await r.text();
    console.error('GitHub GET failed:', r.status, t);
    return res.status(502).json({ error: 'Could not read BUGS.md' });
  }

  const data    = await r.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');

  const parts        = content.split('## Resolved Issues');
  const openSection  = parts[0] || '';
  const resolvedSection = parts[1] || '';

  const openIssues     = parseOpenIssues(openSection);
  const resolvedIssues = parseResolvedIssues(resolvedSection);

  return res.status(200).json({
    openCount:      openIssues.length,
    resolvedCount:  resolvedIssues.length,
    total:          openIssues.length + resolvedIssues.length,
    openIssues,
    resolvedIssues,
    fetchedAt:      new Date().toUTCString(),
  });
}
