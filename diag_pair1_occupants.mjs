// diag_pair1_occupants.mjs - WHO ARE THE 5 MEMBERS SITTING IN T2 PAIR 1, AND HOW DID THEY GET THERE?
//
// Written 2026-08-19 (session 9), after diag_pair_chain.mjs measured this on live V8.48:
//
//   TIER 2, pair 0 MatA  127/127   rotations 124   joined 249
//   TIER 2, pair 0 MatB  118/127   rotations   0   joined 118
//   TIER 2, pair 1 MatA    5/127   rotations   0   joined   5
//
// ⛔ THE CONTRADICTION, AND IT IS THE WHOLE REASON THIS SCRIPT EXISTS.
//   diag_pair_chain.mjs printed "pair 1 IS receiving graduates - the FIFO chain working as
//   designed". THAT VERDICT WAS WRONG and it was wrong in a way worth recording: it inferred
//   graduates purely from "pair 1 has members" WITHOUT CHECKING THAT THE SOURCE HAD PRODUCED
//   ANY. Pair 0's MatB has rotationCount = 0. It has never rotated, so it has never produced
//   a single cycle-out, so it cannot have graduated ANYONE forward. The five members in pair 1
//   did not arrive by the graduation chain.
//   (Same family as the recorded trap "testing the wrong slice looks like a refutation" -
//   a heuristic that cannot observe the absence of the thing it is asserting.)
//
//   Nor can they be MatA cycle-outs: a MatA root crosses to its OWN partner MatB
//   (MatrixLogicLib:1072 uses chainNext only when !isMatrixA), never to the next pair.
//
// SO BY ELIMINATION they arrived through the DUPLICATE branch - which is exactly what the
// owner recalled: a member who already holds a seat in this pair cannot take a second one
// (V8.46 universal pair guard, MatrixLogicLib:278 rejects a seat in EITHER half), so
// PairManagerV8.registerFor (:561) sends them to _freePairFor() -> the next free pair, and
// _forceExpand()s a new pair if every existing one already holds them.
//
// ELIMINATION IS AN ARGUMENT, NOT A MEASUREMENT. This script tests it directly: enumerate
// pair 1 MatA's occupants and ask pair 0 whether it already holds each of them.
//
//   EVERY occupant also seated in pair 0  -> CONFIRMED. Doubles routed forward, exactly as
//                                            the owner described. Working as designed.
//   NONE of them seated in pair 0         -> REFUTED. They came from somewhere unaccounted
//                                            for, and that is a real finding to chase.
//   MIXED                                 -> read the table; do not average it.
//
//   cd C:\CryptoNova-Testnet-App
//   node diag_pair1_occupants.mjs
//   node diag_pair1_occupants.mjs 1        (tier index, 0-based; default 1 = TIER 2)

import { ethers } from 'ethers';
import fs from 'fs';

const CHAIN_ID = 84532;
const net = ethers.Network.from(CHAIN_ID);
const URL = process.env.RPC || 'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/';
const provider = new ethers.JsonRpcProvider(URL, net, { staticNetwork: net });

const TIER_IDX = Number(process.argv[2] ?? 1);
const TIER_ROUTER = '0xD78eD884DE003524c0DeB35b1063c0F86350bf5B';

const TR_ABI = ['function getAllTiers() view returns (address[10], uint256[10])'];
const PM_ABI = ['function pairCount() view returns (uint256)', 'function getPairAt(uint256) view returns (address,address)'];
const MAT_ABI = [
  'function occupancy() view returns (uint256)',
  'function MATRIX_SIZE() view returns (uint256)',
  'function rotationCount() view returns (uint256)',
  'function posToMember(uint256) view returns (address)',
  'function matrixPos(address) view returns (uint256)',
  'function isActiveInMatrix(address) view returns (bool)',
  'function getMember(address) view returns (tuple(uint256 id, address referrer, uint256 joinedAt, uint256 withdrawable, uint256 totalEarned, uint256 totalWithdrawn, uint256 cyclesCompleted, bool isInMatrix, bool hasEverJoined))',
];

const pad = (s, n) => String(s).padEnd(n);
const shortA = (a) => a && a !== ethers.ZeroAddress ? a.slice(0, 10) + '..' + a.slice(-6) : '-';

