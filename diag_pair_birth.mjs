// diag_pair_birth.mjs - WHY WAS EACH PAIR BORN? THE 90% TRIGGER, OR A DOUBLE WITH NOWHERE TO SIT?
//
// Written 2026-08-19 (session 9). REWRITTEN THE SAME DAY after its first version returned a
// WRONG VERDICT on live data. Both the mistake and the fix are recorded here because the
// mistake is the third instance of one trap in a single session.
//
// ⛔ WHAT V1 GOT WRONG, TWICE OVER:
//
//   MISTAKE 1 - IT COULD NOT DECODE THE EVENTS IT WAS LOOKING FOR. v1 carried a hand-written
//   ABI list and searched the receipt for MemberRegistered / MemberEnrolled. The real
//   signatures on this chain are MemberRegistered(address,uint8,address) and TWO different
//   MemberEnrolled overloads; v1's guesses did not match, so every one of them decoded as
//   unknown(0x...). It then read "no registration found" as evidence of the OTHER path.
//   An instrument that cannot observe X must never report X's absence.
//   Fixed: the topic0 dictionary is now built from the repo's own build ARTIFACTS
//   (artifacts/contracts/**/*.json), so it decodes whatever was actually deployed - 227
//   signatures instead of 9 guesses.
//
//   MISTAKE 2 - AND THIS ONE IS WORSE, BECAUSE THE FIX FOR MISTAKE 1 WOULD NOT HAVE CAUGHT
//   IT. The whole premise was that a REGISTRATION tx means the routine trigger and a
//   CYCLE-OUT tx means the on-demand spawn. That premise is FALSE:
//   `_tryAdvancePair()` is the FIRST STATEMENT of registerDirectFor (:484), registerFor
//   (:532) AND registerForMatB (:508). It runs on EVERY entry path. So the transaction type
//   carries no information about which path created the pair, and v1's "verdict" was
//   decoding real events into a conclusion the data could never support.
//
//   Measured consequence on 2026-08-19: v1 declared PATH B (_forceExpand) for both T1 and T2
//   while its OWN occupancy column read 92.1% and 90.6% - both above the 90% trigger. The two
//   discriminators disagreed and the disagreement was the finding: one of them was broken.
//
// ✅ WHAT ACTUALLY DISCRIMINATES, and it is only one thing:
//   THE PREVIOUS PAIR'S MatB OCCUPANCY AT THE BLOCK BEFORE THE BIRTH.
//     >= factoryExpandThresholdBps  -> _tryAdvancePair() had already fired on its own terms.
//                                      The routine trigger explains the birth. _forceExpand
//                                      cannot even be reached afterwards, because the fresh
//                                      empty pair gives _freePairFor() somewhere to point.
//     <  factoryExpandThresholdBps  -> the routine trigger did NOT fire, so the only
//                                      remaining creator is _forceExpand() - a member seated
//                                      in every existing pair, spawned one rather than be
//                                      parked. That is the owner's double-entry case.
//   Needs ARCHIVE state. If the endpoint refuses historical reads the script says UNKNOWN;
//   it does NOT fall back to the transaction shape, because that is what went wrong.
//
// The transaction contents are still printed - they are genuinely useful context (which
// member, registration vs upgrade, whether a park happened in the same tx) - but they are
// labelled CONTEXT, not evidence, and no verdict is derived from them.
//
// ⚠ SEPARATE QUESTION, DO NOT CONFLATE: what CREATED a pair and what FILLED it are two
//   different things. On 2026-08-19 T2.2 was CREATED by the routine trigger, yet all five of
//   its occupants were doubles routed forward by the duplicate branch (proved by
//   diag_pair1_occupants.mjs: 5 of 5 already seated in T2.1's MatB). Both mechanisms were
//   real; they simply fired in that order, in the same transaction, which is exactly why it
//   looks from outside like the double created the pair.
//
//   cd C:\CryptoNova-Testnet-App
//   node diag_pair_birth.mjs
//   RPC=<archive url> node diag_pair_birth.mjs

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const CHAIN_ID = 84532;
const net = ethers.Network.from(CHAIN_ID);
const URL = process.env.RPC || 'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/';
const provider = new ethers.JsonRpcProvider(URL, net, { staticNetwork: net });

const TIER_ROUTER = '0xD78eD884DE003524c0DeB35b1063c0F86350bf5B';
const FROM_BLOCK = Number(process.env.FROM || 45428000);
const WINDOW = 9000;
const ARTIFACTS = process.env.ARTIFACTS || 'C:\\CryptoNite-Smart-Contracts\\CryptoNova\\artifacts\\contracts';

const TR_ABI = ['function getAllTiers() view returns (address[10], uint256[10])'];
const PM_ABI = [
  'event PairAdded(uint256 indexed pairId, address matrixA, address matrixB)',
  'function pairCount() view returns (uint256)',
  'function getPairAt(uint256) view returns (address,address)',
  'function factoryExpandThresholdBps() view returns (uint256)',
];
const MAT_ABI = ['function occupancy() view returns (uint256)', 'function MATRIX_SIZE() view returns (uint256)'];

