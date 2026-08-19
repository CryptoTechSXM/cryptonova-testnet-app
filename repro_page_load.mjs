// repro_page_load.mjs - CAN THE BROWSER'S FAILURE BE REPRODUCED OUTSIDE THE BROWSER?
//
// Written 2026-08-19 (session 9). THE DISAGREEMENT THIS EXISTS TO SETTLE:
//
//   the browser, live site   occupancy() -> "missing revert data (data=null, reason=null)"
//   node, check_matrix_calls occupancy() -> 127, on ALL SIX endpoints, code present, agreed
//
// Same call, same address, same chain, opposite answers. Under this project's rules that
// disagreement IS the finding and must be measured rather than explained. check_matrix_calls
// already killed three explanations: the address is right (matches deployed_addresses_v8_48
// .json), the contract has the function (occupancy() returns 127), and the endpoints do not
// disagree with each other (identical answers, six of six).
//
// SO WHAT IS LEFT IS THE DIFFERENCE BETWEEN HOW THE TWO ASK. The probe asked ONE call, on
// ONE provider, on an idle connection. The page asks through a 5-endpoint shuffled
// FallbackProvider (index.html:2760), with ethers' DEFAULT REQUEST BATCHING on, while
// hundreds of eth_getLogs windows are in flight. This script reproduces THAT, because the
// only honest way to find out whether load is the cause is to apply the load.
//
// ⚠ HYPOTHESIS, EXPLICITLY MARKED, because rule 1 says say so out loud when one is
//   necessary: a page-load-shaped burst causes some requests to be rejected, truncated or
//   timed out, and an eth_call caught in that surfaces through ethers as CALL_EXCEPTION
//   with data=null - which is worded "missing revert data" and reads exactly like a
//   contract-level revert. UNVERIFIED. This script is the attempt to make it happen.
//
// ⚠ AND IT CAN FAIL TO REPRODUCE WITHOUT CLEARING THE HYPOTHESIS. Node is not a browser:
//   no CORS preflights, different connection limits, different TLS stack, and a browser
//   caps concurrent connections per host. IF THIS SCRIPT COMES BACK CLEAN, THAT IS NOT A
//   REFUTATION - it means the next instrument is the browser console itself, and the
//   trap-list entry "testing the wrong slice looks like a refutation" applies directly.
//
// THE ARMS. The point is not one run, it is the comparison:
//     node repro_page_load.mjs 44840000     <- what the LIVE site does today
//     node repro_page_load.mjs 45428000     <- what the uncommitted index.html fix does
// If the first reproduces failures and the second does not, cause AND cure are measured
// on one instrument. If both are clean, the floor fix is still worth shipping on its own
// measured merits (3.2x less read work) but it is NOT the fix for this, and saying so
// matters more than having a tidy story.
//
// Read-only. No wallet, no writes.

import { ethers } from 'ethers';
import fs from 'fs';

const CHAIN_ID = 84532;
const net = ethers.Network.from(CHAIN_ID);
const WINDOW = 9000;

const FLOOR = Number(process.argv[2] || 44840000);
if (!Number.isFinite(FLOOR)) { console.error('usage: node repro_page_load.mjs <floorBlock>'); process.exit(1); }

// Exactly index.html's pool, in the same shape: 5 QuickNode shuffled, sepolia LAST.
const QN_POOL = [
  'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/',
  'https://wiser-proportionate-forest.base-sepolia.quiknode.pro/8383659a7c5f035faa091659780d5ba26c50fcf8/',
  'https://cosmopolitan-still-fire.base-sepolia.quiknode.pro/3835d77b733a07e6109ec27774ab3231fbb86c6a/',
  'https://newest-cold-isle.base-sepolia.quiknode.pro/d1082ae239ca62f4fc938014273539074f377e02/',
  'https://side-silent-sheet.base-sepolia.quiknode.pro/4ce4b5665baf27920cda0759814efef5c3172510/',
];
const RPC_EXTRA = 'https://sepolia.base.org';

