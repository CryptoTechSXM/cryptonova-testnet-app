// check_matrix_calls.mjs - WHY DOES occupancy() COME BACK "missing revert data"?
//
// Written 2026-08-19 (session 9) against a live, owner-reported, customer-facing fault on
// the V8.48 community site. The Matrix Tree View renders:
//
//     Error: missing revert data (action="call", data=null, reason=null,
//     transaction={ "data": "0x3f728455", "to": "0x7154485C8b630d1...
//
// DECODED, not guessed: 0x3f728455 is the selector of occupancy(), and it was computed
// from index.html's own MATRIX_ABI rather than looked up anywhere. The target is Tier-1
// MatA, and that address MATCHES scripts/deployed_addresses_v8_48.json exactly, so a
// stale address in the frontend is already ruled out. occupancy() also exists in
// FigureEightMatrixV8.sol:824. So the call is right and the address is right, which means
// the answer is on the chain side and has to be read off it.
//
// WHAT "missing revert data" ACTUALLY MEANS IN ETHERS v6 - all four are live candidates
// and this script separates them, because they have completely different fixes:
//
//   A. NO CODE AT THE ADDRESS at the block queried. eth_call to an EOA returns 0x, which
//      ethers reports exactly like a bare revert. Fix: addresses/deploy.
//   B. CODE PRESENT but no function with that selector (deployed from a build that
//      predates occupancy()). Fix: redeploy or drop the call. This is the activateLayer
//      class of defect, which this codebase has already been bitten by once.
//   C. THE CALL IS FINE AND THE ENDPOINT IS NOT. A node that is behind, on a fork, or
//      erroring returns something ethers wraps as this same message. Fix: the pool.
//   D. Only SOME endpoints fail. That is the worst shape and the easiest to misread,
//      because index.html shuffles a 5-endpoint FallbackProvider on every page load
//      (index.html:2760) - so the SAME page would work or fail depending on which
//      endpoint that load happened to land on. It would read as "intermittent", and
//      "intermittent" is what gets diagnosed as "flaky RPC" and never fixed.
//
// D is the one that would explain BOTH screenshots at once (a hard error on the Matrix
// view AND "the RPC node didn't respond after several retries" on the dashboard), so it
// is deliberately the thing this script is built to expose: EVERY endpoint is asked the
// SAME question and the answers are printed side by side. A disagreement between two
// endpoints is not noise to average out - it IS the finding.
//
// Read-only. No wallet, no writes, no keys beyond the endpoint URLs already public in
// the page source.
//
//   cd C:\CryptoNova-Testnet-App
//   node check_matrix_calls.mjs

import { ethers } from 'ethers';
import fs from 'fs';

const CHAIN_ID = 84532;
const net = ethers.Network.from(CHAIN_ID);

const ENDPOINTS = [
  ['EP1 cnova-site',   'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/'],
  ['EP5 cnova-site-2', 'https://wiser-proportionate-forest.base-sepolia.quiknode.pro/8383659a7c5f035faa091659780d5ba26c50fcf8/'],
  ['EP2',              'https://cosmopolitan-still-fire.base-sepolia.quiknode.pro/3835d77b733a07e6109ec27774ab3231fbb86c6a/'],
  ['EP3',              'https://newest-cold-isle.base-sepolia.quiknode.pro/d1082ae239ca62f4fc938014273539074f377e02/'],
  ['EP4',              'https://side-silent-sheet.base-sepolia.quiknode.pro/4ce4b5665baf27920cda0759814efef5c3172510/'],
  ['sepolia.base.org', 'https://sepolia.base.org'],
];

// From scripts/deployed_addresses_v8_48.json, confirmed identical to index.html's block.
const T1_MATA = '0x7154485C8b630d13902CdAeAe80429734f0ac79c';
const T1_MATB = '0xB83e7F9fAC5757F3A2e6b6d8385796b64640F170';
const T1_PM   = '0x1798Bf5146af86654A71F72434b70FB017349C6e';
const TIER_ROUTER = '0xD78eD884DE003524c0DeB35b1063c0F86350bf5B';

// The exact calls the failing views make.
const CALLS = [
  ['occupancy()',      T1_MATA, '0x3f728455'],
  ['MATRIX_SIZE()',    T1_MATA, null],
  ['getParkedCount()', T1_MATA, null],
  ['totalJoined()',    T1_MATA, null],
  ['occupancy()  MatB',T1_MATB, null],
];

const IFACE = new ethers.Interface([
  'function occupancy() view returns (uint256)',
  'function MATRIX_SIZE() view returns (uint256)',
  'function getParkedCount() view returns (uint256)',
  'function totalJoined() view returns (uint256)',
  'function getAllTiers() view returns (address[10], uint256[10])',
]);

