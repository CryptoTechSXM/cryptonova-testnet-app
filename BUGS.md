# CryptoNova — Issue Tracker

> Drop new issues here as members report them. Start a session with "check BUGS.md" and Claude will read this directly.
> Format: **[Page] — What happened / What was expected** + wallet type if relevant + consistent or intermittent

---

## 🚨 CRITICAL (V8.34 Required)

### [2026-07-09] T2 Matrix Occupancy Corruption — reentrancy in `enterFor()` [CRITICAL]
- **Severity:** CRITICAL — blocks all T2 entries; must deploy V8.34 to fix
- **Symptom:** Members trying to upgrade to T2 (manually or auto) get `reason=null, data=null` revert consuming ~2.8M gas
- **Root cause:** Reentrancy bug in `FigureEightMatrixV8.enterFor()`. When `handleCycleOut` triggers `_executeAndDouble → PM.registerFor → enterFor` on T2MatA while T2MatA is already inside `_cycleOutRoot` (crossingInProgress=true), the `crossingInProgress` guard does NOT protect `enterFor`. The re-entrant call corrupts occupancy to 128 (over matrixSize=127), then every subsequent entry triggers a recursive EVM call-stack overflow revert.
- **On-chain state (V8.33):** T2MatA=128/127 (CORRUPTED), T2MatB=128/127 (CORRUPTED). Cannot fix in-place. V8.34 fresh deploy resets all matrices.
- **Fix (applied 2026-07-09):** `FigureEightMatrixV8.sol enterFor()` — added `require(!_state.crossingInProgress, "F8V8: reentrant enter blocked");` before `this._enterMatrix(...)`. Staged for V8.34 deploy.
- **Verified example:** Member #10 (`0x7308daF433804e8F10Dd267C70332609bd491477`) — `manualUpgrade()` to T2 → gasUsed=2,825,302 revert with null reason/data (EVM stack overflow from recursive re-entry loop).

---

## Open Issues

### [2026-07-09] Coupon System — I just noticed/confirmed that the previous coupons, even in …
- **Reporter:** Kolawole Ola
- **Page:** Coupon System
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x5704e5f537069127a8a53e7c85d522264a0135ed
- **Frequency:** Consistent
- **What happened:** I just noticed/confirmed that the previous coupons, even in the last 2 upgrades/versions are still showing and cannot be deleted. It says only the person that created it can delete them. I created them by myself, one each in the last 2 versions.
- **What was expected:** The should have been scrapped off with the new versions upgrade.
- **Submitted:** Thu, 09 Jul 2026 17:16:22 GMT


### [2026-07-09] Dashboard (index.html) — The following message is being displayed across all my accou…
- **Reporter:** Sherwyn
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x774481dac8584cfafb5b6b6fad883787b343c573
- **Frequency:** Consistent
- **What happened:** The following message is being displayed across all my accounts when trying to do self rescue... ❌ "", "from": "0x774481DAc8584CfAFb5B6b6fAD883787b343C573", "to": "0xE1Ce0C46EB05ccf991BedECf79928B984
- **What was expected:** To move over to matrix B...
- **Notes:** Across all accounts..
- **Submitted:** Thu, 09 Jul 2026 13:32:30 GMT


### [2026-07-09] Dashboard (index.html) — I tried to upgrade manually. The Metamask approval was confi…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x1ca3316ebc2f991c073ccdd1a25c68d482589a94
- **Frequency:** Consistent
- **What happened:** I tried to upgrade manually. The Metamask approval was confirmed for step 1 and 2 then I got a message on the dapp saying the transaction execution was reverted with a string of coding language after it.
- **What was expected:** I should have been upgraded to tier 2.
- **Notes:** i took a photo but i couldn't share it here.
- **Submitted:** Thu, 09 Jul 2026 12:32:42 GMT


### [2026-07-09] Other — Unable to Upgrade on main acct and this acct
- **Reporter:** Maximum - 71
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x788b70fe1453ccc12e3d76ae18c1952046fa02af
- **Frequency:** Consistent
- **What happened:** Unable to Upgrade on main acct and this acct
- **What was expected:** upgrade to next tier
- **Submitted:** Thu, 09 Jul 2026 11:37:42 GMT


### [2026-07-09] Dashboard (index.html) — i am not positioned in matrix
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x301afb29e6f4b68c97f20686ad23e7adc3955170
- **Frequency:** Consistent
- **What happened:** i am not positioned in matrix
- **What was expected:** to have a position in a matrix
- **Notes:** May be related to T2 reentrancy corruption above — check if this wallet is trying to enter T2. Alternatively check if wallet is registered via diag_matrix_state.js. Pending V8.34 to resolve T2 state.
- **Submitted:** Thu, 09 Jul 2026 00:52:12 GMT