const ADDR = {
  cnova:      '0xcd3924C2981C6DeCe022eB592B57E0153d4Ab7d1',
  tierRouter: '0xD78eD884DE003524c0DeB35b1063c0F86350bf5B',
  communityWallet: '0xC786dbA720C04784d66F38AcCE6b2143e6C78bfF',
  t1matA:     '0x7154485C8b630d13902CdAeAe80429734f0ac79c',
  t1matB:     '0xB83e7F9fAC5757F3A2e6b6d8385796b64640F170',
};
const MEMBER = process.argv[3] || '0x5179A012b54EE6E6c7db92f820C9b3d8126Eead2';  // the wallet in the screenshots

// Shuffle exactly as the page does, then build the same FallbackProvider. Batching is
// LEFT AT ETHERS' DEFAULT ON PURPOSE - disabling it would remove the very thing under test.
const pool = QN_POOL.slice();
for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
const mk = (u) => new ethers.JsonRpcProvider(u, net, { staticNetwork: net });
const provider = new ethers.FallbackProvider(
  pool.map((u, i) => ({ provider: mk(u), priority: i + 1, weight: 1 }))
      .concat([{ provider: mk(RPC_EXTRA), priority: pool.length + 1, weight: 1 }]),
  net, { quorum: 1 });

const MATRIX_ABI = [
  'function occupancy() view returns (uint256)',
  'function MATRIX_SIZE() view returns (uint256)',
  'function getParkedCount() view returns (uint256)',
  'function totalJoined() view returns (uint256)',
  'function isActiveInMatrix(address) view returns (bool)',
  'function matrixPos(address) view returns (uint256)',
];
const TR_ABI    = ['event MemberEnrolled(address indexed member, address indexed sponsor, uint8 tier)',
                   'event MemberRegistered(address indexed member, uint8 indexed tier, address indexed referrer)',
                   'function getAllTiers() view returns (address[10], uint256[10])'];
const CNOVA_ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];

const failures = [];
const record = (what, e) => {
  const msg = (e && (e.shortMessage || e.message) || String(e)).replace(/\s+/g, ' ');
  failures.push({ what, code: e && e.code, msg: msg.slice(0, 200) });
};

// A lifetime scan, same shape as safeGetLogs (index.html:2129) but WITHOUT the retries,
// because retries hide exactly the failure being hunted. The page's retries are why this
// surfaces to a member as slowness first and an error only when all three fail.
async function scan(contract, filter, head, label) {
  let windows = 0, failed = 0;
  for (let to = head; to >= FLOOR; to -= WINDOW) {
    const from = Math.max(FLOOR, to - WINDOW + 1);
    windows++;
    try { await contract.queryFilter(filter, from, to); }
    catch (e) { failed++; record(`${label} getLogs ${from}-${to}`, e); }
    if (from <= FLOOR) break;
  }
  return { label, windows, failed };
}

