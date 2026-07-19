# CryptoNova — Issue Tracker
| 2026-07-19 | 2026-07-19 | index.html | Maximum_71 — Dashboard (index.html) — "[From https://sepolia.base.org] gas limit too high"
-  | Manual close |
| 2026-07-19 | 2026-07-19 | index.html | @Lavern_Gay — Onboarding / Registration — Registration failed. Message received after failure: | Manual close |
| 2026-07-19 | 2026-07-19 | index.html | @Lavern_Gay — Onboarding / Registration — Can not register my account. Several attempts were m | Manual close |
| 2026-07-19 | 2026-07-19 | index.html | @Koach100 — Dashboard (index.html) — i attempted a self rescue from T1 matrix A but the tran | Manual close |
| 2026-07-19 | 2026-07-19 | index.html | Sherwyn — Onboarding / Registration — ❌ "", "from": "0x1e8e2dCF876D0d94077c93a7e33Bda2AB72 | Manual close |

> Drop new issues here as members report them. Start a session with "check BUGS.md" and Claude will read this directly.
> Format: **[Page] — What happened / What was expected** + wallet type if relevant + consistent or intermittent

---

## Open Issues

_No open issues._

## Resolved Issues

| Date Reported | Date Fixed | Page | Summary | Commit |
|---------------|------------|------|---------|--------|
| 2026-07-19 | 2026-07-19 | System | Maximum_71, @Lavern_Gay x2, @Koach100, Sherwyn — morning registration failures and frozen spinners. Root cause: T1.1 MatB frozen at occ=127/127 rotationCount=0 (factory never triggered T1.2 deploy). MatA also full → no seats for new registrations. Wallets 52–59 parked in MatA, selfRescue spamming RESC WARN because MatB was full. Fix: manual adminForceRotateRoot (8M gas) unfroze MatB; wallets 52–59 rescued + upgraded to T2; T1.2 factory auto-deployed on natural cycle-out. frozen_matb_keeper.js corrected to call adminForceRotateRoot (was calling keeperForceRotateRoot — wrong caller). Registrations resuming by RUN #123. | 7524b0d |
| 2026-07-18 | 2026-07-19 | index.html | Maximum_71 (0x2032) — selfRescue TX reverted on T1.2 MatB. Root cause: V8.38 SF.receiveDebtRepayment revert propagated up through selfRescue. Fixed in V8.39 with try/catch wrapping. | V8.39 |
| 2026-07-18 | 2026-07-19 | index.html | Koach100 (0x74d5) — selfRescue approve succeeded, then TX failed and timed out. Same root cause as above — V8.38 SF revert. Fixed in V8.39. | V8.39 |
| 2026-07-18 | 2026-07-19 | index.html | @Lavern_Gay (multiple accts) — referrer addresses changed from submitted address. Root cause: round-robin referrer rotation in bigfill stress test. Production registrations are unaffected — referrer is always the address entered at register. Not a bug in production. Replied. | — |
| 2026-07-18 | 2026-07-19 | index.html | @Lavern_Gay — unable to modify wallet address in bug report form. The wallet field auto-fills from the connected wallet at page load — it is intentionally locked. Submit one report per affected wallet. Replied. | — |
| 2026-07-18 | 2026-07-19 | index.html | MsTech (0x1c56) — registered as #502 but displayed "Member ID #139". Root cause: Member ID = position within the current matrix pair, not the global join count. Tooltip added. Replied. | — |
| 2026-07-17 | 2026-07-17 | index.html | Maximum_71 (0xde58) — "gas limit too high" on re-entry. Same as 0x6c85. Public RPC cap — keeper auto-rescues within 2 min. Not a code bug. Reply sent. | — |
| 2026-07-17 | 2026-07-17 | index.html | Sherwyn (0xFB3A) — MM sending to old V8.37 TierRouter on upgrade. Stale browser cache. Hard refresh + reconnect wallet on V8.38 fixes it. Reply sent. | — |
| 2026-07-17 | 2026-07-17 | index.html | Sherwyn (0xFB3A) — T2 upgrade TX fails (MetaMask). Transient RPC blip — on-chain simulation passes. Ask to retry on V8.38. Reply sent. | — |
| 2026-07-16 | 2026-07-17 | index.html | Sherwyn (0x7744) — manualUpgrade(1) reverted "TR: already seated in target tier". Pre-flight memberHighestTier check now shows friendly message before tx fires. | 4e13fea / V8.38 |
| 2026-07-16 | 2026-07-17 | index.html | Barbara (0x997b) — intermittent registration revert (CALL_EXCEPTION). No error detail provided. Closed — ask to retest on V8.38 and submit full error if it recurs. | — |
| 2026-07-16 | 2026-07-16 | index.html | Sherwyn (0x7744) — T3 upgrade + self-rescue failing in TokenPocket. Root cause: only $6.47 USDC in wallet vs $25 T3 fee, and $0 allowance. Pre-flight balance/allowance check now blocks tx before submission and shows clear dollar amounts. TokenPocket also doesn't decode CALL_EXCEPTION revert data — friendlyError() catch block improved. Reply sent. | aeb39a6, 10a6ceb |
| 2026-07-16 | 2026-07-16 | VPS monitor | Janice V (0x7947) — daily monitor showed 568 members while pulse showed 468. Root cause: monitor_v8.js used totalJoined() (counts seats/re-entries) instead of globalJoinedCount() (unique wallets). Fixed on VPS — monitor now reports unique members. Reply sent. | VPS |
| 2026-07-16 | 2026-07-16 | index.html | Gemma (0x85ec) — "T2 did not open after crossing to T1 MatB." On-chain check: memberHighestTier=2 — Gemma is already in T2. Self-resolved; whale gate was open. Reply sent. | — |
| 2026-07-15 | 2026-07-16 | index.html | @Lavern_Gay (0x728f) — self-rescue failed on accounts 1–4. Root cause: keeper (direct_keeper.js, runs every 2 min) had already rescued her between page load and button click, so tx reverted with "F8V8: not parked". Error message now shows "🎉 Already been rescued! Refresh your dashboard." Reply sent. | 10a6ceb |
| 2026-07-15 | 2026-07-16 | index.html | Maximum_71 (0x6c85) — "gas limit too high" on self-rescue. Root cause: public sepolia.base.org RPC rejects high-gas txs. Not a code bug — keeper auto-rescues within 2 min. Workaround: wait for keeper or use Alchemy/Infura RPC. Reply sent. | — |
| 2026-07-02 | 2026-07-03 | All sub-pages | Nav link showed "📊 Dashboard" and went to index.html#dashboard; changed to "🏠 Home" → index.html across all 7 sub-pages | 0b9e3b8 |
| 2026-07-02 | 2026-07-05 | index.html | "FREE 🎉" showing as HTML entity &#127881; — fixed textContent → innerHTML on coupon You Pay display | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Withdrawal blocked error message too terse — expanded to explain crossing reserve and when funds unlock | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Double Reentry / Auto Reentry tooltips unclear — member confused why T1 not re-entered after upgrade to T2; tooltips now explain the distinction | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | KolawoleOla — withdrawal of ~$21 blocked. Works as designed: crossing reserve is locked while in an active matrix cycle to fund your next re-entry. Funds unlock on cycle completion. Error message improved. | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Dee1 — T1 not re-entered after T2 upgrade. Works as designed: auto-upgrade to T2 fires when MatB crosses; T1 re-entry only happens if Double Reentry was enabled. Not a bug. | — |
| 2026-07-02 | 2026-07-05 | index.html | Kolawole — member ID 444 vs 442 member count. Known V8.30 coupon bypass side-effect — 2-member gap is baked on-chain. V8.31 fixes globalJoined for all new coupon registrations going forward. | V8.31 |
| 2026-07-02 | V8.32 (Aug 19) | index.html | Kolawole — Auto-Reentry TX fails after coupon registration. Root cause: pre-V8.31 coupon members have globalJoined=false in TierRouter → setMemberOptions reverts. Fix: setGlobalJoined() admin fn in V8.32 (Aug 19). | V8.32 |
| 2026-07-03 | 2026-07-05 | index.html | Dee1 (0x299d / 0x0637) — positions 146/147 in T1A MatB, no earnings. Root cause: Base Sepolia RPC outage (SERVER_ERROR confirmed 2026-07-03 13:35 UTC) prevented keeper from running force-crosses. Not a code bug. Keeper resumes when RPC recovers. | — |
| 2026-07-07 | 2026-07-08 | index.html | CT CharFun — coupon purchase approval spinner never resolves. Root cause: approveCouponUSDC() had bare tx.wait() with no timeout; hangs on slow RPC. Fix: Promise.race 10s timeout. | 96eb981 |
| 2026-07-07 | 2026-07-08 | index.html | Koach100 — manual upgrade stuck on "approving USDC" after MetaMask confirmation. Root cause: pre-flight getBalance+balanceOf RPC calls blocking; tx.wait() also had no timeout. Fix: 5s pre-flight timeout + 10s tx.wait() timeout. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Kolawole Ola — "Auto-Deducted (Upgrades)" label confused members. Fix: renamed to "Tier Upgrade Fee (from earnings)" with tooltip. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Sherwyn — coupon share copy button showed no acknowledgement. Fix: added .catch() fallback + "✓ Copied!" confirmation. | 96eb981 |
| 2026-07-06 | 2026-07-08 | index.html | Sherwyn — coupon redemption showed "❌ ❌" double-error prefix. Fixed: removed extra prefix from 9 call sites. | 96eb981 |
| 2026-07-09 | 2026-07-09 | Contract | T2 Matrix Occupancy Corruption — reentrancy in enterFor() corrupted T2MatA+MatB. V8.34 deployed with reentrancy guard. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Koach100 (0x1ca3) — manual upgrade to T2 reverted. Root cause: V8.33 T2 reentrancy corruption. Resolved by V8.34. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Maximum-71 (0x788b) — unable to upgrade on 2 accounts. Root cause: same T2 reentrancy corruption. Resolved by V8.34. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Koach100 (0x301a) — "not positioned in matrix." Root cause: V8.34 is a fresh deploy; wallet needs to register on V8.34. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Sherwyn (0x7744) — self rescue failed with raw tx error. Root cause: reported against V8.33 T2 corrupted state. V8.34 went live. | V8.34 |
| 2026-07-09 | 2026-07-09 | index.html | Kolawole Ola (0x5704) — coupons from V8.32/V8.33 still showing and cancel fails. Fix: loadMyCoupons() now detects zero-address issuer and renders "PREV. VERSION" badge. | f7156d5 |
| 2026-07-11 | 2026-07-15 | index.html | Koach100 (0x2444) — withdrew $17.64 but only $4.66 arrived. Root cause: dashboard showed raw totalW; V8.37 introduces realW which pre-deducts the $10 crossing reserve lock. | V8.37 cbcbe06 |
| 2026-07-11 | 2026-07-15 | index.html | Kolawole Ola (0x33b5) — auto-reentry didn't engage after softParkIdle. V8.37: all pairs scanned + "Auto-rescue active — within 24h" hint added. | V8.37 cbcbe06 |
| 2026-07-15 | 2026-07-15 | index.html | Les Gay Jr (0x7343) — referrals not counting and "My Node ID" confusion. V8.37 scans all pairs via allPairsStatus(). | V8.37 cbcbe06 |
| 2026-07-15 | 2026-07-15 | index.html | KolaOla (0x5704) — dashboard still showing V8.36. CDN cache — hard refresh resolves. | — |
| 2026-07-15 | 2026-07-15 | index.html | KolaOla (0x5704) — intermittent wallet connect failure. MetaMask extension issue — refresh and reconnect. | — |
| 2026-07-11 | 2026-07-15 | index.html | Koach100 (0x9ae3) — registration tx keeps failing. RPC rate limit — retry after a few seconds resolves. | — |
| 2026-07-08 | 2026-07-15 | Coupon System | Sherwyn (0x1e8e) — coupon void after V8.34+ redeploy. Coupons are contract-bound; old codes invalid on fresh deploys. | — |
| 2026-07-15 | 2026-07-15 | index.html | @ThanksAndPraises (0x3c17) — V8.36 still showing. Self-resolved with page reload. Badge permanently fixed. | d3ad976 |
| 2026-07-15 | 2026-07-15 | index.html | KolaOla (0x0d5b) — registration spinner appeared stuck. Resolved with V8.37 frontend update. | V8.37 |
| 2026-07-15 | 2026-07-15 | index.html | TokenPocket — "⚠️ Wrong Network" banner on first connection. Root cause: sync chainId race condition. Fix: async eth_chainId RPC call in connectWallet(). | — |
| 2026-07-15 | 2026-07-15 | index.html | Phantom — "Unsupported network" popup on connect. Fix: detect Phantom early and show clear toast. | — |
