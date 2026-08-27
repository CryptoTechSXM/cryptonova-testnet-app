// repro_referrer.mjs — Session 44 reproduction harness for the referrer-loss defect
// (V8_50_HANDOFF 43.9 / two member reports, 2026-08-27).
//
// WHY IT IS BUILT THIS WAY: it never re-types the page logic. It SLICES the real
// source text out of index.html by unique markers and executes those exact bytes
// against a stub DOM, then drives a wallet account switch with NO page reload —
// which is what MetaMask/Rabby actually do (accountsChanged -> connectWallet(true)
// -> loadUserData). If the slice markers ever stop matching, the run FAILS loudly
// instead of silently testing nothing.
//
// Run from C:\CryptoNova-Testnet-App :   node repro_referrer.mjs
//
import fs from 'fs';
import vm from 'vm';
import { ethers } from 'ethers';

// Optional arg: run the SAME harness against another copy of index.html (e.g. the
// pre-fix file) to prove the harness actually detects the defect rather than passing
// everything.  node repro_referrer.mjs ../index.html.prefix.bak
const FILE = process.argv[2] || 'index.html';
const SRC = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

function slice(startMark, endMark, label) {
  const a = SRC.indexOf(startMark);
  if (a < 0) throw new Error(`SLICE MARKER NOT FOUND (start) [${label}]: ${startMark}`);
  const b = SRC.indexOf(endMark, a);
  if (b < 0) throw new Error(`SLICE MARKER NOT FOUND (end) [${label}]: ${endMark}`);
  return SRC.slice(a, b + endMark.length);
}

// ── the four real pieces of the referrer path ────────────────────────────
const POOL     = slice('const DEFAULT_SPONSOR_POOL = [', '\n}\n', 'pool+pickDefaultSponsor');
const AUTOFILL = slice('// Auto-fill referrer from URL or T1 MatA root',
                       "(default sponsor)';\n      }\n    }", 'loadUserData auto-fill block');
// Accept EITHER the fixed tail or the pre-fix one, so this harness runs unchanged
// against both versions of the file and the two reports can be compared directly.
const REG_START = "const refInput = document.getElementById('input-referrer');\n    const c = window._activeCoupon;";
const REGISTER = SRC.includes('defaultSponsorFor(userAddr)); // V8.45 rotation pool')
  ? slice(REG_START, 'defaultSponsorFor(userAddr)); // V8.45 rotation pool', 'register (fixed)')
  : slice(REG_START, 'pickDefaultSponsor(userAddr))); // V8.45', 'register (pre-fix)');
const USEDEF   = slice('async function useDefaultSponsor() {', '\n}\n', 'useDefaultSponsor');
// OPTIONAL slice: the reset the accountsChanged handler performs on a real switch.
// Absent on a pre-fix index.html — the harness then models the OLD behaviour (no
// reset at all), so the same file can be run against both versions and compared.
function sliceOpt(startMark, endMark) {
  const a = SRC.indexOf(startMark); if (a < 0) return '';
  const b = SRC.indexOf(endMark, a); if (b < 0) return '';
  return SRC.slice(a, b + endMark.length);
}
const HELPERS = sliceOpt('// ── REFERRER RESOLUTION HELPERS', '// ── end referrer resolution helpers');
const SWITCHRESET = sliceOpt('// V8.50 / session 44: an account switch re-runs loadUserData WITHOUT a page',
                             'try { checkDefaultSponsorWarn(); } catch(_) {}');
const ACCHG    = slice("window.ethereum.on('accountsChanged', (accounts) => {",
                       'setTimeout(() => connectWallet(true).catch(()=>{}), 300);', 'accountsChanged handler');

const HARNESS = `
${POOL}
${HELPERS}
function __autofill() {
${AUTOFILL}
}
function __register() {
${REGISTER}
  return referrer;
}
${USEDEF}
`;

