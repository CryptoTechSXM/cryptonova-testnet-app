# CryptoNova — Issue Tracker

> Drop new issues here as members report them. Start a session with "check BUGS.md" and Claude will read this directly.
> Format: **[Page] — What happened / What was expected** + wallet type if relevant + consistent or intermittent

---

## Open Issues

### [2026-07-17] Other — ❌ "", "from": "0xFB3Adda5454d23f5A60Ee12cAF75891e9712f9D3", …
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** MetaMask
- **Wallet Address:** 0xfb3adda5454d23f5a60ee12caf75891e9712f9d3
- **Frequency:** Consistent
- **What happened:** ❌ "", "from": "0xFB3Adda5454d23f5A60Ee12cAF75891e9712f9D3", "to": "0x98A004bB73fbb06b436f2F1FC1d8433Ce ...
- **What was expected:** To be upgraded...
- **Notes:** getting this error when trying to upgrade to T2 using MM....  Seems like MM is sending to a different address from CNova.. Approval didn't give this error.
- **Submitted:** Fri, 17 Jul 2026 01:29:53 GMT


### [2026-07-16] Other — When trying to register, there is an error message
- **Reporter:** Barbara
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x997b9a4f7c107b07ae5b5ab9ce19f6a8b728b4f6
- **Frequency:** Intermittent
- **What happened:** Registration tx reverted (CALL_EXCEPTION, status=0) — full error details truncated in form
- **What was expected:** Successful registration
- **Submitted:** Thu, 16 Jul 2026 00:11:08 GMT
- **Status:** ⚠️ Needs more info — ask Barbara to retry and share the full error or screenshot

### [2026-07-16] index.html — Upgrade TX reverts (TokenPocket, already in T2)
- **Reporter:** Sherwyn
- **Page:** Onboarding / Registration (upgrade card)
- **Wallet Type:** TokenPocket
- **Wallet Address:** 0x774481dac8584cfafb5b6b6fad883787b343c573
- **Frequency:** Consistent
- **What happened:** manualUpgrade(1) reverted — "TR: already seated in target tier"
- **Root cause:** memberHighestTier=T2; wallet is already in T2. UI showed upgrade button regardless.
- **Fix:** Added `memberHighestTier` to `_executeUpgrade` pre-flight — now shows "✅ Already in T2" before submitting tx. Also added to `friendlyError()`.
- **Status:** ✅ Fixed — pending push

### [2026-07-17] index.html — T2 upgrade TX fails (MetaMask)
- **Reporter:** Sherwyn
- **Page:** index (upgrade card)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0xfb3adda5454d23f5a60ee12caf75891e9712f9d3
- **Frequency:** Consistent (at time of report)
- **What happened:** manualUpgrade(1) reverted with empty error message
- **Root cause:** On-chain simulation NOW passes ($82 USDC, $25 allowance, T1 member). Likely transient RPC blip or stale state at time of report.
- **Status:** ✅ Resolved — ask Sherwyn to retry; simulation confirms tx will succeed

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