(async () => {
  console.log('');
  console.log('PAGE-LOAD REPRODUCTION - ' + new Date().toISOString());
  console.log('floor under test: ' + FLOOR + (FLOOR === 44840000 ? '   <- the LIVE value' : '   <- the FIX'));
  console.log('provider: FallbackProvider, 5 QuickNode shuffled + sepolia last, quorum 1, batching DEFAULT');
  console.log('member: ' + MEMBER);
  console.log('='.repeat(110));

  const head = await provider.getBlockNumber();
  const windowsEach = Math.ceil((head - FLOOR) / WINDOW);
  console.log(`head ${head}   windows per lifetime scan: ${windowsEach}`);
  console.log('');

  const matA  = new ethers.Contract(ADDR.t1matA, MATRIX_ABI, provider);
  const matB  = new ethers.Contract(ADDR.t1matB, MATRIX_ABI, provider);
  const tr    = new ethers.Contract(ADDR.tierRouter, TR_ABI, provider);
  const cnova = new ethers.Contract(ADDR.cnova, CNOVA_ABI, provider);

  // The eth_call set the failing views make. occupancy() is FIRST because it is the one
  // that broke on screen.
  const callSet = async (tag) => {
    const jobs = [
      ['occupancy() matA',    () => matA.occupancy()],
      ['MATRIX_SIZE() matA',  () => matA.MATRIX_SIZE()],
      ['getParkedCount() A',  () => matA.getParkedCount()],
      ['totalJoined() matA',  () => matA.totalJoined()],
      ['occupancy() matB',    () => matB.occupancy()],
      ['isActiveInMatrix',    () => matA.isActiveInMatrix(MEMBER)],
      ['matrixPos',           () => matA.matrixPos(MEMBER)],
      ['getAllTiers',         () => tr.getAllTiers()],
    ];
    const out = await Promise.all(jobs.map(async ([n, f]) => {
      try { const v = await f(); return [n, String(Array.isArray(v) ? 'ok' : v)]; }
      catch (e) { record(`${tag} ${n}`, e); return [n, 'FAIL']; }
    }));
    return out;
  };

  console.log('PHASE 1 - the calls ALONE, no log scans in flight (the control)');
  const before = await callSet('idle');
  console.log('  ' + before.map(([n, v]) => `${n}=${v}`).join('   '));
  console.log('');

  console.log('PHASE 2 - the calls WHILE the page-load log scans run concurrently (the subject)');
  console.log('  firing 6 lifetime scans + the call set together, as a real dashboard load does...');
  const t0 = Date.now();
  const scans = Promise.all([
    scan(tr,    tr.filters.MemberEnrolled(MEMBER), head, 'tr.MemberEnrolled'),
    scan(tr,    tr.filters.MemberRegistered(null, null, MEMBER), head, 'tr.MemberRegistered'),
    scan(cnova, cnova.filters.Transfer(MEMBER, ethers.ZeroAddress), head, 'cnova.Burn'),
    scan(cnova, cnova.filters.Transfer(null, MEMBER), head, 'cnova.In'),
    scan(cnova, cnova.filters.Transfer(MEMBER, null), head, 'cnova.Out'),
    scan(cnova, cnova.filters.Transfer(), head, 'cnova.All'),
  ]);
  // Hit the calls repeatedly WHILE that runs - the page re-reads on tab switches and the
  // status panel auto-refreshes every 12s (visible in the screenshot).
  const during = [];
  for (let i = 0; i < 6; i++) { during.push(await callSet('under-load-' + i)); await new Promise(r => setTimeout(r, 1500)); }
  const scanRes = await scans;
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('');
  console.log('  scan results:');
  for (const s of scanRes) console.log(`    ${s.label.padEnd(24)} ${String(s.windows).padStart(4)} windows  ${s.failed} FAILED`);
  console.log(`  wall clock for the concurrent phase: ${elapsed}s`);
  console.log('');
  console.log('  call results per round (each round = one full call set under load):');
  during.forEach((r, i) => console.log(`    round ${i}: ` + r.map(([n, v]) => `${n.split(' ')[0]}=${v}`).join(' ')));

  console.log('');
  console.log('='.repeat(110));
  console.log(`TOTAL FAILURES: ${failures.length}`);
  const byMsg = {};
  for (const f of failures) { const k = f.code + ' :: ' + f.msg.slice(0, 90); byMsg[k] = (byMsg[k] || 0) + 1; }
  for (const [k, n] of Object.entries(byMsg).sort((a, b) => b[1] - a[1])) console.log(`  x${String(n).padStart(4)}  ${k}`);
  if (!failures.length) {
    console.log('  NONE. Read this carefully: it does NOT clear the hypothesis. Node is not a browser.');
    console.log('  It means the next instrument is the browser console on the failing page, not another');
    console.log('  script. See the header note on "testing the wrong slice looks like a refutation".');
  }
  const hitOccupancy = failures.filter(f => f.what.includes('occupancy')).length;
  console.log('');
  console.log(`occupancy() failures specifically: ${hitOccupancy}  <- this is the screenshot's error; non-zero means REPRODUCED`);
  console.log('');

  const f = `repro_page_load_floor${FLOOR}_` + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(f, JSON.stringify({ floor: FLOOR, head, windowsEach, elapsed, scanRes, failures }, null, 2));
  console.log('full result written to: ' + f);
  console.log('');
})().catch(e => { console.error('FAILED: ' + (e.stack || e.message || e)); process.exit(1); });
