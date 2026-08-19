// measure_page_rpc.mjs - HOW MUCH RPC WORK DOES ONE MEMBER PAGE LOAD ACTUALLY DO?
//
// Written 2026-08-19 (session 9), for an owner-reported READ-POOL incident on the live
// V8.48 community site: pages erroring, "ongoing for a while, GETTING WORSE".
//
// check_rpc.ps1 already answered the first question and the answer was clean: all six
// endpoints 200 OK, 127-333ms, head spread 2 blocks, 0 not answering. So endpoint
// HEALTH is not the fault. That leaves the WORKLOAD - a single ping passes while a
// burst of hundreds of sequential calls gets rate-limited, times out, or simply takes
// longer than a member will wait.
//
// ** THIS SCRIPT MEASURES. IT DOES NOT ASSUME. ** The suspicion it was written to test
// is written here so it can be REFUTED rather than confirmed by construction:
//
//   SUSPECT (UNVERIFIED, and the point of the script is to settle it):
//   index.html:2127 sets LOGS_DEPLOY_FLOOR = 44,840,000 and safeGetLogs() walks from the
//   chain head back to that floor in 9,000-block windows, SEQUENTIALLY, with up to 3
//   retries per window. The floor is a V8.46-era first-registration block (see the
//   comment at index.html:8143). The chain head today is ~45.69M. If that is right, each
//   lifetime scan is ~95 sequential requests, several such scans run per dashboard load,
//   and the count grows by ~4.8 windows per scan PER DAY forever, because the head moves
//   ~43,200 blocks/day at 2s and the floor never moves. That growth is the part that
//   would match "getting worse".
//
//   IT IS ARITHMETIC OVER MEASURED NUMBERS UNTIL THIS SCRIPT RUNS, WHICH IS NOT A
//   MEASUREMENT (contracts-repo rule 2, session 8). So: run it, time it, count it.
//
// WHAT IT DOES - all read-only, no chain writes, no wallet, no key:
//   1. Finds each contract's TRUE creation block by binary search on eth_getCode. This
//      is the number the floor should be compared against, and nobody has ever read it.
//   2. Reports windows-needed today at the shipped floor vs at each true creation block.
//   3. RUNS the real lifetime scans a dashboard performs, one at a time, timing each and
//      counting requests, retries and failures. This is the measurement; everything above
//      it is context.
//   4. Reports the daily growth rate, so "getting worse" is a number and not a feeling.
//
// RUN (needs the node_modules already in this folder - ethers 6.17):
//   cd C:\CryptoNova-Testnet-App
//   node measure_page_rpc.mjs
//   node measure_page_rpc.mjs 0xSomeMemberAddress     (optional: scan a specific member)
//
// Takes a few minutes on purpose - it is reproducing what a member's browser is asked
// to do. If it feels slow to watch, that IS the finding.

import { ethers } from 'ethers';
import fs from 'fs';

// ---- READ THE DIAL BACK, do not restate it -------------------------------------------
// A hardcoded copy of LOGS_DEPLOY_FLOOR would keep reporting the OLD floor's cost after
// the shipped value moved, i.e. it would measure a floor nobody serves. Same rule the
// contracts repo learned the hard way ("a dial set is not a dial in force"), and the
// same reason GAS-8 reads minGasPerItem off the contract instead of restating it.
const _idx = fs.readFileSync('index.html', 'utf8');
const _m   = _idx.match(/const\s+LOGS_DEPLOY_FLOOR\s*=\s*(\d+)\s*;/);
if (!_m) { console.error('FATAL: could not find LOGS_DEPLOY_FLOOR in index.html - refusing to guess.'); process.exit(1); }
const LOGS_DEPLOY_FLOOR = Number(_m[1]);
const WINDOW            = 9000;              // safeGetLogs + _getDirectReferrals
const CHAIN_ID          = 84532;

// One endpoint, not the FallbackProvider pool. Measuring through a 5-way shuffled
// fallback would blend five different rate limits into one number and describe none of
// them. EP1 is the site's declared primary (index.html:2052).
const EP1 = 'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/';

const ADDR = {
  cnova:           '0xcd3924C2981C6DeCe022eB592B57E0153d4Ab7d1',
  tierRouter:      '0xD78eD884DE003524c0DeB35b1063c0F86350bf5B',
  communityWallet: '0xC786dbA720C04784d66F38AcCE6b2143e6C78bfF',
};

// A registered member, so the filtered scans have a realistic subject. Default is the
// first DEFAULT_SPONSOR_POOL entry (index.html:2063) - registered by definition, since
// the pool requires it. Override with argv[2].
const MEMBER = process.argv[2] || '0x6512e9B5FE1690F2570AFEE5E7b904EF106C9435';

const net = ethers.Network.from(CHAIN_ID);
const provider = new ethers.JsonRpcProvider(EP1, net, { staticNetwork: net });

