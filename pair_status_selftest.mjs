// pair_status_selftest.mjs -- session 83, 2026-09-15. Handoff 62.57 item 8.
//
// WHAT THIS PINS: the pair-state decision behind BOTH pair renderers in
// index.html -- the Live Stats table (renderPairSubRows) and the tier strip.
// On 2026-09-15 the table told 127 members of T4.3 -- measured frozen, Matrix A
// 127/127 with ZERO rotations -- to wait for a crossing, and after that was fixed
// the owner's screenshots showed the tier strip on the SAME page still calling
// that pair "open", i.e. telling members there was room in it.
//
// HOW IT CANNOT DRIFT FROM THE PAGE: it does not copy the logic. It READS
// index.html, slices out the shipped _pairStateOf function, and runs THAT text.
// It also checks that every state that function can return has a label in BOTH
// renderers' maps, so a new state can never render as undefined on one of them.
// Same rule as frozen_matrix_check.selftest.js requiring the shipped file.
//
// Run:  node pair_status_selftest.mjs        (in C:\CryptoNova-Testnet-App)
import { readFileSync } from 'node:fs';

const HTML = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

const fs0 = HTML.indexOf('function _pairStateOf(');
const fs1 = HTML.indexOf('\n}\n', fs0);
if (fs0 < 0 || fs1 < 0) { console.error('_pairStateOf NOT FOUND in index.html -- fix this test, do not delete it.'); process.exit(1); }
const SRC = HTML.slice(fs0, fs1 + 2);
const pairStateOf = new Function(SRC + '\n return _pairStateOf;')();

const slice = (from) => { const i = HTML.indexOf(from); return i < 0 ? '' : HTML.slice(i, i + 1800); };
const LABELS_SRC = slice('const LABELS = {');
const STRIP_SRC  = slice('const STRIP = {');

let pass = 0, fail = 0;
const check = (name, ok, extra) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok && extra) console.log('      ' + extra); };

// BASIS: the live admin.crypto-nova.app render of 2026-09-15 (owner screenshots),
// V8.52 book. Matrix A occupancies, Matrix B occupancies, front door = index 0.
const FLEET = {
  T1: { a: [127, 127, 127], b: [127, 126,  53] },
  T2: { a: [127, 127, 127], b: [126, 126,  25] },
  T3: { a: [127, 127, 127], b: [126, 126,  12] },
  T4: { a: [127, 127, 127, 10], b: [126, 115, 0, 0] },
  T5: { a: [127, 127,  52], b: [126, 116,  0] },
};
// What each pair MUST be called, and why.
const EXPECT = {
  'T1.1': 'front-door', 'T1.2': 'turning',  'T1.3': 'turning',
  'T2.1': 'front-door', 'T2.2': 'turning',  'T2.3': 'turning',
  'T3.1': 'front-door', 'T3.2': 'turning',  'T3.3': 'turning',
  // T4.4 opened with an empty Matrix A, so stage 1 takes the whole T4 overflow
  // and T4.2 and T4.3 receive nothing until it fills. T4.3 is the frozen one.
  'T4.1': 'front-door', 'T4.2': 'waiting',  'T4.3': 'waiting', 'T4.4': 'filling',
  // T5.2 is the invariant-C catch: 116 rotations then stopped, held behind T5.3.
  'T5.1': 'front-door', 'T5.2': 'waiting',  'T5.3': 'filling',
};
for (const [tier, o] of Object.entries(FLEET)) {
  for (let i = 0; i < o.a.length; i++) {
    const name = `${tier}.${i + 1}`;
    const st = pairStateOf(i, o.a, o.b, 0, 127);
    check(`${name} (${o.a[i]}/127 . ${o.b[i]}/127) -> ${EXPECT[name]}`,
      st.key === EXPECT[name], `got ${JSON.stringify(st)}`);
  }
}
// The held pairs must name the pair they are held behind, or the label is useless.
check('T4.3 names T4.4 as what it is waiting on',
  pairStateOf(2, FLEET.T4.a, FLEET.T4.b, 0, 127).waitOn === 4);
check('T5.2 names T5.3 as what it is waiting on',
  pairStateOf(1, FLEET.T5.a, FLEET.T5.b, 0, 127).waitOn === 3);

// Cases the live fleet does not currently contain.
const CASES = [
  ['later pair full in BOTH halves -> stage 1 has no room, stage 2 refuses on bOcc>=bSize',
    1, [127, 127], [127, 127], 0, 127, 'full-both'],
  ['both-full later pair stays not-receiving even while another pair has room',
    1, [127, 127, 3], [127, 127, 0], 0, 127, 'full-both'],
  ['front door full in both halves is STILL the front door, never blocked',
    0, [127, 127], [127, 127], 0, 127, 'front-door'],
  ['later pair, Matrix A full, Matrix B empty, no room anywhere -> genuinely in line',
    1, [127, 127], [126, 0], 0, 127, 'in-line'],
  ['Matrix B at 126/127 must NEVER read as full -- one seat short, not deadlocked',
    1, [127, 127], [127, 126], 0, 127, 'turning'],
  ['empty deployed-ahead pair -> standby',
    1, [127, 0], [126, 0], 0, 127, 'standby'],
  ['62.13: MATRIX_SIZE unread (null) must claim nothing on a 127/0 later pair',
    1, [127, 127, 10], [126, 0, 0], 0, null, 'filling'],
  ['62.13: MATRIX_SIZE unread (null) must not call a both-full-looking pair blocked',
    1, [127, 127], [127, 127], 0, null, 'filling'],
];
for (const [name, i, a, b, act, ms, want] of CASES) {
  const st = pairStateOf(i, a, b, act, ms);
  check(name, st.key === want, `want ${want}, got ${JSON.stringify(st)}`);
}

// Every state the function can return must have words in BOTH renderers, or one
// of them renders `undefined` to a member. This is the check that keeps the two
// vocabularies in step now that they share one decision.
const KEYS = ['front-door', 'full-both', 'waiting', 'in-line', 'turning', 'standby', 'filling'];
const returned = new Set(SRC.match(/key:\s*'([a-z-]+)'/g).map(m => m.split("'")[1]));
returned.add('turning'); returned.add('in-line');   // the ternary form
check('no state is returned that this test does not know about',
  [...returned].every(k => KEYS.includes(k)), `unknown: ${[...returned].filter(k => !KEYS.includes(k))}`);
for (const k of KEYS) {
  check(`state "${k}" has words in the Live Stats table`, LABELS_SRC.includes(`'${k}':`));
  check(`state "${k}" has words in the tier strip`,       STRIP_SRC.includes(`'${k}':`));
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