// ── stub DOM / page globals ──────────────────────────────────────────────
function newPage() {
  const els = {
    'input-referrer':       { value: '', placeholder: '' },
    'default-sponsor-warn': { style: {} },
    'btn-approve':          { disabled: true, className: '', textContent: '' },
  };
  const ctx = {
    ethers,
    console,
    URLSearchParams,
    userAddr: null,
    window: { _defaultReferrer: undefined, _activeCoupon: null, location: { search: '' } },
    document: { getElementById: (id) => els[id] || null },
    short: (a) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : ''),
    checkDefaultSponsorWarn: () => {},
    setStatus: (id, msg) => { ctx.__status = msg; },
    setReferrerNote: (m) => { ctx.__note = m; },
    toast: () => {},
    btn: { disabled: false, textContent: '', innerHTML: '' },
    __status: null,
    __els: els,
  };
  vm.createContext(ctx);
  vm.runInContext(HARNESS, ctx);
  return ctx;
}

// connect / switch account with NO page reload — the loadUserData path
function connect(p, addr) { p.userAddr = addr; vm.runInContext('__autofill()', p); }
// A REAL wallet account switch: the accountsChanged handler runs first (its reset,
// verbatim, when the fix is present), THEN connectWallet(true) -> loadUserData.
function switchAccount(p, addr) {
  if (SWITCHRESET) vm.runInContext(`(function(){\n${SWITCHRESET}\n})()`, p);
  connect(p, addr);
}
const field    = (p) => p.__els['input-referrer'];
const register = (p) => { const r = vm.runInContext('__register()', p); return r === undefined ? '<<REFUSED>>' : r; };
const poolFor  = (p, a) => vm.runInContext(`pickDefaultSponsor(${JSON.stringify(a)})`, p);
const useDef   = (p) => vm.runInContext('useDefaultSponsor()', p);

// ── two accounts in one wallet whose pool defaults DIFFER ────────────────
const probe = newPage();
for (const c of []) {} // (fixtures validated below)
// NOTE: all-lowercase on purpose. ethers.isAddress() REJECTS a mixed-case address
// whose EIP-55 checksum is wrong, and pickDefaultSponsor then falls through to its
// Math.random() branch — which made an earlier run of this harness non-deterministic.
const CAND = [
  '0x26388a81eb9448df02144cc765bb448444e61f9b', // owner's member wallet (Genesis #19)
  '0x3c1755aa1d9f9f9f1234567890abcdef12345678',
  '0x149852b8000000000000000000000000000000a1',
  '0x9999888877776666555544443333222211110000',
  '0xabcdef0123456789abcdef0123456789abcdef01',
];
let A = null, B = null;
outer: for (const x of CAND) for (const y of CAND) {
  if (x !== y && poolFor(probe, x) !== poolFor(probe, y)) { A = x; B = y; break outer; }
}
if (!A) throw new Error('could not find two accounts with different pool defaults');
const DEF_A = poolFor(probe, A), DEF_B = poolFor(probe, B);
const TYPED = '0x1111111111111111111111111111111111111111'; // a sponsor a member types

const rows = [];
function record(n, what, got, want, note) {
  const ok = got.toLowerCase() === want.toLowerCase();
  rows.push({ n, what, got, want, ok, note });
}

// S1 CONTROL — one account, fresh page, nothing typed
{ const p = newPage(); connect(p, B);
  record('S1', 'control: fresh page, account B only, field empty',
         register(p), DEF_B, 'expected: B lands on B-s own pool default'); }

// S2 CONTROL — one account, fresh page, referrer typed
{ const p = newPage(); connect(p, B); field(p).value = TYPED;
  record('S2', 'control: fresh page, account B types a sponsor',
         register(p), TYPED, 'expected: the typed sponsor is used'); }

// S3 — A types a sponsor, member SWITCHES to B, no reload, registers
{ const p = newPage(); connect(p, A); field(p).value = TYPED; switchAccount(p, B);
  record('S3', 'A typed a sponsor -> switch to B -> B registers',
         register(p), DEF_B, 'B should get its own default; stale FIELD hands it A-s sponsor'); }

