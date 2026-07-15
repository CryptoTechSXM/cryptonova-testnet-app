# CryptoNova — Issue Tracker

> Drop new issues here as members report them. Start a session with "check BUGS.md" and Claude will read this directly.
> Format: **[Page] — What happened / What was expected** + wallet type if relevant + consistent or intermittent

---

## Open Issues

### [2026-07-15] Onboarding / Registration \u2014 Registration spinner hangs after wallet confirmation
- **Reporter:** KolaOla
- **Page:** Onboarding / Registration
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x0d5b8ca4197209a29f28439c7fe9bceca36fa69d
- **Frequency:** Consistent
- **What happened:** When payment is made and confirmed on MM, it just keeps rolling on CryptoNova and does not conclude the transaction until you refresh the page — "stuck here, cannot get out."
- **What was expected:** Smoother registration \u2014 UI should acknowledge the tx immediately after wallet signs.
- **Notes:** \u23f3 **V8.38 improvement** \u2014 Not a failed tx. The page polls for receipt with a 10s timeout; on slow RPC this can take 15\u201330s, making the spinner appear stuck. Fix: show "transaction submitted" state immediately after wallet confirmation so members know the tx is in flight. Logged for V8.38.
- **Submitted:** Wed, 15 Jul 2026 13:45:24 GMT

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
| 2026-07-02 | 2026-07-03 | All sub-pages | Nav link showed "\ud83d\udcca Dashboard" and went to index.html#dashboard; changed to "\ud83c\udfe0 Home" \u2192 index.html across all 7 sub-pages | 0b9e3b8 |
| 2026-07-02 | 2026-07-05 | index.html | "FREE \ud83c\udf89" showing as HTML entity &#127881; \u2014 fixed textContent \u2192 innerHTML on coupon You Pay display | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Withdrawal blocked error message too terse \u2014 expanded to explain crossing reserve and when funds unlock | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Double Reentry / Auto Reentry tooltips unclear \u2014 member confused why T1 not re-entered after upgrade to T2; tooltips now explain the distinction | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | KolawoleOla \u2014 withdrawal of ~$21 blocked. Works as designed: crossing reserve is locked while in an active matrix cycle to fund your next re-entry. Funds unlock on cycle completion. Error message improved. | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Dee1 \u2014 T1 not re-entered after T2 upgrade. Works as designed: auto-upgrade to T2 fires when MatB crosses; T1 re-entry only happens if Double Reentry was enabled. Not a bug. | \u2014 |
| 2026-07-02 | 2026-07-05 | index.html | Kolawole \u2014 member ID 444 vs 442 member count. Known V8.30 coupon bypass side-effect \u2014 2-member gap is baked on-chain. V8.31 fixes globalJoined for all new coupon registrations going forward. | V8.31 |
| 2026-07-02 | V8.32 (Aug 19) | index.html | Kolawole \u2014 Auto-Reentry TX fails after coupon registration. Root cause: pre-V8.31 coupon members have globalJoined=false in TierRouter \u2192 setMemberOptions reverts. Fix: setGlobalJoined() admin fn in V8.32 (Aug 19). | V8.32 |
| 2026-07-03 | 2026-07-05 | index.html | Dee1 (0x299d / 0x0637) \u2014 positions 146/147 in T1A MatB, no earnings. Root cause: Base Sepolia RPC outage (SERVER_ERROR confirmed 2026-07-03 13:35 UTC) prevented keeper from running force-crosses. Not a code bug. Keeper resumes when RPC recovers. | \u2014 |
| 2026-07-07 | 2026-07-08 | index.html | CT CharFun \u2014 coupon purchase approval spinner never resolves. Root cause: `approveCouponUSDC()` had bare `tx.wait()` with no timeout; hangs on slow RPC. Fix: `Promise.race` 10s timeout (same pattern as `approveUSDC()`). | 96eb981 |
| 2026-07-07 | 2026-07-08 | index.html | Koach100 \u2014 manual upgrade stuck on "approving USDC" after MetaMask confirmation. Root cause: pre-flight `getBalance`+`balanceOf` RPC calls in `approveUSDCForUpgrade()` were blocking; `tx.wait()` also had no timeout. Fix: 5s pre-flight timeout + 10s `tx.wait()` timeout. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Kolawole Ola \u2014 "Auto-Deducted (Upgrades)" label confused members who already saw the crossing reserve deduction. Not a double-charge \u2014 label was misleading. Fix: renamed to "Tier Upgrade Fee (from earnings)" with tooltip clarifying it's the next-tier entry fee paid from earnings, separate from crossing reserve. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Sherwyn \u2014 coupon share copy button showed no acknowledgement when link was copied. Fix: added `.catch()` fallback using `document.execCommand('copy')` for browsers blocking clipboard API; both paths show "\u2713 Copied!" confirmation. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Sherwyn \u2014 coupon redemption showed "\u274c \u274c" double-error prefix. Root cause: 9 `setStatus()` calls used `'\u274c ' + friendlyError(e)` but `friendlyError()` already prepends \u274c. Fix: removed the extra prefix from all 9 call sites. Error message for coupon-specific CALL_EXCEPTION also improved to "Coupon not found or expired \u2014 please request a new one." | 96eb981 |
| 2026-07-09 | 2026-07-09 | Contract | T2 Matrix Occupancy Corruption \u2014 reentrancy in `enterFor()` corrupted T2MatA+MatB to 128/127. V8.34 deployed with `require(!_state.crossingInProgress)` guard in `enterFor()`. Fresh deploy resets matrices. Verified: T1+T2 both completed full 127\u2192127 MatA+MatB lifecycle post-deploy. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Koach100 (0x1ca3) \u2014 manual upgrade to T2 reverted. Root cause: V8.33 T2 reentrancy corruption. Resolved by V8.34 deploy \u2014 member can re-register and upgrade on fresh contract. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Maximum-71 (0x788b) \u2014 unable to upgrade on 2 accounts. Root cause: same T2 reentrancy corruption. Resolved by V8.34. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Koach100 (0x301a) \u2014 "not positioned in matrix." Root cause: V8.34 is a fresh deploy; wallet needs to register on V8.34. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Sherwyn (0x7744) \u2014 self rescue failed with raw tx error. Root cause: reported at 13:32 UTC against V8.33 T2 corrupted state. V8.34 went live at 17:00 UTC. Member should re-register on V8.34 and retry self rescue on clean matrices. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Kolawole Ola (0x5704) \u2014 coupons from V8.32/V8.33 still showing and cancel fails ("only issuer" revert). Root cause: localStorage-stored coupons persist across deploys; `cancelCoupon()` on V8.34 returns issuer=0x0000 for old-contract hashes \u2192 revert. Fix: `loadMyCoupons()` now detects zero-address issuer and renders "PREV. VERSION" badge (greyed out, no action buttons) instead of ACTIVE. | f7156d5 |
| 2026-07-11 | 2026-07-15 | index.html | Koach100 (0x2444) \u2014 withdrew $17.64 but only $4.66 arrived. Root cause: dashboard showed raw `totalW` (on-chain withdrawable) but contract deducts $10 crossing reserve per active in-matrix position at withdrawal time. V8.37 introduces `realW` which pre-deducts the $10 lock \u2014 displayed amount now matches what the member actually receives. | V8.37 cbcbe06 |
| 2026-07-11 | 2026-07-15 | index.html | Kolawole Ola (0x33b5) \u2014 auto-reentry didn't engage after softParkIdle. Root cause (UX): pre-V8.37 the dashboard only scanned T1.1; if member was parked in T1.2 they saw the "limbo" (manual re-entry) card instead of the "rescue" (auto-reentry) card. Root cause (design): auto-rescue has a 24h grace period \u2014 it's not instant. Contract confirmed: `softParkIdle` releases crossing reserve to withdrawable, so effective balance covers re-entry; keeper fires within 24h. V8.37: all pairs scanned + "Auto-rescue active \u2014 within 24h" hint added to rescue card. | V8.37 cbcbe06 |
| 2026-07-15 | 2026-07-15 | index.html | Les Gay Jr (0x7343) \u2014 referrals not counting and "My Node ID" label confused with My Directs. Root cause: V8.36 matrix scanner only covered T1.1; referrals in T1.2 were invisible (count undercount). "My Node ID" is a permanent stat card showing BFS position \u2014 not replaced by My Directs tab (UX, not a bug). V8.37 scans all pairs via allPairsStatus() \u2014 referral counts now correct. | V8.37 cbcbe06 |
| 2026-07-15 | 2026-07-15 | index.html | KolaOla (0x5704) \u2014 dashboard still showing V8.36 after deploy. CDN cache \u2014 hard refresh (`Ctrl+Shift+R`) resolves. V8.37 is live. No code change needed. | \u2014 |
| 2026-07-15 | 2026-07-15 | index.html | KolaOla (0x5704) \u2014 intermittent wallet connect failure. MetaMask extension issue \u2014 refresh page, unlock MetaMask, reconnect. Not reproduced on admin.crypto-nova.app. No code change needed. | \u2014 |
| 2026-07-11 | 2026-07-15 | index.html | Koach100 (0x9ae3) \u2014 registration tx keeps failing. RPC rate limit \u2014 transient, retry after a few seconds resolves. No code change. | \u2014 |
| 2026-07-08 | 2026-07-15 | Coupon System | Sherwyn (0x1e8e) \u2014 coupon void after V8.34+ redeploy. Root cause: coupons are contract-bound; old codes are invalid on fresh deploys. Coupon system verified working on V8.37 (tested with another member). Closed \u2014 reopen if Sherwyn reports again on V8.37. | \u2014 |
| 2026-07-15 | 2026-
| 2026-07-15 | 2026-07-15 | index.html | @ThanksAndPraises (0x3c17) — V8.36 still showing. Self-resolved with page reload (CDN cache). Root cause (hardcoded badge) permanently fixed in d3ad976 — badge now shows V8.37. | d3ad976 |
