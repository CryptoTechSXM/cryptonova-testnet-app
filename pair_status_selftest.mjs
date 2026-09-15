// pair_status_selftest.mjs -- session 83, 2026-09-15. Handoff 62.57 item 8.
//
// WHAT THIS PINS: the per-pair status label in the Live Stats table
// (renderPairSubRows in index.html). On 2026-09-15 that table told 127 members of
// T4.3 -- a pair measured frozen, MatA 127/127 with ZERO rotations and MatB 0/127 --
// to wait for a crossing, and labelled T5.2 "Rotating" while it had not turned.
//
// HOW IT CANNOT DRIFT FROM THE SHIPPED PAGE: it does not copy the ladder. It READS
// index.html, slices the status block out between the same two anchors, and runs
// THAT text. If the page changes, this test changes with it or it stops parsing.
// Same rule as frozen_matrix_check.selftest.js requiring the shipped file.
//
// Run:  node pair_status_selftest.mjs        (in C:\CryptoNova-Testnet-App)
import { readFileSync } from 'node:fs';

const HTML = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const A = '    const MS = _MATRIX_SIZE ?? Infinity;';
const B = `'<span style="color:var(--text3);font-size:11px">\u23f3 New</span>';`;
const s = HTML.indexOf(A);
const e = HTML.indexOf(B, s);
if (s < 0 || e < 0) { console.error('ANCHORS NOT FOUND -- the status block moved. Fix this test, do not delete it.'); process.exit(1); }
const BLOCK = HTML.slice(s, e + B.length);
const grade = new Function('occA', 'occB', 'occupancyA', 'isActive', '_MATRIX_SIZE', 'TU',
  BLOCK + '\n  return status;');

// label() strips the markup so a case reads as the member reads it.
const label = (html) => html.replace(/<[^>]*>/g, '').replace(/&#9940;/g, '\u26d4').replace(/&mdash;/g, '\u2014').trim();
const tip = (html) => (html.match(/title="([^"]*)"/) || [, ''])[1];

// BASIS FOR THE LIVE CASES: frozen_matrix_check.js, book deployed_addresses_v8_52.json,
// census runs 2 and 3 of 2026-09-15 (fleet_20260915/freeze_census_run{2,3}.log), 42
// matrices read, 0 unreadable. Where a number was not read in that census it is marked
// ASSUMED and the case is written so the verdict does not depend on it.
const CASES = [
  // --- the two pairs that were mislabelled on screen -------------------------------
  { n: 'T4.3 LIVE: MatA 127/127 rot 0, MatB 0/127, T4.4 open at 10 -- was "Awaiting crossings"',
    a: 127, b: 0, tier: [127, 127, 127, 10], active: false, TU: 'T4', ms: 127,
    want: '\u23f8\ufe0f Waiting on T4.4' },
  { n: 'T5.2 LIVE: MatA 127/127 rot 116 frozen, MatB 116/127, T5.3 open at 52 -- was "Rotating"',
    a: 127, b: 116, tier: [127, 127, 52], active: false, TU: 'T5', ms: 127,
    want: '\u23f8\ufe0f Waiting on T5.3' },
  { n: 'T5.2 again with T5.1 MatA ASSUMED not full -- verdict must still be queued, only the name moves',
    a: 127, b: 116, tier: [100, 127, 52], active: false, TU: 'T5', ms: 127,
    want: '\u23f8\ufe0f Waiting on T5.1' },
  // --- pair 0 is the front door and is never queued ---------------------------------
  { n: 'T4.1 LIVE: pair 0, both halves full, 655 rotations -- full, and still the door',
    a: 127, b: 127, tier: [127, 127, 127, 10], active: true, TU: 'T4', ms: 127,
    want: '\u2705 Full' },
  { n: 'pair 0, MatA full, MatB partial -- Active, never "waiting"',
    a: 127, b: 60, tier: [127, 10], active: true, TU: 'T1', ms: 127,
    want: '\ud83d\udfe2 Active' },
  // --- the structural state: a later pair full in BOTH halves ------------------------
  { n: 'later pair full in both halves -- stage 1 has no MatA room, stage 2 skips on bOcc>=bSize',
    a: 127, b: 127, tier: [127, 127, 127], active: false, TU: 'T2', ms: 127,
    want: '\u26d4 Full \u2014 not receiving' },
  { n: 'later pair full in both halves EVEN WHILE another pair has room -- still not receiving',
    a: 127, b: 127, tier: [127, 127, 3], active: false, TU: 'T2', ms: 127,
    want: '\u26d4 Full \u2014 not receiving' },
  // --- the only case where "Awaiting crossings" is a true sentence -------------------
  { n: 'later pair, MatA full, MatB empty, NO pair in the tier has room -- genuinely in line',
    a: 127, b: 0, tier: [127, 127, 127], active: false, TU: 'T3', ms: 127,
    want: '\u23f3 Awaiting crossings' },
  { n: 'later pair, MatA full, MatB partial, no room anywhere -- turning',
    a: 127, b: 60, tier: [127, 127], active: false, TU: 'T3', ms: 127,
    want: '\ud83d\udd04 Rotating' },
  // --- 126/127 is a transient, not full (census run 2 killed the "rests at 126" claim) -
  { n: 'MatB at 126/127 must NEVER read as full -- it is one seat short, not deadlocked',
    a: 127, b: 126, tier: [127, 127], active: false, TU: 'T4', ms: 127,
    want: '\ud83d\udd04 Rotating' },
  // --- fill states unchanged ---------------------------------------------------------
  { n: 'empty deployed-ahead pair -- standby buffer',
    a: 0, b: 0, tier: [127, 0], active: false, TU: 'T6', ms: 127,
    want: '\ud83d\udfe1 Standby buffer' },
  { n: 'later pair still filling its MatA -- New, and never queued behind anyone',
    a: 10, b: 0, tier: [127, 127, 127, 10], active: false, TU: 'T4', ms: 127,
    want: '\u23f3 New' },
  // --- 62.13: an unread MATRIX_SIZE must claim NOTHING ------------------------------
  { n: 'MATRIX_SIZE unread (null): a 127/0 later pair must not be called blocked or queued',
    a: 127, b: 0, tier: [127, 127, 10], active: false, TU: 'T4', ms: null,
    want: '\u23f3 New' },
  { n: 'MATRIX_SIZE unread (null): a both-full-looking later pair must not be called blocked',
    a: 127, b: 127, tier: [127, 127], active: false, TU: 'T4', ms: null,
    want: '\u23f3 New' },
];

let pass = 0, fail = 0;
for (const c of CASES) {
  let got, err = null;
  try { got = label(grade(c.a, c.b, c.tier, c.active, c.ms, c.TU)); }
  catch (ex) { err = ex.message; }
  const ok = !err && got === c.want;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.n}`);
  if (!ok) console.log(`      want: ${JSON.stringify(c.want)}\n      got : ${JSON.stringify(err || got)}`);
}

// Every amber/red state must carry an explanation, or we have replaced one bare string
// with another. Checked, not assumed.
const NEEDS_TIP = [
  ['queued', 127, 0, [127, 127, 10], false, 'T4'],
  ['blocked', 127, 127, [127, 127], false, 'T4'],
  ['awaiting', 127, 0, [127, 127], false, 'T4'],
  ['turning', 127, 60, [127, 127], false, 'T4'],
];
for (const [name, a, b, tier, active, TU] of NEEDS_TIP) {
  const t = tip(grade(a, b, tier, active, 127, TU));
  const ok = t.length > 40;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} state carries a tooltip a member can act on (${t.length} chars)`);
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