// S4 — A clicks "Use default sponsor", switch to B, register
{ const p = newPage(); connect(p, A); useDef(p); switchAccount(p, B);
  record('S4', 'A clicked Use-default -> switch to B -> B registers',
         register(p), DEF_B, 'THE 0x5179A012 SIGNATURE: B registers under A-s pool default'); }

// S5 — A typed, switch to B, member CLEARS the field hoping it re-fills, registers
{ const p = newPage(); connect(p, A); field(p).value = TYPED; switchAccount(p, B); field(p).value = '';
  record('S5', 'A typed -> switch to B -> B clears field -> registers',
         register(p), DEF_B, 'stale GLOBAL window._defaultReferrer supplies A-s default'); }

// S6 — after the switch, B clicks "Use default sponsor" to fix it
{ const p = newPage(); connect(p, A); field(p).value = TYPED; switchAccount(p, B); useDef(p);
  record('S6', 'A typed -> switch to B -> B clicks Use-default',
         register(p), DEF_B, 'the button meant to fix it also serves A-s default'); }

// S7 — A connects with an EMPTY field, switch to B, register (handoff mechanism ii)
{ const p = newPage(); connect(p, A); switchAccount(p, B);
  record('S7', 'A empty field -> switch to B -> B registers',
         register(p), DEF_B, 'handoff said the stale global fires here — does it?'); }

// S8 — no switching at all: B types a MALFORMED referrer on a fresh page
{ const p = newPage(); connect(p, B); field(p).value = '0x1234';
  record('S8', 'fresh page, B types a malformed address',
         register(p), '<<REFUSED>>', 'a bad referrer must be refused out loud, never swapped for a default'); }

// S9 — no switching: B pastes a REAL sponsor address whose letter-case is wrong.
// ethers.isAddress() enforces the EIP-55 checksum, so a right-hex/wrong-case paste
// is "not an address" to this page. Nothing tells the member.
{ const p = newPage(); connect(p, B);
  const real = '0x6512e9B5FE1690F2570AFEE5E7b904EF106C9435';       // pool leader #1, correct EIP-55
  const miscased = '0x6512E9b5fe1690f2570afee5e7B904ef106C9435';   // same 40 hex, wrong case
  field(p).value = miscased;
  record('S9', 'fresh page, B pastes a real sponsor with wrong letter-case',
         register(p), real, 'right hex + bad EIP-55 checksum -> silently swapped for a pool default'); }

// S10 — the same address all-lowercase (what most explorers/wallets copy) is fine
{ const p = newPage(); connect(p, B);
  const lower = '0x6512e9b5fe1690f2570afee5e7b904ef106c9435';
  record('S10', 'fresh page, B pastes the same sponsor all-lowercase',
         (field(p).value = lower, register(p)), lower, 'all-lowercase skips the checksum -> accepted'); }

// ── static check on the handler that should be clearing state ────────────
const clears = /_defaultReferrer/.test(ACCHG) || /input-referrer/.test(ACCHG);

// ── report ───────────────────────────────────────────────────────────────
const L = (s, n) => String(s).padEnd(n);
console.log('\n=== repro_referrer.mjs — index.html referrer path, real source ===');
console.log('account A      ', A, ' -> pool default', DEF_A);
console.log('account B      ', B, ' -> pool default', DEF_B);
console.log('typed sponsor  ', TYPED);
console.log('accountsChanged handler clears referrer state? ', clears ? 'YES' : 'NO  <-- it does not touch either');
console.log('switch-reset block found and executed by this run?', SWITCHRESET ? 'YES' : 'NO (modelling PRE-FIX behaviour)');
console.log('');
for (const r of rows) {
  console.log(`${r.ok ? ' OK ' : 'FAIL'}  ${L(r.n, 4)} ${r.what}`);
  console.log(`        got  ${r.got}`);
  console.log(`        want ${r.want}`);
  console.log(`        ${r.note}`);
}
const bad = rows.filter(r => !r.ok);
console.log(`\nREPRODUCED: ${bad.length} of ${rows.length} scenarios put a member under the WRONG sponsor.`);
console.log(bad.map(r => '  - ' + r.n + ' ' + r.what).join('\n'));