// ---- request counter. Every eth_ call the script makes goes through here, so the
//      "requests" column is COUNTED, not derived from the window arithmetic. If the two
//      ever disagree, the disagreement is the finding and the count wins.
let reqCount = 0, reqFailed = 0, reqRetried = 0;
const origSend = provider.send.bind(provider);
provider.send = async (method, params) => { reqCount++; return origSend(method, params); };

const ms = (t) => `${(Number(t) / 1000).toFixed(1)}s`;
const pad = (s, n) => String(s).padEnd(n);

// ---- 1. TRUE CREATION BLOCK, by binary search on eth_getCode ------------------------
// ~20 requests per contract. eth_getCode at a block BEFORE creation returns '0x'.
async function creationBlock(addr, lo, hi) {
  let a = lo, b = hi, found = hi;
  // Guard: if there is no code at the head, the address is wrong and every number
  // below it would be nonsense. Say so rather than returning a confident zero.
  if ((await provider.getCode(addr, hi)) === '0x') return { block: null, note: 'NO CODE AT HEAD - address wrong or self-destructed' };
  while (a <= b) {
    const mid = Math.floor((a + b) / 2);
    let code;
    try { code = await provider.getCode(addr, mid); }
    catch (e) { return { block: null, note: 'getCode failed at ' + mid + ': ' + (e.shortMessage || e.message || '').slice(0, 60) }; }
    if (code && code !== '0x') { found = mid; b = mid - 1; } else { a = mid + 1; }
  }
  return { block: found, note: '' };
}

// ---- 3. THE REAL SCAN, instrumented exactly like safeGetLogs (index.html:2129) ------
// Same window size, same direction (head backwards), same 3-retry policy, same floor
// rule. Deliberately a COPY rather than an import: if this drifts from the page it is
// measuring nothing, so it is written next to the original's line number and should be
// re-checked against it whenever safeGetLogs changes.
async function timedScan(label, contract, filter, floor, head) {
  const t0 = Date.now();
  let windows = 0, failedWindows = 0, retries = 0, events = 0;
  for (let to = head; to >= floor; to -= WINDOW) {
    const from = Math.max(floor, to - WINDOW + 1);
    windows++;
    let got = false;
    for (let a = 0; a < 3 && !got; a++) {
      try { const r = await contract.queryFilter(filter, from, to); events += r.length; got = true; }
      catch (_) { retries++; reqRetried++; await new Promise(r => setTimeout(r, 250 * (a + 1))); }
    }
    if (!got) { failedWindows++; reqFailed++; }
    if (from <= floor) break;
  }
  const el = Date.now() - t0;
  return { label, windows, failedWindows, retries, events, elapsedMs: el, perWindowMs: Math.round(el / Math.max(1, windows)) };
}