(async () => {
  console.log('');
  console.log('PAIR 1 OCCUPANT PROVENANCE - ' + new Date().toISOString());

  const tr = new ethers.Contract(TIER_ROUTER, TR_ABI, provider);
  let pms;
  try { [pms] = await tr.getAllTiers(); }
  catch (e) {
    console.log('  REFUSING TO RUN: state read failed -> ' + (e.shortMessage || e.message || '').slice(0, 80));
    console.log('  Use watch_base_sepolia.mjs until state reads are healthy.');
    process.exit(1);
  }

  const pmAddr = pms[TIER_IDX];
  if (!pmAddr || pmAddr === ethers.ZeroAddress) { console.log(`  tier index ${TIER_IDX} has no pair manager.`); process.exit(1); }
  const pm = new ethers.Contract(pmAddr, PM_ABI, provider);
  const n = Number(await pm.pairCount());
  if (n < 2) { console.log(`  TIER ${TIER_IDX + 1} has ${n} pair - nothing to explain.`); process.exit(0); }

  const [p0A, p0B] = await pm.getPairAt(0);
  const [p1A, p1B] = await pm.getPairAt(1);
  const m0A = new ethers.Contract(p0A, MAT_ABI, provider);
  const m0B = new ethers.Contract(p0B, MAT_ABI, provider);
  const m1A = new ethers.Contract(p1A, MAT_ABI, provider);

  const rot0B = Number(await m0B.rotationCount());
  const occ1A = Number(await m1A.occupancy());
  const size = Number(await m1A.MATRIX_SIZE());

  console.log(`TIER ${TIER_IDX + 1}   pair0 MatB rotations ${rot0B}   pair1 MatA occupancy ${occ1A}/${size}`);
  console.log('');
  if (rot0B === 0) {
    console.log('  pair0 MatB has NEVER rotated -> it has produced ZERO graduates.');
    console.log('  So nobody in pair 1 can have arrived through the FIFO graduation chain.');
  } else {
    console.log(`  pair0 MatB has rotated ${rot0B} times, so graduation IS a possible source.`);
    console.log('  The seat-collision column below still distinguishes the two.');
  }
  console.log('');
  console.log('  ' + pad('pos', 5) + pad('member', 22) + pad('also in p0 MatA', 17) + pad('also in p0 MatB', 17) + pad('cycles', 8) + 'joinedAt');
  console.log('  ' + '-'.repeat(96));

  const rows = [];
  // posToMember indexing: walk a generous range and keep the non-zero hits, rather than
  // assuming 0-based or 1-based. Guessing the base silently returns address(0) and would
  // read as "pair 1 is empty", which is the opposite of what is being measured.
  const seen = new Set();
  for (let pos = 0; pos <= size && rows.length < occ1A; pos++) {
    let who;
    try { who = await m1A.posToMember(pos); } catch { continue; }
    if (!who || who === ethers.ZeroAddress || seen.has(who)) continue;
    seen.add(who);

    let inA = 'ERR', inB = 'ERR', cycles = '-', joined = '-';
    try { inA = (await m0A.isActiveInMatrix(who)) ? 'YES' : 'no'; } catch {}
    try { inB = (await m0B.isActiveInMatrix(who)) ? 'YES' : 'no'; } catch {}
    try { const md = await m1A.getMember(who); cycles = String(md.cyclesCompleted); joined = new Date(Number(md.joinedAt) * 1000).toISOString().slice(0, 16).replace('T', ' '); } catch {}

    rows.push({ pos, member: who, inPair0MatA: inA, inPair0MatB: inB, cycles, joinedAt: joined });
    console.log('  ' + pad(pos, 5) + pad(shortA(who), 22) + pad(inA, 17) + pad(inB, 17) + pad(cycles, 8) + joined);
  }

  const dupes = rows.filter(r => r.inPair0MatA === 'YES' || r.inPair0MatB === 'YES').length;
  console.log('');
  console.log('='.repeat(100));
  console.log(`  occupants found: ${rows.length}    of which ALREADY SEATED in pair 0: ${dupes}`);
  console.log('');
  if (rows.length && dupes === rows.length) {
    console.log('  CONFIRMED - every occupant of pair 1 already holds a seat in pair 0. They could not');
    console.log('  take a second seat in the same pair (universal pair guard, MatrixLogicLib:278), so');
    console.log('  registerFor routed them forward. This is the owner\'s double-entry recollection,');
    console.log('  measured. WORKING AS DESIGNED - a seat instead of a silent park.');
  } else if (rows.length && dupes === 0) {
    console.log('  REFUTED - none of them hold a seat in pair 0, so the duplicate branch did not put');
    console.log('  them there and pair0 MatB produced no graduates either. Their arrival is');
    console.log('  UNACCOUNTED FOR. That is a real finding: check MemberRouted logs on the pair');
    console.log('  manager for these addresses and read the tx that seated each one.');
  } else if (rows.length) {
    console.log('  MIXED - read the table above directly. Do not summarise it into one cause.');
  } else {
    console.log('  NO OCCUPANTS ENUMERATED despite a non-zero occupancy. posToMember indexing may');
    console.log('  differ from the range walked here - fix the walk before drawing any conclusion.');
  }
  console.log('');

  const f = `pair1_occupants_T${TIER_IDX + 1}_` + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(f, JSON.stringify({ tier: TIER_IDX + 1, rot0B, occ1A, rows }, null, 2));
  console.log('full result written to: ' + f);
  console.log('');
})().catch(e => { console.error('FAILED: ' + (e.stack || e.message || e)); process.exit(1); });
