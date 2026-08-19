// watch_base_sepolia.mjs - IS BASE SEPOLIA SERVING STATE READS AGAIN YET?
//
// Written 2026-08-19 (session 9), during a confirmed upstream Base Sepolia incident.
//
// WHAT WAS ESTABLISHED, with a control, so nobody re-diagnoses this from scratch:
//   eth_blockNumber  WORKS   - heads fresh and advancing on all six endpoints
//   eth_getCode      HTTP503 - on QuickNode AND on Coinbase's sepolia.base.org
//   eth_call         HTTP503 - same
//   Base MAINNET and Ethereum Sepolia, same machine, same minute: eth_getCode and
//   eth_call both fine. So the network path is clean and the fault is Base Sepolia's.
//
// Onset was inside one session: 15:20 UTC occupancy() = 127; 15:54 UTC everything ERR.
//
// WHY A SAMPLER AND NOT A SINGLE RE-CHECK. The owner reported this as "ongoing for a
// while, getting worse", which is the signature of an INTERMITTENT fault, and a single
// green read would say "recovered" for a service that is flapping. One sample is not a
// measurement. This polls on an interval and prints a run of results so recovery is
// judged on a streak, not a lucky call.
//
//   cd C:\CryptoNova-Testnet-App
//   node watch_base_sepolia.mjs            (default: every 60s until stopped)
//   node watch_base_sepolia.mjs 30         (every 30s)
//
// Ctrl+C to stop. Appends every sample to base_sepolia_watch.csv so the outage window
// has a record with timestamps - useful for the QuickNode ticket and for telling members
// when it actually came back.

import fs from 'fs';

const EVERY = Number(process.argv[2] || 60) * 1000;
const CSV = 'base_sepolia_watch.csv';

const EPS = [
  ['QuickNodeEP1', 'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/'],
  ['CoinbasePub',  'https://sepolia.base.org'],
];
// T1 MatA occupancy() - our own contract, the exact call that broke on screen.
const ADDR = '0x7154485C8b630d13902CdAeAe80429734f0ac79c';
const SEL  = '0x3f728455';

const post = async (url, body, ms = 12000) => {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal });
    return { http: r.status, txt: await r.text() };
  } catch (e) { return { http: 'NETERR', txt: (e.message || '').slice(0, 60) }; }
  finally { clearTimeout(t); }
};

const sample = async (url) => {
  const bn = await post(url, { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] });
  const ec = await post(url, { jsonrpc: '2.0', id: 2, method: 'eth_call', params: [{ to: ADDR, data: SEL }, 'latest'] });
  let head = '-', call = `HTTP ${ec.http}`;
  try { head = String(parseInt(JSON.parse(bn.txt).result, 16)); } catch {}
  if (ec.http === 200) {
    try { const j = JSON.parse(ec.txt); call = j.error ? `ERR ${j.error.code}` : String(parseInt(j.result, 16)); } catch { call = 'NON-JSON'; }
  }
  return { head, call };
};

if (!fs.existsSync(CSV)) fs.writeFileSync(CSV, 'utc,endpoint,head,occupancyCall\n');

console.log('');
console.log('BASE SEPOLIA STATE-READ WATCH - sampling every ' + (EVERY / 1000) + 's. Ctrl+C to stop.');
console.log('occupancy() on T1 MatA. A NUMBER means state reads are back. 127 is the healthy value.');
console.log('appending to ' + CSV);
console.log('');
console.log('utc                  ' + EPS.map(e => e[0].padEnd(18)).join(''));
console.log('-'.repeat(60));

let okStreak = 0;
const tick = async () => {
  const now = new Date().toISOString().slice(11, 19);
  const res = [];
  for (const [, u] of EPS) res.push(await sample(u));
  const allOk = res.every(r => /^\d+$/.test(r.call));
  okStreak = allOk ? okStreak + 1 : 0;
  console.log(now.padEnd(21) + res.map(r => String(r.call).padEnd(18)).join('') +
    (allOk ? `  <- state reads OK (streak ${okStreak})` : ''));
  const utc = new Date().toISOString();
  for (let i = 0; i < EPS.length; i++) fs.appendFileSync(CSV, `${utc},${EPS[i][0]},${res[i].head},${res[i].call}\n`);
  if (okStreak === 3) {
    console.log('');
    console.log('  THREE CONSECUTIVE CLEAN SAMPLES ON BOTH OPERATORS. That is a recovery, not a lucky');
    console.log('  read. Reload the site and confirm the dashboard paints numbers before telling members.');
    console.log('');
  }
};

await tick();
setInterval(tick, EVERY);