### [2026-07-08] Coupon System — Trying to use coupon to sign up and it's saying "coupon not …
- **Reporter:** sherwyn
- **Page:** Coupon System
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x1e8e2dcf876d0d94077c93a7e33bda2ab72ab1f7
- **Frequency:** Consistent
- **What happened:** Trying to use coupon to sign up and it's saying "coupon not found or Expired...
- **What was expected:** Easy registration...
- **Notes:** Check if coupon was already redeemed, expired, or cancelled. Error message was improved in 96eb981 but the coupon may genuinely be stale — ask sherwyn to request a new one.
- **Submitted:** Wed, 08 Jul 2026 21:24:37 GMT

---

## Template

```
### [YYYY-MM-DD] Short title
- **Page:** index / buy / governance / liquidity / status / comp / terms / faq
- **Wallet:** MetaMask / Rabby / Other
- **What happened:** ...
- **What was expected:** ...
- **Consistent or intermittent:** Consistent / Only sometimes
- **Notes:** (screenshot path, member address, anything else useful)
```

---

## Resolved Issues

| Date Reported | Date Fixed | Page | Summary | Commit |
|---------------|------------|------|---------|--------|
| 2026-07-02 | 2026-07-03 | All sub-pages | Nav link showed "📊 Dashboard" and went to index.html#dashboard; changed to "🏠 Home" → index.html across all 7 sub-pages | 0b9e3b8 |
| 2026-07-02 | 2026-07-05 | index.html | "FREE 🎉" showing as HTML entity &#127881; — fixed textContent → innerHTML on coupon You Pay display | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Withdrawal blocked error message too terse — expanded to explain crossing reserve and when funds unlock | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Double Reentry / Auto Reentry tooltips unclear — member confused why T1 not re-entered after upgrade to T2; tooltips now explain the distinction | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | KolawoleOla — withdrawal of ~$21 blocked. Works as designed: crossing reserve is locked while in an active matrix cycle to fund your next re-entry. Funds unlock on cycle completion. Error message improved. | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Dee1 — T1 not re-entered after T2 upgrade. Works as designed: auto-upgrade to T2 fires when MatB crosses; T1 re-entry only happens if Double Reentry was enabled. Not a bug. | — |
| 2026-07-02 | 2026-07-05 | index.html | Kolawole — member ID 444 vs 442 member count. Known V8.30 coupon bypass side-effect — 2-member gap is baked on-chain. V8.31 fixes globalJoined for all new coupon registrations going forward. | V8.31 |
| 2026-07-02 | V8.32 (Aug 19) | index.html | Kolawole — Auto-Reentry TX fails after coupon registration. Root cause: pre-V8.31 coupon members have globalJoined=false in TierRouter → setMemberOptions reverts. Fix: setGlobalJoined() admin fn in V8.32 (Aug 19). | V8.32 |
| 2026-07-03 | 2026-07-05 | index.html | Dee1 (0x299d / 0x0637) — positions 146/147 in T1A MatB, no earnings. Root cause: Base Sepolia RPC outage (SERVER_ERROR confirmed 2026-07-03 13:35 UTC) prevented keeper from running force-crosses. Not a code bug. Keeper resumes when RPC recovers. | — |
| 2026-07-07 | 2026-07-08 | index.html | CT CharFun — coupon purchase approval spinner never resolves. Root cause: `approveCouponUSDC()` had bare `tx.wait()` with no timeout; hangs on slow RPC. Fix: `Promise.race` 10s timeout (same pattern as `approveUSDC()`). | 96eb981 |
| 2026-07-07 | 2026-07-08 | index.html | Koach100 — manual upgrade stuck on "approving USDC" after MetaMask confirmation. Root cause: pre-flight `getBalance`+`balanceOf` RPC calls in `approveUSDCForUpgrade()` were blocking; `tx.wait()` also had no timeout. Fix: 5s pre-flight timeout + 10s `tx.wait()` timeout. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Kolawole Ola — "Auto-Deducted (Upgrades)" label confused members who already saw the crossing reserve deduction. Not a double-charge — label was misleading. Fix: renamed to "Tier Upgrade Fee (from earnings)" with tooltip clarifying it's the next-tier entry fee paid from earnings, separate from crossing reserve. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Sherwyn — coupon share copy button showed no acknowledgement when link was copied. Fix: added `.catch()` fallback using `document.execCommand('copy')` for browsers blocking clipboard API; both paths show "✓ Copied!" confirmation. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Sherwyn — coupon redemption showed "❌ ❌" double-error prefix. Root cause: 9 `setStatus()` calls used `'❌ ' + friendlyError(e)` but `friendlyError()` already prepends `❌`. Fix: removed the extra prefix from all 9 call sites. Error message for coupon-specific CALL_EXCEPTION also improved to "Coupon not found or expired — please request a new one." | 96eb981 |
