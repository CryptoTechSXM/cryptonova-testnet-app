// diag_pair_chain.mjs - IS THE PAIR/GRADUATION CHAIN BEHAVING AS DESIGNED?
//
// Written 2026-08-19 (session 9). Owner observation, live V8.48:
//   "T2.2 opened and started filling before T2.1 was completely filled, and T1.1 is still
//    taking members and cycling while T1.2 is on standby like it should - so something
//    got skewed in that deploy, maybe something reverted."
//
// ⚠ RUN THIS ONLY WHEN BASE SEPOLIA STATE READS ARE BACK. During the 2026-08-19 outage
//   eth_call returns HTTP 503 on every provider and every number below would be absent.
//   watch_base_sepolia.mjs says when it has recovered. A diagnostic run against a broken
//   RPC prints confident nonsense, which is the failure mode this repo has been bitten by
//   before (diag_parked_growth.js and its dead addresses file).
//
// WHAT THE CODE SAYS BEFORE ANY NUMBER IS READ - so the measurement can REFUTE it:
//
//   1. NEW ENTRIES ALWAYS GO TO PAIR 0. PairManagerV8._findExternalPair() is
//      `return 0;` - literally pure, no branch (:760). Every registration path and every
//      upgrade path calls registerFor(..., 0). So "T1.1 still taking members" is CORRECT
//      and is not evidence of anything being skewed.
//   2. PAIR N+1 IS DEPLOYED EARLY, ON PURPOSE. _tryAutoExpand fires at
//      factoryExpandThresholdBps = 9000, i.e. 90% of the NEWEST MatB - not when the pair
//      is full. The comment states the intent: it "fires BEFORE MatB fills completely, so
//      the next pair's MatA is ready to receive the first MatB graduate".
//   3. GRADUATES FLOW FORWARD. MatrixLogicLib:943 - cycling out of a MatB, the
//      destination is `chainNext`, which addPair() wires to the NEXT pair's MatA.
//
//   Taken together, "pair 2 filling before pair 1 is 100% full" is the DESIGNED FIFO
//   chain, not a regression. WHICH RAISES THE OPPOSITE QUESTION, and it is the one this
//   script is really for:
//
//   ⚠ WHY IS T1.2 EMPTY? T1.1 measured MatA 127/127 and MatB 126/127 earlier today - a
//     pair that full should be GRADUATING members forward into T1.2. It is not. There
//     were also 109 parked members at the same moment.
//     HYPOTHESIS, UNVERIFIED: T1's MatB roots are not graduating, they are PARKING -
//     they cycle out, cannot fund the A->B crossing, and land in the parked queue instead
//     of moving on. That is the exact problem V8.50 item A + E1 exist to fix, and if it is
//     true then T1.2-on-standby is the SYMPTOM and T2.2-filling is the HEALTHY case - the
//     opposite way round from how it looks.
//     This script does not assume that. It prints what each pair actually holds, what its
//     chainNext is wired to, and how many are parked where, so the answer is read off the
//     table.
//
// Read-only. No wallet, no writes.
//
//   cd C:\CryptoNova-Testnet-App
//   node diag_pair_chain.mjs

import { ethers } from 'ethers';
import fs from 'fs';

const CHAIN_ID = 84532;
const net = ethers.Network.from(CHAIN_ID);
const URL = process.env.RPC || 'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/';
const provider = new ethers.JsonRpcProvider(URL, net, { staticNetwork: net });

const TIER_ROUTER = '0xD78eD884DE003524c0DeB35b1063c0F86350bf5B';

const TR_ABI = ['function getAllTiers() view returns (address[10], uint256[10])'];
const PM_ABI = [
  'function pairCount() view returns (uint256)',
  'function getPairAt(uint256) view returns (address,address)',
  'function activePairIndex() view returns (uint256)',
  'function factoryExpandThresholdBps() view returns (uint256)',
  'function expandThresholdBps() view returns (uint256)',
];
const MAT_ABI = [
  'function occupancy() view returns (uint256)',
  'function MATRIX_SIZE() view returns (uint256)',
  'function rotationCount() view returns (uint256)',
  'function totalJoined() view returns (uint256)',
  'function getParkedCount() view returns (uint256)',
  'function chainNext() view returns (address)',
  'function partner() view returns (address)',
  'function pairIndex() view returns (uint256)',
];

const short = (a) => (a && a !== ethers.ZeroAddress) ? a.slice(0, 8) + '..' + a.slice(-4) : '-';
const pad = (s, n) => String(s).padEnd(n);
const num = async (p, label) => { try { return Number(await p); } catch (e) { return `ERR(${label})`; } };