// ---- topic0 -> signature, built from the repo's OWN artifacts. No guessing. ----
function buildTopicMap(root) {
  const map = {};
  const walk = (d) => {
    let entries; try { entries = fs.readdirSync(d); } catch { return; }
    for (const f of entries) {
      const p = path.join(d, f);
      let st; try { st = fs.statSync(p); } catch { continue; }
      if (st.isDirectory()) { walk(p); continue; }
      if (!f.endsWith('.json') || f.endsWith('.dbg.json')) continue;
      try {
        const a = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (!a.abi) continue;
        for (const e of a.abi) {
          if (e.type !== 'event') continue;
          const sig = e.name + '(' + e.inputs.map(i => i.type).join(',') + ')';
          map[ethers.id(sig).slice(0, 10)] ||= sig;
        }
      } catch { }
    }
  };
  walk(root);
  return map;
}

const pad = (s, n) => String(s).padEnd(n);

(async () => {
  console.log('');
  console.log('PAIR BIRTH FORENSICS - ' + new Date().toISOString());

  const TOPICS = buildTopicMap(ARTIFACTS);
  console.log(`event signatures indexed from artifacts: ${Object.keys(TOPICS).length}` +
    (Object.keys(TOPICS).length < 50 ? '   ⚠ SUSPICIOUSLY FEW - check ARTIFACTS path; context below will be unreadable' : ''));

  const tr = new ethers.Contract(TIER_ROUTER, TR_ABI, provider);
  let pms;
  try { [pms] = await tr.getAllTiers(); }
  catch (e) {
    console.log('  REFUSING TO RUN: state read failed -> ' + (e.shortMessage || e.message || '').slice(0, 80));
    process.exit(1);
  }

  const head = await provider.getBlockNumber();
  console.log(`head ${head}   scanning from ${FROM_BLOCK}`);
  console.log('='.repeat(118));

  const report = [];
  for (let t = 0; t < pms.length; t++) {
    if (!pms[t] || pms[t] === ethers.ZeroAddress) continue;
    const pm = new ethers.Contract(pms[t], PM_ABI, provider);
    let n, facBps;
    try { n = Number(await pm.pairCount()); facBps = Number(await pm.factoryExpandThresholdBps()); } catch { continue; }
    if (n < 2) { console.log(`\nTIER ${t + 1}: ${n} pair - nothing to explain.`); continue; }

    console.log(`\nTIER ${t + 1}   pairs ${n}   trigger ${facBps / 100}% of newest MatB`);

    const added = [];
    for (let a = FROM_BLOCK; a <= head; a += WINDOW) {
      const b = Math.min(a + WINDOW - 1, head);
      try { added.push(...await pm.queryFilter(pm.filters.PairAdded(), a, b)); } catch { }
    }

    for (const ev of added) {
      const pairId = Number(ev.args.pairId);
      if (pairId === 0) continue;
      console.log(`\n  --- pair ${pairId} born at block ${ev.blockNumber}   tx ${ev.transactionHash}`);

      // ---- THE DISCRIMINATOR ----
      let verdict = 'UNKNOWN', occTxt = 'unavailable';
      try {
        const [, prevB] = await pm.getPairAt(pairId - 1);
        const mb = new ethers.Contract(prevB, MAT_ABI, provider);
        const occ = Number(await mb.occupancy({ blockTag: ev.blockNumber - 1 }));
        const size = Number(await mb.MATRIX_SIZE({ blockTag: ev.blockNumber - 1 }));
        const pct = size ? occ * 100 / size : 0;
        occTxt = `${occ}/${size} = ${pct.toFixed(1)}%`;
        verdict = pct >= facBps / 100
          ? 'ROUTINE TRIGGER - _tryAdvancePair() fired on its own terms (it runs first on every entry path)'
          : 'ON-DEMAND SPAWN - below the trigger, so only _forceExpand() explains this (the double-entry case)';
      } catch (e) {
        verdict = 'UNKNOWN - historical state unavailable (' + (e.shortMessage || e.message || '').slice(0, 40) + '). Rerun with an ARCHIVE endpoint. Do NOT infer from the context below.';
      }
      console.log(`      previous MatB at birth-1: ${occTxt}`);
      console.log(`      VERDICT: ${verdict}`);

      // ---- CONTEXT ONLY. Deliberately printed AFTER the verdict and never fed into it. ----
      try {
        const rc = await provider.getTransactionReceipt(ev.transactionHash);
        const counts = {};
        for (const log of rc.logs) {
          const sig = TOPICS[log.topics[0].slice(0, 10)] || `unknown(${log.topics[0].slice(0, 10)})`;
          counts[sig] = (counts[sig] || 0) + 1;
        }
        const notable = Object.entries(counts)
          .filter(([k]) => /Member|Pair|Upgrade|Parked|Cycled|Routed/.test(k))
          .sort((a, b) => b[1] - a[1]);
        console.log('      CONTEXT (not evidence - _tryAdvancePair runs on every entry path):');
        for (const [k, v] of notable) console.log(`         ${pad(k, 62)} x${v}`);
      } catch (e) { console.log('      context: receipt read failed'); }

      report.push({ tier: t + 1, pairId, block: ev.blockNumber, tx: ev.transactionHash, occupancyAtBirth: occTxt, verdict });
    }
  }

  console.log('');
  console.log('='.repeat(118));
  console.log('  Remember: what CREATED a pair and what FILLED it are different questions.');
  console.log('  diag_pair1_occupants.mjs answers the second one.');
  console.log('');
  const f = 'pair_birth_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(f, JSON.stringify(report, null, 2));
  console.log('full result written to: ' + f);
  console.log('');
})().catch(e => { console.error('FAILED: ' + (e.stack || e.message || e)); process.exit(1); });
