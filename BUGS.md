# CryptoNova — Issue Tracker

> Drop new issues here as members report them. Start a session with "check BUGS.md" and Claude will read this directly.
> Format: **[Page] — What happened / What was expected** + wallet type if relevant + consistent or intermittent

---

## Open Issues

### [2026-07-08] Coupon System — coupon "not found or Expired" for Sherwyn
- **Reporter:** sherwyn
- **Page:** Coupon System
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x1e8e2dcf876d0d94077c93a7e33bda2ab72ab1f7
- **Frequency:** Consistent
- **What happened:** Trying to use coupon to sign up and it's saying "coupon not found or Expired"
- **What was expected:** Easy registration
- **Notes:** Coupon was issued on V8.32 or V8.33 contract — now void after V8.34 fresh deploy. Action needed: Kolawole or any admin issues a fresh V8.34 coupon for Sherwyn's wallet 0x1e8e...b1f7.
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
| 2026-07-09 | 2026-07-09 | Contract | T2 Matrix Occupancy Corruption — reentrancy in `enterFor()` corrupted T2MatA+MatB to 128/127. V8.34 deployed with `require(!_state.crossingInProgress)` guard in `enterFor()`. Fresh deploy resets matrices. Verified: T1+T2 both completed full 127→127 MatA+MatB lifecycle post-deploy. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Koach100 (0x1ca3) — manual upgrade to T2 reverted. Root cause: V8.33 T2 reentrancy corruption. Resolved by V8.34 deploy — member can re-register and upgrade on fresh contract. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Maximum-71 (0x788b) — unable to upgrade on 2 accounts. Root cause: same T2 reentrancy corruption. Resolved by V8.34. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Koach100 (0x301a) — "not positioned in matrix." Root cause: V8.34 is a fresh deploy; wallet needs to register on V8.34. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Sherwyn (0x7744) — self rescue failed with raw tx error. Root cause: reported at 13:32 UTC against V8.33 T2 corrupted state. V8.34 went live at 17:00 UTC. Member should re-register on V8.34 and retry self rescue on clean matrices. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Kolawole Ola (0x5704) — coupons from V8.32/V8.33 still showing and cancel fails ("only issuer" revert). Root cause: localStorage-stored coupons persist across deploys; `cancelCoupon()` on V8.34 returns issuer=0x0000 for old-contract hashes → revert. Fix: `loadMyCoupons()` now detects zero-address issuer and renders "PREV. VERSION" badge (greyed out, no action buttons) instead of ACTIVE. | f7156d5 |