(async () => {
  console.log('');
  console.log('PAIR / GRADUATION CHAIN DIAGNOSTIC - ' + new Date().toISOString());

  // Refuse rather than print nonsense if state reads are still down.
  try {
    const probe = new ethers.Contract(TIER_ROUTER, TR_ABI, provider);
    await probe.getAllTiers();
  } catch (e) {
    console.log('');
    console.log('  REFUSING TO RUN: a state read failed -> ' + (e.shortMessage || e.message || '').slice(0, 90));
    console.log('  Base Sepolia state reads were down on 2026-08-19 (eth_call HTTP 503 on all providers).');
    console.log('  Run watch_base_sepolia.mjs until it reports three clean samples, then retry.');
    console.log('');
    process.exit(1);
  }

  const tr = new ethers.Contract(TIER_ROUTER, TR_ABI, provider);
  const [pms, fees] = await tr.getAllTiers();
  console.log('head block ' + (await provider.getBlockNumber()));
  console.log('='.repeat(120));

  const report = [];
  for (let t = 0; t < pms.length; t++) {
    if (!pms[t] || pms[t] === ethers.ZeroAddress) continue;
    const pm = new ethers.Contract(pms[t], PM_ABI, provider);
    let n, active, facBps;
    try {
      n = Number(await pm.pairCount());
      active = Number(await pm.activePairIndex());
      facBps = Number(await pm.factoryExpandThresholdBps());
    } catch (e) { console.log(`T${t + 1}: PM read failed - ${(e.shortMessage || e.message || '').slice(0, 60)}`); continue; }

    console.log('');
    console.log(`TIER ${t + 1}   fee $${(Number(fees[t]) / 1e6).toFixed(2)}   pairs ${n}   activePairIndex ${active}   factoryExpandThreshold ${facBps / 100}% of newest MatB`);
    console.log('  ' + pad('pair', 6) + pad('half', 6) + pad('occupancy', 13) + pad('rotations', 11) + pad('totalJoined', 13) + pad('parked', 8) + pad('chainNext ->', 16) + 'address');
    console.log('  ' + '-'.repeat(112));

    const tierRows = [];
    for (let i = 0; i < n; i++) {
      let a, b;
      try { [a, b] = await pm.getPairAt(i); } catch (e) { console.log(`  pair ${i}: getPairAt failed`); continue; }
      for (const [half, addr] of [['MatA', a], ['MatB', b]]) {
        if (!addr || addr === ethers.ZeroAddress) continue;
        const m = new ethers.Contract(addr, MAT_ABI, provider);
        const occ = await num(m.occupancy(), 'occ');
        const size = await num(m.MATRIX_SIZE(), 'size');
        const rot = await num(m.rotationCount(), 'rot');
        const tj = await num(m.totalJoined(), 'tj');
        const pk = await num(m.getParkedCount(), 'parked');
        let cn = '-'; try { cn = await m.chainNext(); } catch {}
        const row = { tier: t + 1, pair: i, half, addr, occ, size, rot, totalJoined: tj, parked: pk, chainNext: cn };
        tierRows.push(row);
        console.log('  ' + pad(i, 6) + pad(half, 6) + pad(`${occ}/${size}`, 13) + pad(rot, 11) + pad(tj, 13) + pad(pk, 8) + pad(short(cn), 16) + short(addr));
      }
    }
    report.push({ tier: t + 1, pairCount: n, activePairIndex: active, factoryExpandThresholdBps: facBps, rows: tierRows });
  }

  // ---- the two questions, answered off the table above ----
  console.log('');
  console.log('='.repeat(120));
  console.log('READ IT THIS WAY');
  console.log('');
  for (const T of report) {
    if (T.pairCount < 2) continue;
    const p0B = T.rows.find(r => r.pair === 0 && r.half === 'MatB');
    const p1A = T.rows.find(r => r.pair === 1 && r.half === 'MatA');
    if (!p0B || !p1A) continue;
    const p0Bpct = (typeof p0B.occ === 'number' && p0B.size) ? (p0B.occ * 100 / p0B.size).toFixed(0) : '?';
    console.log(`  T${T.tier}: pair0 MatB ${p0B.occ}/${p0B.size} (${p0Bpct}%), rotations ${p0B.rot}  ->  pair1 MatA holds ${p1A.occ}, rotations ${p1A.rot}`);
    if (typeof p1A.occ === 'number' && p1A.occ > 0) {
      console.log(`       pair 1 IS receiving graduates. That is the FIFO chain working as designed`);
      console.log(`       (MatrixLogicLib:943 sends a MatB cycle-out to chainNext = next pair's MatA).`);
    } else {
      console.log(`       pair 1 is EMPTY. If pair0 MatB is near full and rotating, graduates are not`);
      console.log(`       arriving - check the parked column: members may be PARKING at the crossing`);
      console.log(`       instead of graduating forward. That is the V8.50 item A / E1 problem, not a`);
      console.log(`       routing defect, and it is the opposite of "pair 2 opened too early".`);
    }
  }
  const totalParked = report.flatMap(T => T.rows).reduce((a, r) => a + (typeof r.parked === 'number' ? r.parked : 0), 0);
  console.log('');
  console.log(`  TOTAL PARKED ACROSS ALL MATRICES: ${totalParked}`);
  console.log('  Parked members are the ones who cycled out and could NOT fund the next crossing.');
  console.log('  A high number here with an empty pair 1 is the graduation chain being starved, not');
  console.log('  misrouted - and no amount of pair-routing change fixes it.');
  console.log('');
  console.log('  CHAIN WIRING CHECK: every MatB\'s chainNext should be the NEXT pair\'s MatA, and the');
  console.log('  LAST MatB should point back to pair 0 MatA (addPair wires the circle). Compare the');
  console.log('  chainNext column against the address column above - a MatB pointing at the wrong');
  console.log('  MatA is a genuine deploy-wiring defect and would look exactly like "skewed".');
  console.log('');

  const f = 'pair_chain_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(f, JSON.stringify(report, null, 2));
  console.log('full result written to: ' + f);
  console.log('');
})().catch(e => { console.error('FAILED: ' + (e.stack || e.message || e)); process.exit(1); });