(async () => {
  console.log('');
  console.log('PAGE RPC WORKLOAD - live V8.48 read path, measured ' + new Date().toISOString());
  console.log('endpoint: EP1 (site primary), single provider, no fallback pool');
  console.log('member under scan: ' + MEMBER);
  console.log('='.repeat(100));

  const head = await provider.getBlockNumber();
  const shippedWindows = Math.ceil((head - LOGS_DEPLOY_FLOOR) / WINDOW);
  console.log(`chain head ${head}    LOGS_DEPLOY_FLOOR ${LOGS_DEPLOY_FLOOR}  <- READ BACK from index.html, not restated    span ${head - LOGS_DEPLOY_FLOOR} blocks`);
  console.log(`windows per lifetime scan at the shipped floor: ${shippedWindows}`);
  console.log('');

  // ---- creation blocks ----
  console.log('1. TRUE CREATION BLOCK PER CONTRACT (binary search on eth_getCode)');
  console.log(`   ${pad('contract', 18)} ${pad('created at', 12)} ${pad('vs floor', 12)} ${pad('windows now', 12)} ${pad('windows if floored there', 24)} note`);
  const created = {};
  for (const [name, a] of Object.entries(ADDR)) {
    const { block, note } = await creationBlock(a, 1, head);
    created[name] = block;
    if (block == null) { console.log(`   ${pad(name, 18)} ${pad('-', 12)} ${pad('-', 12)} ${pad('-', 12)} ${pad('-', 24)} ${note}`); continue; }
    const delta = block - LOGS_DEPLOY_FLOOR;
    const wIfFloored = Math.ceil((head - block) / WINDOW);
    console.log(`   ${pad(name, 18)} ${pad(block, 12)} ${pad((delta >= 0 ? '+' : '') + delta, 12)} ${pad(shippedWindows, 12)} ${pad(wIfFloored, 24)} ${wIfFloored < shippedWindows ? (shippedWindows - wIfFloored) + ' windows are provably EMPTY' : ''}`);
  }
  console.log('');

  // ---- timed scans ----
  console.log('2. TIMED LIFETIME SCANS - the ones a dashboard load actually performs');
  console.log('   (running them one at a time, sequentially, exactly as the page does)');
  console.log('');

  const TR_ABI    = ['event MemberEnrolled(address indexed member, address indexed sponsor, uint8 tier)'];
  const CNOVA_ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];

  const tr    = new ethers.Contract(ADDR.tierRouter, TR_ABI, provider);
  const cnova = new ethers.Contract(ADDR.cnova, CNOVA_ABI, provider);

  const scans = [];
  scans.push(await timedScan('TierRouter MemberEnrolled(member)  [index.html:6289]', tr, tr.filters.MemberEnrolled(MEMBER), LOGS_DEPLOY_FLOOR, head));
  console.log(`   ${pad(scans[0].label, 52)} ${pad(scans[0].windows + ' windows', 14)} ${pad(ms(scans[0].elapsedMs), 8)} ${scans[0].failedWindows} failed, ${scans[0].retries} retries, ${scans[0].events} events`);

  scans.push(await timedScan('CNOVA Transfer(member -> 0x0) burn [index.html:6900]', cnova, cnova.filters.Transfer(MEMBER, ethers.ZeroAddress), LOGS_DEPLOY_FLOOR, head));
  console.log(`   ${pad(scans[1].label, 52)} ${pad(scans[1].windows + ' windows', 14)} ${pad(ms(scans[1].elapsedMs), 8)} ${scans[1].failedWindows} failed, ${scans[1].retries} retries, ${scans[1].events} events`);

  const totalWindows = scans.reduce((a, s) => a + s.windows, 0);
  const totalMs      = scans.reduce((a, s) => a + s.elapsedMs, 0);
  const perWindow    = Math.round(totalMs / Math.max(1, totalWindows));

  console.log('');
  console.log('3. WHAT A FULL DASHBOARD LOAD COSTS');
  // index.html has SIX lifetime-floor scan sites: :3205 :6194 :6289 :6677 :6900 and the
  // _getDirectReferrals loop at :8148. Two were timed above; the rest have the same shape
  // and the same floor, so the per-window cost measured above is applied to them. THAT
  // MULTIPLICATION IS ARITHMETIC, NOT A MEASUREMENT - it is labelled as such below and
  // must not be quoted as a measured page-load time.
  const SCAN_SITES = 6;
  console.log(`   measured cost per 9,000-block window, this endpoint, right now: ${perWindow} ms`);
  console.log(`   measured windows per lifetime scan: ${scans[0].windows}`);
  console.log(`   PROJECTION (arithmetic, NOT measured): ${SCAN_SITES} scan sites x ${scans[0].windows} windows = ${SCAN_SITES * scans[0].windows} requests, ~${ms(SCAN_SITES * scans[0].windows * perWindow)}`);
  console.log('   Real pages overlap some of these and skip others by wallet state, so treat');
  console.log('   the projection as an upper bound on the sequential path, not a page timing.');
  console.log('');

  console.log('4. WHY IT GETS WORSE, AS A RATE');
  const blocksPerDay  = Math.round(86400 / 2);
  const windowsPerDay = blocksPerDay / WINDOW;
  console.log(`   Base Sepolia is ~2s blocks = ~${blocksPerDay} blocks/day.`);
  console.log(`   The floor is FIXED, so every lifetime scan grows ~${windowsPerDay.toFixed(1)} windows/day.`);
  console.log(`   That is ~${(windowsPerDay * SCAN_SITES).toFixed(0)} more requests per dashboard load per day, and ~${(windowsPerDay * SCAN_SITES * perWindow / 1000).toFixed(1)}s more wall clock per day.`);
  console.log(`   Days since the shipped floor: ${((head - LOGS_DEPLOY_FLOOR) / blocksPerDay).toFixed(1)}.`);
  console.log('');

  console.log('5. COUNTER RECONCILIATION');
  console.log(`   eth_ requests this script actually issued: ${reqCount}`);
  console.log(`   windows walked: ${totalWindows}  (plus ~${Object.keys(ADDR).length * 21} for the creation-block searches and a few for setup)`);
  console.log(`   failed windows: ${reqFailed}   retried windows: ${reqRetried}`);
  console.log('   If failed/retried are ZERO, the endpoint is not refusing us - the cost is');
  console.log('   LATENCY x COUNT, not rate limiting, and the fix is to stop asking so often.');
  console.log('   If they are non-zero, quote them: that is the rate limit, measured.');
  console.log('');

  const out = {
    measuredAt: new Date().toISOString(), endpoint: 'EP1', member: MEMBER, head,
    shippedFloor: LOGS_DEPLOY_FLOOR, windowSize: WINDOW, shippedWindows,
    creationBlocks: created, scans, perWindowMs: perWindow,
    requests: { issued: reqCount, failedWindows: reqFailed, retriedWindows: reqRetried },
  };
  const f = 'page_rpc_workload_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(f, JSON.stringify(out, null, 2));
  console.log('full result written to: ' + f);
  console.log('');
})().catch(e => { console.error('FAILED: ' + (e.stack || e.message || e)); process.exit(1); });