const pad = (s, n) => String(s).padEnd(n);
const short = (s, n) => { s = String(s); return s.length > n ? s.slice(0, n - 1) + '~' : s; };

async function probe(url) {
  const p = new ethers.JsonRpcProvider(url, net, { staticNetwork: net });
  const out = { head: null, codeLen: {}, calls: {}, err: null };
  try { out.head = await p.getBlockNumber(); } catch (e) { out.err = e.shortMessage || e.message; return out; }

  for (const [label, addr] of [['matA', T1_MATA], ['matB', T1_MATB], ['pm', T1_PM], ['tierRouter', TIER_ROUTER]]) {
    try { const c = await p.getCode(addr); out.codeLen[label] = (c.length - 2) / 2; }
    catch (e) { out.codeLen[label] = 'ERR'; }
  }

  for (const [name, addr] of CALLS) {
    const fn = name.replace(/\s+MatB$/, '');
    try {
      const data = IFACE.encodeFunctionData(fn.replace('()', ''), []);
      const raw = await p.call({ to: addr, data });
      if (raw === '0x') { out.calls[name] = 'EMPTY 0x'; continue; }
      out.calls[name] = String(IFACE.decodeFunctionResult(fn.replace('()', ''), raw)[0]);
    } catch (e) {
      out.calls[name] = 'ERR: ' + short((e.shortMessage || e.message || '').replace(/\s+/g, ' '), 40);
    }
  }
  // The Status page's "0 active tiers" comes from here, so ask it too.
  try {
    const raw = await p.call({ to: TIER_ROUTER, data: IFACE.encodeFunctionData('getAllTiers', []) });
    const dec = IFACE.decodeFunctionResult('getAllTiers', raw);
    out.calls['getAllTiers() non-zero'] = dec[0].filter(a => a !== ethers.ZeroAddress).length;
  } catch (e) {
    out.calls['getAllTiers() non-zero'] = 'ERR: ' + short((e.shortMessage || e.message || '').replace(/\s+/g, ' '), 40);
  }
  return out;
}

(async () => {
  console.log('');
  console.log('MATRIX CALL PROBE - every endpoint asked the SAME question, ' + new Date().toISOString());
  console.log('T1 MatA ' + T1_MATA + '   (matches deployed_addresses_v8_48.json)');
  console.log('='.repeat(118));

  const results = [];
  for (const [name, url] of ENDPOINTS) {
    const r = await probe(url);
    results.push([name, r]);
    if (r.err) { console.log(pad(name, 18) + ' UNREACHABLE: ' + r.err); continue; }
    console.log(pad(name, 18) + ' head ' + pad(r.head, 10) +
      ' code bytes: matA ' + pad(r.codeLen.matA, 7) + ' matB ' + pad(r.codeLen.matB, 7) +
      ' pm ' + pad(r.codeLen.pm, 7) + ' tierRouter ' + r.codeLen.tierRouter);
  }

  console.log('');
  console.log('CALL RESULTS');
  const callNames = [...CALLS.map(c => c[0]), 'getAllTiers() non-zero'];
  console.log(pad('call', 22) + ENDPOINTS.map(e => pad(short(e[0], 15), 17)).join(''));
  console.log('-'.repeat(118));
  for (const cn of callNames) {
    console.log(pad(cn, 22) + results.map(([, r]) => pad(short(r.err ? 'UNREACHABLE' : r.calls[cn], 15), 17)).join(''));
  }

  console.log('');
  console.log('READ IT THIS WAY:');
  console.log('  matA code bytes 0 everywhere  -> case A: nothing is deployed at that address. Addresses/deploy problem.');
  console.log('  code present, occupancy() ERR -> case B: deployed build has no occupancy(). Redeploy or stop calling it.');
  console.log('  all endpoints agree and WORK  -> the fault is not here; it is load/timeout, and the LOGS_DEPLOY_FLOOR');
  console.log('                                   fix already made is the lead. Re-test the page after deploying it.');
  console.log('  ENDPOINTS DISAGREE            -> case D, the important one. index.html shuffles a 5-endpoint pool per');
  console.log('                                   page load, so a bad member of the pool makes the SAME page work or');
  console.log('                                   fail at random. Name the bad endpoint and drop it from the pool.');
  console.log('');

  const f = 'matrix_call_probe_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(f, JSON.stringify(results.map(([n, r]) => ({ endpoint: n, ...r })), null, 2));
  console.log('full result written to: ' + f);
  console.log('');
})().catch(e => { console.error('FAILED: ' + (e.stack || e.message || e)); process.exit(1); });
