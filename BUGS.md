# CryptoNova — Issue Tracker

> Drop new issues here as members report them. Start a session with "check BUGS.md" and Claude will read this directly.
> Format: **[Page] — What happened / What was expected** + wallet type if relevant + consistent or intermittent
> **Triage flow (owner, 2026-07-24):** new reports auto-land under **Open Issues** (do not rename that heading — api/submit-bug.js inserts by that exact marker). Triage each new report → respond to the member → move it to **Pending — Responded** with the response time. After **12 hours with no follow-up**, move to Resolved ("no follow-up after response"). If it recurs, the member files a fresh report. Confirmed engineering bugs move to **Fix In Progress** and close only when the fix ships, regardless of member response.
> **Owner test reports:** reports from **CryptoTech** are the owner verifying a member's theory — triage them as test evidence (usually straight to Resolved with the finding), not as new member issues.
> **Bug bounty ($1/accepted find):** when accepting a real find during triage, ALSO add it to `bounties.json` (repo root — powers the dashboard footer score + the bug-report page scoreboard). Group multi-wallet reporters under one entry; mark duplicates/test artifacts with their status; record payouts in `paid_usd`.

---

## BASELINE RESET — V8.44, 2026-07-25

**Everything reported before this line is archived in `BUGS_PRE_V8_44_ARCHIVE.md`.**
V8.44 was a fresh full redeploy (new contracts, new matrix, all positions reset), so older
reports describe contracts that no longer exist. The archive header lists exactly which of
them V8.44 resolved — most notably the two biggest member complaints:

- **"My account graduated / was kicked out instead of re-entering"** → cycle-out is now
  funded from the crossing reserve + earnings, and an underfunded member is **parked and
  rescuable**, never silently exited.
- **"Stuck in Matrix B / tiers not looping"** → a pair's own members now return to their own
  MatB, and a full matrix rotates on the next entry instead of waiting on a keeper.

**If an old symptom reappears on V8.44 it is a NEW report** — file it fresh so V8.44
behaviour stays distinguishable from V8.43 history.

**Live V8.44 watch-list (for triage):**
- MatB `rotationCount` must climb on every pair (was frozen at 0 on V8.43).
- Parked members should drain via self-rescue / rescue keeper, not accumulate.
- No wallet should hold `crossingReserve > 0` while neither seated nor parked.
- Frontend note: `withdrawableOf` now INCLUDES un-settled pool accrual, and
  `PoolShareCredited` fires at settle (aggregated), not once per rotation.
- New member-facing functions not yet surfaced in the UI: `bulkWithdraw`, `hybridUpgrade`,
  `exitSeat` (20% penalty on released reserve), `registerWithOptions` / `registerWithPermit`.

---

## Open Issues

_No open reports. New submissions land here automatically._

## Pending — Responded (12h auto-close)

## Fix In Progress — closes when the fix ships

### [2026-07-29] FUND LOSS — entering a tier where you already hold commission DESTROYS the balance
- **Reporter:** Owner (0xe8Ad7bbA), spotted as "withdrew $1k twice but Total Withdrawn is wrong"
- **Page:** Contract — `MatrixLogicLib._register` (:313-345). Not a frontend bug.
- **Severity:** HIGHEST open item. **This is the only known bug that can delete money a member already owns.** V8.46 item 8; ship before Thursday/Friday's funded push.
- **What happened:** Two $1,000 withdrawals. The wallet received **$1,970.00** (= $2,000 x 0.985 after the 1.5% fee), but the dashboard totalled **$1,947.50** — short exactly **$52.50**.
- **Diagnosis (proven, not inferred):** Sixteen USDC payouts reconciled against the per-matrix ledgers (`wallet_inflow.js`); fifteen matched to the cent. T3.1 MatA paid $51.71 net with `totalWithdrawn` reading $0.00. The receipt (`tx_decode.js` on `0xb11eee58`) shows `withdrawPartial(uint256)` with arg **$52.50**, and BOTH `WithdrawalFeeCharged $0.79` and `EarningsWithdrawn $51.71`, status SUCCESS — so the counter WAS incremented at `withdrawCore:996`. It was zeroed afterwards: withdrawal at block 44796516 (~21:40 UTC), **`joinedAt` now 23:30:02 UTC, nearly two hours later.**
- **Root cause:** `_register` treats `!hasEverJoined` as "no record exists" and builds a **fresh struct** (`withdrawable: 0, totalEarned: 0, totalWithdrawn: 0, crossingReserve: 0`). But the flag really means "never took a seat here", and two paths write real values without setting it: `_credit` (:928) credits referral commission into the matrix where **your DOWNLINE** entered, and `withdrawCore` gates on `withdrawable > 0` rather than membership, so a commission-only holder can withdraw too. Entering that tier later therefore overwrites live balances and history with zero. The USDC stays in the matrix as unattributed surplus with no claim against it.
- **Why only one of sixteen:** T3.1 MatA is the only commission-only matrix this member subsequently entered for real.
- **The owner escaped fund loss by ordering alone** — he had already withdrawn, so `withdrawable` was $0 when the reset landed. Entering first would have DELETED the $52.50 rather than merely unrecording it.
- **Exposure:** anyone with `hasEverJoined == false && withdrawable > 0` in any matrix. Since `_credit` targets uplines, that is "every member whose direct went higher than they did" — most leaders. Detector to build: `credit_at_risk.js`.
- **Interim mitigation if V8.46 slips: withdraw BEFORE upgrading.** A withdrawn balance cannot be erased; only the (log-reconstructible) history is lost.
- **STATUS 2026-07-29 — DIAGNOSED, fix + 5 tests specified in `V8_46_PLAN.md` item 8.** Fix is a field-wise update instead of a struct construction; lives in `MatrixLogicLib`, which is LINKED not embedded, so it costs the factory no bytecode.
- **Already-destroyed values are not recoverable from state.** They can be rebuilt from logs (`EarningsWithdrawn` for `totalWithdrawn`). No member is owed USDC from this instance — the money was paid out before the reset.

### [2026-07-29] Total Withdrawn under-reported — matrices counted by balance instead of history
- **Reporter:** Owner, mid-call
- **Page:** Dashboard (index.html:4613 and :5546)
- **What happened:** Withdrew ~$1,000 and "Total Withdrawn" barely moved.
- **Root cause:** `totalWithdrawn` and `totalEarned` are **per-matrix** fields, so the headline is a SUM over an enumerated set — and the filter admitted a commission-only matrix only while `withdrawable > 0`. A tier drained to zero then fails both limbs (never joined, no balance), so **the act of claiming the money removed the record of the claim.** Measured on 0xe8Ad7bbA: ten such matrices held $1,651.00 of history; dashboard showed $296.50 against a true $1,947.50.
- **STATUS 2026-07-29 — FIXED, commit ce6c734, live on admin.** Filter now tests history: `withdrawable > 0 || totalWithdrawn > 0 || totalEarned > 0`, at BOTH sites (the dashboard loop and the breakdown modal — the in-code comment already warned they must match, which is the only reason the second was found). Members will see Total Withdrawn and Total Earned INCREASE.
- **Note:** this fix is why the $52.50 above became visible. The remaining $52.50 gap is the contract bug, not this one.

### [2026-07-29] Auto-upgrade — fails despite sufficient earnings (community call)
- **Reporter:** Community call (owner relay) — June's account cited
- **Page:** Dashboard (index.html)
- **Frequency:** Consistent on affected accounts
- **What happened:** Account showed only **$0.25 available** against **$88.98 total earned**, and auto-upgrade did not fire.
- **What was expected:** Auto-upgrade to trigger from accumulated earnings.
- **STATUS 2026-07-29 — NOT YET DIAGNOSED, address needed.** Leading hypothesis, testable in one run of `member_ledger.js`: `$0.25` is `freeWithdrawable` (after the crossing reserve AND the whole automation reserve are withheld) while `$88.98` is lifetime `totalEarned` across every matrix. Those are different quantities and the screen puts them side by side. If confirmed it is a WORDING bug, not an engine bug — but `_executeAdditive` spends `escrow + withdrawable` in the cycling matrix only, so a genuine funding gap is also possible. **Need June's wallet address to settle it.**

### [2026-07-29] Auto-upgrade — T2 upgrade appears to require funds already in T2 (community call)
- **Reporter:** Community call (owner relay)
- **Page:** Dashboard (index.html)
- **What happened:** A T1→T2 auto-upgrade behaved as though it needed a balance in T2 rather than in T1.
- **STATUS 2026-07-29 — OPEN, no explanation yet.** Worth checking against `onCrossToMatB` (TierRouter:1136-1143), whose funding paths are the member's WALLET (needs a standing allowance) or `withdrawableOf` in **the MatA they just crossed out of**. If any caller reads the destination tier's balance instead of the source's, that is this bug. Not reproduced yet.

### [2026-07-29] Cycle-out — accounts with several tiers enabled graduate incorrectly; others cycle indefinitely (community call)
- **Reporter:** Community call (owner relay)
- **What happened:** Accounts with multiple tier enablements graduate when they should re-enter; other accounts cycle repeatedly without ever graduating.
- **STATUS 2026-07-29 — OPEN.** Both symptoms point at the additive engine's priority order (`_executeAdditive`, TierRouter:1274-1360): re-entry consumes `curFee` FIRST, then upgrade needs `nextFee` from the remainder, then double needs `curFee` again. Which branch fires is decided purely by how much the cycle-out carried, so the same settings produce different outcomes at different balances. Related and already recorded: **V8.46-C** (silent graduation — the empty catch at `MatrixLogicLib:513` drops a member with no seat, no park and no event; a live instance was confirmed today on `0x473C629A`, which had 15 consecutive re-entries and then simply stopped).

### [2026-07-29] Double re-entry blocks graduation entirely (community call)
- **Reporter:** Community call (owner relay)
- **What happened:** With Double Re-entry enabled, accounts never graduate — they stay in continuous cycles.
- **STATUS 2026-07-29 — OPEN, mechanism plausible from source.** `_executeAdditive` step 3 (`doubleOn && anySeat && escrow + withdrawable >= curFee`) spends a SECOND `curFee` in the current tier after the re-entry has already taken one. A member with double enabled therefore consumes on two same-tier seats the funds that would otherwise have covered `nextFee` and moved them up. If that is the whole story it is working as designed and mis-explained to members — but it needs confirming against a real wallet before we say so.

### [2026-07-29] Rescue loan cannot repay once the member leaves that matrix — V8.46 item 7
- **Reporter:** Community call (Sherwyn's $1.68) + owner (0xe8Ad7bbA)
- **What happened:** A rescue loan stays outstanding through many Tier 1 rotations.
- **STATUS 2026-07-29 — DIAGNOSED, fix specified in `V8_46_PLAN.md` item 7.** `rescueDebt` is per-matrix and clears only from a pool share in that matrix (`_settlePool:450`, gated by `if (share == 0) return;`) or a cycle-out from it (`_cycleOutRoot:548`, needs `withdrawable > 0`). A member who has moved on triggers neither, so rotating elsewhere cannot touch it. `rescueRepayBps` is 10,000 (100%) — not a rate problem. Measured on 0xe8Ad7bbA: T1.1 MatA $2.07 and T2.1 MatA $2.75 outstanding, with **$35.00 withdrawable sitting in that same T2.1 MatA** and `withdrawCore` never reading `rescueDebt`. One deduction in `withdrawCore` fixes it.

### [2026-07-29] Rescue panel vanishes silently when a rescue completes
- **Reporter:** CryptoJan22 (via the second of two reports today)
- **Page:** Dashboard (index.html)
- **What happened:** After the co-pay keeper rescued their second position, the Self Rescue button simply disappeared — indistinguishable from a button that never rendered.
- **STATUS 2026-07-29 — CONFIRMED, frontend work queued.** Needs a short confirmation ("you have been re-entered, nothing pending") instead of an empty panel. Also: the panel re-checks every 30 seconds, so there is a visible lag between an approval confirming and the button activating — refresh on the approval receipt instead of waiting for the next tick.

### [2026-07-26] Onboarding / Registration — The upgrade option is not visibly working. I an bot able to …
- **Reporter:** Kira
- **Page:** Onboarding / Registration
- **Wallet Type:** Rabby
- **Wallet Address:** 0x0f50998163f3dee028a3d72153659d08aede45f3
- **Frequency:** Consistent
- **What happened:** The upgrade option is not visibly working. I an bot able to upgrade from that page. Once registered it is non functional, only available on dashboard!
- **What was expected:** I expected to have the option to upgrade from either places registration and dashboard!
- **Submitted:** Sun, 26 Jul 2026 23:08:21 GMT
**CONFIRMED 2026-07-29 — still open.** The upgrade controls exist only on the Dashboard. Adding them to the Registration page is queued as frontend work; no contract change needed. Members can upgrade from the Dashboard meanwhile.

### [2026-07-27] Other — ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) …
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** TokenPocket
- **Wallet Address:** 0x1e8e2dcf876d0d94077c93a7e33bda2ab72ab1f7
- **Frequency:** Consistent
- **What happened:** ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below. Using bug report because none of the above worked...
- **What was expected:** To be reentered..
- **Notes:** Not sure why re-enter matrix and not self rescue...
- **Submitted:** Mon, 27 Jul 2026 20:01:59 GMT
- **FIXED 2026-07-27 (commit c7916c8, live on all branches):** the **Re-Enter Matrix** button carried a static `gasLimit: 800_000`. `register()` into a full MatA triggers a rotation cascade — measured at production size the same day at **5,127,660 gas** for a peak entry during rotation — so the transaction ran out of gas and reverted. Out-of-gas carries no custom error, so the custom-error decoding shipped earlier that day had nothing to decode and fell through to the generic "Transaction failed on-chain" message he quoted. **Same class as his own 2026-07-24 find** (Upgrade Tier hardcoded at 2M). Now on the estimateGas ladder used by self-rescue (est +30%, capped at 15M). Swept the rest of index.html: every other static gas limit is on a cheap non-cascading call.
- **SECOND FINDING — his auto re-entry is OFF.** `member_history.js` on this wallet shows two cycle-outs recorded as `PARKED (autoReentry disabled)`. He expected automatic re-entry; the contract was following his settings. This is exactly @Koach100's report — the toggle silently changes every future cycle-out — and the confirmation dialog shipped 2026-07-27 (38605d7) exists to prevent it. It bit Sherwyn before that warning existed. **He should be told directly**, or he will keep cycling out and stopping.
- **THIRD FINDING — a tenth orphaned cycle-out.** Tx `0x462bf842b1b63afba13b4cbfef96b71d81d3639b786ded4ef311b3e72f7c4294`, block 44700243, T1.1 MatA cycle #2: `MemberCycledOut` with **no park, no cross, no event of any kind**. His four other cycle-outs all emitted something, including one from the same MatA under the same settings — so disabled auto re-entry does not explain it. Matches the silent-graduation signature (MatrixLogicLib:513 empty catch; V8.46-C fixes it, not yet deployed). **First graduation instance with a specific replayable tx hash** — forking Base Sepolia at that block and replaying with tracing would reveal what actually reverted, unknown since the first eight. That answer decides whether V8.46-B's depth guard is needed.

### [2026-07-27] Dashboard (index.html) — Incomplete information. withdrawable card shows 1507.xx whil…
- **Reporter:** Kira
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x0f50998163f3dee028a3d72153659d08aede45f3
- **Frequency:** Consistent
- **What happened:** Incomplete information. withdrawable card shows 1507.xx while the withdrawable breakdown does not reflect that.
- **What was expected:** More details including referral income. without that it looks incomplete.
- **Notes:** Add more details, income per tier, income from direct referrals, what is available for crossing each tier. that would help members understand better the balance that can be used per tier.
- **Submitted:** Mon, 27 Jul 2026 17:15:10 GMT
- **FIXED 2026-07-27 (commit 81a5793, on admin):** real bug, and the second half of Sherwyn's 2026-07-24 find. L1 upgrade commissions credit a sponsor's `withdrawable` in tier matrices they never joined, so `hasEverJoined` stays false there while a genuinely claimable balance accrues (allowed by the contract since V8.36). The dashboard CARD was fixed on the 24th to count those matrices; `_getAllMatrixMembers`, which feeds the breakdown modal, was not — it still filtered on `hasEverJoined` alone and silently dropped every commission-only tier. A heavy sponsor therefore saw a headline over $1,300 against a breakdown of $25 listing only the two tiers she personally joined. Both loops now apply the same filter, with a note on each that they must stay in step. Reproduced independently in the owner's own screenshots before fixing.
- **STILL OPEN (feature, not defect):** her second request — referral income, income per tier, and what is available for crossing at each tier — is a larger addition to the breakdown modal and is tracked separately below.

### [2026-07-27] Dashboard (index.html) — I am parked and but continue collected from directs, eventua…
- **Reporter:** Kira
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x0f50998163f3dee028a3d72153659d08aede45f3
- **Frequency:** Consistent
- **What happened:** I am parked and but continue collected from directs, eventually I have enough to self rescue. I need to refresh the page to get the button active.
- **What was expected:** It should be active like so no need to refresh page. It is easy to click refresh on desktop but mobile might be tricky.
- **Notes:** Maybe add a refresh button next to the self rescue earning covers it button...
- **Submitted:** Mon, 27 Jul 2026 14:16:04 GMT
- **FIXED 2026-07-27 (commit 38605d7, on admin):** correct report — earnings arrive continuously while parked but the shortfall was only recalculated on a full page load, so the button stayed disabled until reload. Added a **Refresh balance** button plus a 30s auto-poll that runs only while the rescue panel is visible and stops once you are no longer parked. The status line now states whether earnings cover the fee or how much is still short. Her suggestion of a button beside the rescue control was adopted as-is.

### [2026-07-27] Other — Enough funds in wallet to re-enter and upgrade hence I'm get…
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** TokenPocket
- **Wallet Address:** 0x50c8426e34c14859dcbf361f80e9b5d3412780e0
- **Frequency:** Consistent
- **What happened:** Enough funds in wallet to re-enter and upgrade hence I'm getting a popup saying to self rescue( T1.1) and also option to upgrade to T2..
- **What was expected:** To be automatically re-entered and upgraded since enough funds are in the account and the auto buttons are enabled...
- **Notes:** Will hold on self rescue for a while, so you can check the wallet to see what is happening before doing the rescue if you can't fix the issue without a complete system restart.
- **Submitted:** Mon, 27 Jul 2026 13:43:54 GMT
- **DIAGNOSED 2026-07-27 — working as designed, interface was misleading.** On-chain this wallet is SEATED in T1.1 MatA with **reserve $5.00 + withdrawable $3.85 = $8.85** against a $10 fee: short **$1.15 in-matrix**. Automatic re-entry and automatic upgrade can ONLY spend the crossing reserve plus earnings held inside the matrix. Wallet USDC is invisible to them and is only spent by a manual Self Rescue or Upgrade — so a funded wallet does not prevent parking. Options were all correct (autoReentry true, upgrade enabled). **UI fix (38605d7):** the rescue panel now shows *In-matrix total* and *Your wallet USDC* as separate rows, colours the in-matrix figure by whether it covers the fee, and explains that the two are different pots. Nothing to fix in the contract.

### [2026-07-27] Dashboard (index.html) — T3 has not cycled. It's at 0 . The position in the matrix is…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x1ca3316ebc2f991c073ccdd1a25c68d482589a94
- **Frequency:** Consistent
- **What happened:** T3 has not cycled. It's at 0 . The position in the matrix is #4. All the other tiers have cycled multiple times.
- **What was expected:** I expected this tier to cycle like the others.
- **Notes:** this account is upgraded to Tier 7
- **Submitted:** Mon, 27 Jul 2026 03:30:19 GMT


> **Triage pass 2026-07-27, ~10 PM EDT — 20 reports.**
> 9 Resolved · 3 Pending-Responded · 5 Fix In Progress · 3 still Open.
>
> **The three "T5 upgrade check failed" reports were diagnosed after the first pass and
> moved to Fix In Progress** — they are out-of-USDC errors wearing a network error's
> clothing. `bulkUpgrade` pulls the TOTAL fee for every remaining tier in one
> `safeTransferFrom` (TierRouter:979), and OpenZeppelin's `ERC20InsufficientBalance` is a
> custom error that was missing from the frontend ABI, so ethers returned `reason=null`
> and the UI blamed the RPC. The three reporting wallets held **$4.86 (0x46cc05),
> $12.83 (0x832b95) and $13.14 (0x185b19)**. Fix committed as `7b3c327`, not yet pushed.
>
> **Only 3 reports below are genuinely undiagnosed:**
> 1. Lavern's "approved funds didn't appear" on 0x145805 — that wallet holds **$8,194**,
>    so unlike the others it is NOT a balance problem. Needs its own look.
> 2. @queensonnie's direct-referral count not showing 2.
> 3. Kira's registration-page upgrade button — likely a design gap rather than a fault
>    (the upgrade control only exists on the dashboard), so decide the intent first.
>
> Separately, Sherwyn observed T5 being offered to an account that never reached T2 —
> worth checking `_upgradeEligible` against what the dashboard displays.
- **DIAGNOSED 2026-07-27 — not a fault, but a UX hazard now fixed.** Two separate things: (1) **T3 is at 2 cycles on-chain, not 0** — the dashboard figure he read is wrong and that part is STILL OPEN. (2) He holds seats only in T5-T8 because he switched auto re-entry OFF: `member_history.js` shows his last cycle-out in each of T1/T2/T3/T4 recorded as **PARKED (autoReentry disabled)** — a clean graduation that returns the crossing reserve to withdrawable but does NOT keep the seat. Every earlier cycle-out parked normally with a shortfall. Turning the option back on (it reads true now) does not restore tiers already left; those need 'Graduated tier re-entry'. **UI fix (38605d7):** switching auto re-entry off now requires confirming a dialog that states the consequence explicitly. His trail also surfaced a NINTH silent graduation (tx 0xe9e8067…, T5.1 MatA at block 44668146).

### [2026-07-26] Dashboard (index.html) — T5 upgrade check failed — try again in a moment (RPC may be …
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x46cc052b2eb70f869b8ceae6f217d475a4e0c6d5
- **Frequency:** Consistent
- **What happened:** T5 upgrade check failed — try again in a moment (RPC may be busy
- **What was expected:** To upgrade to tier 5.
- **Submitted:** Sun, 26 Jul 2026 20:48:40 GMT
- **DIAGNOSED 2026-07-27 -> Fix In Progress:** not an RPC fault. `bulkUpgrade` collects the TOTAL fee for every remaining tier in one `safeTransferFrom`; this wallet did not hold it. The real revert was OpenZeppelin `ERC20InsufficientBalance`, a custom error absent from the frontend ABI, so ethers returned reason=null and the UI fell back to "RPC may be busy". Fix `7b3c327` declares all 8 contract custom errors + the 2 ERC20 ones, decodes them with real figures, and checks balance/allowance before blaming the network. Closes when pushed.

### [2026-07-26] Dashboard (index.html) — Could not upgrade bulk tiers.
5 upgrade check failed — try a…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x832b95a579478784fada54ad7b62c7963e21fefb
- **Frequency:** Consistent
- **What happened:** Could not upgrade bulk tiers.
5 upgrade check failed — try again in a moment (RPC may be busy).
- **What was expected:** To upgrade to tier 5.
- **Submitted:** Sun, 26 Jul 2026 19:40:25 GMT
- **DIAGNOSED 2026-07-27 -> Fix In Progress:** not an RPC fault. `bulkUpgrade` collects the TOTAL fee for every remaining tier in one `safeTransferFrom`; this wallet did not hold it. The real revert was OpenZeppelin `ERC20InsufficientBalance`, a custom error absent from the frontend ABI, so ethers returned reason=null and the UI fell back to "RPC may be busy". Fix `7b3c327` declares all 8 contract custom errors + the 2 ERC20 ones, decodes them with real figures, and checks balance/allowance before blaming the network. Closes when pushed.

### [2026-07-26] Dashboard (index.html) — System not upgrading bulk tiers.
T5 upgrade check failed — t…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x185b19c7d3872692981568985b21ae6f7f6be2a4
- **Frequency:** Consistent
- **What happened:** System not upgrading bulk tiers.
T5 upgrade check failed — try again in a moment (RPC may be busy).
- **What was expected:** Upgrading to tier 5.
- **Submitted:** Sun, 26 Jul 2026 19:34:46 GMT
- **DIAGNOSED 2026-07-27 -> Fix In Progress:** not an RPC fault. `bulkUpgrade` collects the TOTAL fee for every remaining tier in one `safeTransferFrom`; this wallet did not hold it. The real revert was OpenZeppelin `ERC20InsufficientBalance`, a custom error absent from the frontend ABI, so ethers returned reason=null and the UI fell back to "RPC may be busy". Fix `7b3c327` declares all 8 contract custom errors + the 2 ERC20 ones, decodes them with real figures, and checks balance/allowance before blaming the network. Closes when pushed.

### [2026-07-26] Other — on the tiers page the information is a bit ambiguous.
- **Reporter:** Kira
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x0f50998163f3dee028a3d72153659d08aede45f3
- **Frequency:** Consistent
- **What happened:** on the tiers page the information is a bit ambiguous.
- **What was expected:** the T1.1/T2.1 new pairs could have the count when new.
- **Notes:** Also the slow down on T1 is very noticeable maybe we can increase the numbers to 400 or 500?
- **Submitted:** Sun, 26 Jul 2026 23:20:05 GMT
- **FIX IN PROGRESS:** accepted, not yet shipped.

### [2026-07-26] Bug Report Page — Back to dash board after submitting report takes you to home…
- **Reporter:** Sherwyn
- **Page:** Bug Report Page
- **Wallet Type:** Rabby
- **Wallet Address:** 0x001d82fb20dc3b947f7023f198eee009533538a3
- **Frequency:** Consistent
- **What happened:** Back to dash board after submitting report takes you to home page and not the dash board..
- **What was expected:** Back to dash board as link states..
- **Notes:** Know it may just be cosmetics and not a bug but just reporting..
- **Submitted:** Sun, 26 Jul 2026 13:33:58 GMT
- **FIX IN PROGRESS:** accepted, not yet shipped.


## Mainnet-Prep Design Questions (not bugs — decide before mainnet launch)

### [2026-07-29] Pay-it-forward voucher gifting (community idea — Sherwyn)
- **Proposal:** A new member gifts their initial $10 entry onward to the next joiner, chaining entries.
- **STATUS 2026-07-29:** Owner agreed to test. Design questions before it can be built: does the gift create a referral relationship (and therefore an L1 commission path), or an unattributed entry? `register(address referrer)` requires a referrer, and `_credit` pays commission into the matrix where the entry lands — so a gifted entry with no sponsor needs an explicit rule. Coupon machinery already exists (`registerWithCoupon`, `routerCouponEntry`) and is the likely vehicle.

### [2026-07-29] Syndicate / group account (community idea)
- **Proposal:** A shared account funded by several members.
- **STATUS 2026-07-29:** Discussed, not specified. Blocking question: the contract enforces one position per member per tier (`_requireNotSeated` / the V8.46 pair guard), and earnings credit a single address. A syndicate therefore needs off-chain custody or a wrapper contract, and the payout split is not something the matrix can express. Decide before mainnet — retro-fitting it would touch the entry path.

### Exit penalty rate — confirm before mainnet
- `exitSeat()` ships with **20%** of the released crossing reserve as the penalty
  (DAO menu: 0 / 10 / 20 / 30 / 50%). Owner confirmed 20% for V8.44 testnet.
- Revisit once members actually use it: too high reads as punitive, too low weakens the
  crossing loop that funds everyone's payouts.

### Deployer wallet for mainnet
- V8.44 testnet deploys from `0xCd0Af6…`, which is EIP-7702 delegated (MetaMask stateless
  delegator) — accepted on testnet for MockUSDC minting convenience.
- **Mainnet requires a fresh, never-delegated deployer.** Do not carry the exception over.

---

## Resolved Issues

### [2026-07-29] Other — ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) …
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x1e8e2dcf876d0d94077c93a7e33bda2ab72ab1f7
- **Frequency:** Consistent
- **What happened:** ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below. Still getting this on self rescue..
- **What was expected:** To be rescued...
- **Notes:** Just a follow up and tried this before but was hoping it was a testnet thing...lol
- **Submitted:** Wed, 29 Jul 2026 00:24:31 GMT
**RESPONDED 2026-07-29:** Not a fault — a funding shortfall the UI never named. `ticket_triage.js`: parked T2.1 MatA, re-entry $25.00 = $12.50 crossing reserve + $0.63 earned = $13.13, **short $11.88**. Wallet holds $9.61 and $11.88 is already approved, so they need **$2.26 more USDC** and then Self Rescue. Two frontend causes of the useless message are fixed: `SELF_RESCUE_ABI` was one line with no error definitions so the OZ ERC20 custom errors could not decode (`2337401`), and the shortfall is now stated in dollars with the exact action. Awaiting member top-up.
**RESOLVED 2026-07-29 — the bug is fixed; the remaining step is a top-up, not a fix.** The misleading message had two real causes and both shipped today: `SELF_RESCUE_ABI` carried no error definitions so the OpenZeppelin ERC20 custom errors could not decode, and the panel never named the shortfall or the contract to approve. The rescue itself is short **$2.26** of wallet USDC ($11.88 needed, $11.88 already approved, $9.61 held). Nothing is owed and the position is intact. Reported three times before it was traced — that persistence is what got it found.

### [2026-07-28] Dashboard (index.html) — cant self rescue. it says already in matrix.
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x3289a65c0ee26fd369a6bbd45d214209832db8f0
- **Frequency:** Consistent
- **What happened:** cant self rescue. it says already in matrix.
- **What was expected:** pay fee and move on.
- **Submitted:** Tue, 28 Jul 2026 21:10:41 GMT
**RESPONDED 2026-07-29:** Parked in BOTH halves of T3.1. **T3.1 MatA can be rescued right now** — short $23.75, already approved $23.75, `selfRescue` estimates 9,982,980 gas and will succeed. T3.1 MatB is short $7.68 and needs an approval to that matrix. Also fixed today: the dashboard used to show only ONE parked position, so the second was invisible — every position now has its own numbers and buttons (`d71254a`). Awaiting member action.
**RESOLVED 2026-07-29.** "Already in matrix" was accurate, not a fault: parked in BOTH halves of T3.1. T3.1 MatA can be rescued now (short $23.75, already approved). T3.1 MatB is short $7.68 and needs an approval to that matrix. The actual defect was that the dashboard only ever showed ONE parked position, so the second was invisible — every position now has its own figures and buttons (`d71254a`).

### [2026-07-28] Other — Rescue would fail: F8V8: already in matrix
- **Reporter:** Maximum - 71
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x5f3f81525655ec12659bc1ef7d74e0d1b99d9a74
- **Frequency:** Consistent
- **What happened:** Rescue would fail: F8V8: already in matrix
- **What was expected:** ⏳ Action Required — Re-Entry Queue
- **Submitted:** Tue, 28 Jul 2026 20:20:19 GMT
**RESPONDED 2026-07-29:** Parked in FIVE positions — T2.1 MatB, T3.1 MatA, T4.1 MatA, T8.1 MatA, T9.1 MatA — totalling **$1,408.73** of shortfall against a **$0.00** wallet. T4.1 MatA is additionally blocked by holding the pair's other half (self-clearing). The "already in matrix" message was correct; what was missing was any way to see the other four positions, now fixed (`d71254a`). Needs a testnet top-up before any of them can complete.
**RESOLVED 2026-07-29.** Five parked positions — T2.1 MatB, T3.1 MatA, T4.1 MatA, T8.1 MatA, T9.1 MatA — totalling **$1,408.73** of shortfall against a $0.00 wallet. The message was correct; the defect was having no way to see the other four, now fixed (`d71254a`). T4.1 MatA is additionally blocked by holding the pair's other half, which self-clears. Needs a testnet top-up.

### [2026-07-28] Dashboard (index.html) — Rescue would fail: ❌ Transaction failed on-chain — hard-refr…
- **Reporter:** Cynthia Brown
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0xb9e6aed964ad17f2a9779f99dbc009f872e32919
- **Frequency:** Intermittent
- **What happened:** Rescue would fail: ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To be able to self rescue
- **Submitted:** Tue, 28 Jul 2026 19:42:27 GMT
**RESPONDED 2026-07-29:** Parked T2.1 MatB, short **$7.93**, wallet holds $27.20 — enough. They need to approve $7.93 **to that matrix** (not TierRouter) and press Self Rescue. The rescue panel now names the amount and targets the right contract instead of failing with "Transaction failed on-chain". Awaiting member action.
**RESOLVED 2026-07-29.** Short **$7.93** with $27.20 in the wallet — enough. The approval has to go to **that matrix**, not TierRouter, which the panel never said. It now names the amount and targets the right contract instead of failing with "Transaction failed on-chain".

### [2026-07-28] Dashboard (index.html) — I tried to self rescue from T2.1 Matrix A and it kept failin…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x5d6ca88ac287579c8d8660c881302bad6bf0d2f2
- **Frequency:** Consistent
- **What happened:** I tried to self rescue from T2.1 Matrix A and it kept failing even though I did several hard refreshes.
- **What was expected:** I should have been able to cycle.
- **Notes:** here's the pop up message.    
Rescue would fail: ❌ Transaction failed on-chain
- **Submitted:** Tue, 28 Jul 2026 17:59:18 GMT
**RESPONDED 2026-07-29:** Parked in T2.1 / T3.1 / T4.1 MatA, short $3.48 / $7.51 / $15.99, wallet holds **$2.02** — needs roughly **$21 more** to clear all three. The failure was genuine but it was a shortfall, not a bug; the panel now states each amount separately (`d71254a`). Awaiting top-up.
**RESOLVED 2026-07-29.** Three parked positions — T2.1 / T3.1 / T4.1 MatA, short $3.48 / $7.51 / $15.99 — against $2.02 in the wallet, so roughly **$21 more** clears all three. The hard refreshes could never have helped; it was a funding shortfall the UI declined to name. Each amount is now shown separately (`d71254a`).

### [2026-07-28] Dashboard (index.html) — ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) …
- **Reporter:** Maximum_71
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x4cf7f43a4a2df2e86fd68d35562eb96bbe5ea5cd
- **Frequency:** Consistent
- **What happened:** ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** rescue
- **Submitted:** Tue, 28 Jul 2026 02:55:14 GMT
**RESPONDED 2026-07-29:** Parked in T4.1 MatA (blocked by holding the pair's other half — self-clearing), T8.1 MatA short $288.37 and T9.1 MatA short $1,006.97, against a **$0.00** wallet. Needs a top-up; nothing is owed and the positions are intact.
**RESOLVED 2026-07-29.** T8.1 MatA short $288.37, T9.1 MatA short $1,006.97, wallet $0.00. T4.1 MatA is blocked by holding the pair's other half and self-clears on the next rotation. Nothing is owed, all positions intact, needs a top-up.

### [2026-07-26] Dashboard (index.html) — I manually entered my account 2 and placed it under account …
- **Reporter:** @queensonnie
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x70569791ab42304adde5a34c412ec6e411ae0b0b
- **Frequency:** Intermittent
- **What happened:** I manually entered my account 2 and placed it under account 1 then, I copied the referral  link and placed it in the browser to place account 3 under account 1,  but it did not show that account 1 has 2 direct referrals.
- **What was expected:** Account 1 should have two Direct referrals
- **Submitted:** Sun, 26 Jul 2026 15:37:52 GMT
**RESPONDED 2026-07-29:** `ticket_triage.js` shows this wallet seated in T1.1 MatB and healthy. The referral-count fix shipped today (`a873e8d`) is the most likely explanation for the original discrepancy — the old lookup only counted directs currently seated in the lowest tiers. Asked the member to hard-refresh and confirm the number now reads correctly; if the placement itself still looks wrong we will trace it per-wallet.
**RESOLVED 2026-07-29 — this was a real bug and the reporter was right.** The contract has indexed `referrer` on `MemberRegistered` since V8.34 specifically so uplines could be queried by topic, but the frontend ABI still declared it un-indexed. Decoding failed silently, so every direct-referral lookup fell through to a positional scan that only counts directs **currently seated** in T1's pairs plus T2/T3 pair 1 — anyone who upgraded past T3, cycled out, parked, or landed in pair 2 was invisible. Fixed by filtering server-side on the topic (`a873e8d`); the fallback now always reports itself as incomplete, because it is a floor and never a total.

### [2026-07-26] Dashboard (index.html) — All day today on a more than ususl occurrence  my accounts h…
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x79470c63b5421e333ab4149b3206d55a39c17532
- **Frequency:** Consistent
- **What happened:** All day today on a more than ususl occurrence  my accounts have been sent to self rescue.
Some being charged as much as $41.00 and some as little as $0.60.
Sometimes when i take action and pay another self rescue immediately comes up with a smaller charge and when it is done it clears.
However the c nova tokens and earnings increase everytime.
- **What was expected:** All charged should be asked for at the same time. Not sure how frequently account should be parked though.
- **Submitted:** Sun, 26 Jul 2026 23:18:35 GMT
- **RESPONDED 2026-07-27:** see reply notes. Awaiting member confirmation (12h auto-close).
**RESOLVED 2026-07-29 — working as designed, plus one genuine fix.** The varying amounts ($0.60 to $41.00) are the funding rule, not a fault: the crossing reserve pre-funds exactly **50%** of the next entry fee and the other half must come from earnings, so the shortfall is whatever has not yet been earned at that moment. A member with no referral income parks repeatedly by design. The reporter's actual ask — "all charges should be asked for at the same time" — was legitimate and is now met: every parked position is listed together with its own amount (`d71254a`). CNOVA and earnings rising each cycle is correct behaviour.

### [2026-07-26] Dashboard (index.html) — Auto Self-rescue failed.
 Transaction failed on-chain — hard…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x832b95a579478784fada54ad7b62c7963e21fefb
- **Frequency:** Consistent
- **What happened:** Auto Self-rescue failed.
 Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To re-enter the queue.
- **Submitted:** Sun, 26 Jul 2026 12:15:16 GMT
- **RESPONDED 2026-07-27:** see reply notes. Awaiting member confirmation (12h auto-close).
**RESOLVED 2026-07-29.** Same cluster as the other self-rescue failures: the ABI could not decode the ERC20 custom errors, so an allowance or balance problem surfaced as "Transaction failed on-chain". Fixed today, along with a pre-check that states the shortfall in dollars and approves to the matrix rather than TierRouter. Please hard-refresh and retry — if anything still blocks it, the panel will now say what and why.

### [2026-07-26] Dashboard (index.html) — Self=rescue failed. Transaction failed on-chain — hard-refre…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x185b19c7d3872692981568985b21ae6f7f6be2a4
- **Frequency:** Consistent
- **What happened:** Self=rescue failed. Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To re-enter the Queque.
- **Submitted:** Sun, 26 Jul 2026 12:10:39 GMT
- **RESPONDED 2026-07-27:** see reply notes. Awaiting member confirmation (12h auto-close).
**RESOLVED 2026-07-29.** Second wallet, same cause and same fix as above. Hard-refresh and retry; any remaining blocker will now be named in plain figures rather than hidden behind a generic on-chain failure.
### [2026-07-29] Dashboard (index.html) — the self rescue button took some time but it eventually came…
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x9e0413a671f48da6317473e81eb089136e9f1273
- **Frequency:** Consistent
- **What happened:** the self rescue button took some time but it eventually came up.
- **What was expected:** success
- **Submitted:** Wed, 29 Jul 2026 21:15:22 GMT
**RESOLVED 2026-07-29:** Working, just slowly. The rescue panel re-checks every 30 seconds while parked, so there is a lag between the approval confirming and the Self Rescue button becoming active — which is what "took some time but eventually came up" describes. Related fix shipped the same day (`5a6dd64`): the button was being dimmed to opacity 0.5 whenever a shortfall existed, and a shortfall does NOT clear when you approve, so every refresh re-dimmed it. It now keys off the ALLOWANCE instead, so once the approval covers the shortfall the button goes full strength and the approve step disappears. **Follow-up worth doing: shorten the poll or refresh immediately after an approval receipt, so the wait is not mistaken for a fault.**

### [2026-07-29] Dashboard (index.html) — i have 2 self rescues .
first payment was made and self resc…
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x9e0413a671f48da6317473e81eb089136e9f1273
- **Frequency:** Consistent
- **What happened:** i have 2 self rescues .
first payment was made and self rescued.
second payment made but no self rescue button is available.
- **What was expected:** to be able to be rescued.
- **Submitted:** Wed, 29 Jul 2026 21:12:09 GMT
**RESOLVED 2026-07-29:** Both rescues completed — the panel was correct and looked broken. `ticket_triage.js` now shows this wallet at **T10, seated in all ten tiers** (T1.2 MatA + T2-T10 MatB) and parked nowhere. The second Self Rescue button was absent because there was nothing left to rescue: the co-pay rescue keeper (cron :04, every 10 min) reached that position first, so the member's own approval was never needed. **THE REAL GAP: when a rescue completes, the panel simply vanishes — identical, from the member's side, to a button that never appeared.** It should say so instead: a brief "you have been re-entered, nothing pending" confirmation. Queued as frontend work. Also fixed today for members genuinely parked in more than one place: the panel used to show only ONE position with no hint the others existed (`d71254a`).

### [2026-07-29] Other — I had four directs for this account, but it shows one direct…
- **Reporter:** @Lavern_Gay
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x145805e87ce365ad6c2636b8f6e10b6550f3dc2a
- **Frequency:** Consistent
- **What happened:** I had four directs for this account, but it shows one direct.
- **What was expected:** I expected to see all 
Four directs.
- **Submitted:** Wed, 29 Jul 2026 02:55:38 GMT
**RESOLVED 2026-07-29:** The frontend ABI declared `MemberRegistered`'s `referrer` as UN-indexed; the contract indexes it (TierRouter:335, V8.34). ethers looked for it in the log DATA where only `tier` lives, decoding failed, and every lookup fell through to a positional scan that only counts directs currently SEATED in T1's pairs + T2/T3 pair 1 — so a direct who upgraded past T3, cycled out or parked was invisible. Fixed in commit `a873e8d`: filter server-side with `filters.MemberRegistered(null, addr)`, chunk the range if the provider caps `eth_getLogs`, and the scan fallback now always reports `incomplete: true` because it is a floor, never a total.

### [2026-07-29] Other — Withdrawing $500 from $514 available.. ❌ Transaction failed …
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x50c8426e34c14859dcbf361f80e9b5d3412780e0
- **Frequency:** Consistent
- **What happened:** Withdrawing $500 from $514 available.. ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** A smooth withdrawal... lol
- **Notes:** Was trying a withdrawal and not withdraw all option.
- **Submitted:** Wed, 29 Jul 2026 00:21:30 GMT
**RESOLVED 2026-07-29:** Ours. Three places subtracted a flat **$10** as the locked amount — the withdrawal loop, the headline "Available USDC" and the per-tier rows. $10 is T1's entry fee and nothing else; the real lock is `ENTRY_FEE - crossingReserve` (`withdrawCore`:976) plus the whole automation reserve (:986), up to $2,500 at T9. So the site quoted money the contract would never release and `withdrawPartial` reverted every time. All three now call `freeWithdrawable()` (V8.44 G3) — commit `dc8237b`. Members holding high tiers will see "Available USDC" DROP; that is the correction, not a loss. **Why it survived: the per-tier rows deliberately mirrored the headline's wrong arithmetic so the rows would sum to it. Two wrong numbers agreeing looks exactly like two right ones.**

### [2026-07-28] Other — Rescue would fail: ❌ Transaction failed on-chain — hard-refr…
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** TokenPocket
- **Wallet Address:** 0x1e8e2dcf876d0d94077c93a7e33bda2ab72ab1f7
- **Frequency:** Consistent
- **What happened:** Rescue would fail: ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below. Trying to self rescue and this error.
- **What was expected:** To be self rescues.
- **Notes:** My other 3 accounts went through with no issues but this one keeps failing..
- **Submitted:** Tue, 28 Jul 2026 21:20:00 GMT
**RESOLVED 2026-07-29:** Same wallet and same cause as the 2026-07-29 report above — a $11.88 funding shortfall behind an undecodable revert. Closing as a duplicate; the member-facing thread is tracked on that entry.

### [2026-07-28] Dashboard (index.html) — cant self rescue. it says already in matrix.
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x5fc30b093b1728129353d76888e1af0636a36705
- **Frequency:** Consistent
- **What happened:** cant self rescue. it says already in matrix.
- **What was expected:** pay fee and move on.
- **Submitted:** Tue, 28 Jul 2026 21:19:20 GMT
**RESOLVED 2026-07-29:** Self-cleared. "F8V8: already in matrix" on a rescue means the member held BOTH halves of one pair, so re-entry would seat them twice and the contract correctly refuses. It clears itself when the held seat cycles out. `ticket_triage.js` now shows this wallet SEATED in T1.2 MatA and not parked — nothing owed, nothing lost. V8.46's pair guard at `MatrixLogicLib.enterMatrix` prevents the duplicate forming at all.

### [2026-07-28] Dashboard (index.html) — Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) an…
- **Reporter:** Cynthia Brown
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x7b0ad58fc04fffb74a28cdfe7781619e10801528
- **Frequency:** Intermittent
- **What happened:** Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To be able to upgrade to the next level
- **Submitted:** Tue, 28 Jul 2026 20:13:50 GMT
**RESOLVED 2026-07-29:** Self-cleared by rotation — now seated in T1.3 MatB and not parked. Separately, a real cause behind upgrade failures for members in this position WAS found and fixed: the dashboard implemented only two of `_upgradeEligible`'s three rules (TierRouter:862), so a member sitting in a FULL MatA with no completed cycle had their Upgrade button hidden even though the contract would have accepted it. Commit `ba2d775`.

### [2026-07-28] Other — I tried to view my position on each matrix on the Matrix pag…
- **Reporter:** @Koach100
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0xd4c441c795e86939fd19fc2ed05918bb75f1c905
- **Frequency:** Consistent
- **What happened:** I tried to view my position on each matrix on the Matrix page. The display banner above the Matrix was showing T1 Matrix B. I changed the View Tier banner to another tier the banner above the matrix did not change to show the new selection neither did the matrix.
- **What was expected:** If I select a tier on the View Tier banner the Matrix should reflect that choice.
- **Notes:** This is my experience with all my accounts.
- **Submitted:** Tue, 28 Jul 2026 18:32:39 GMT
**RESOLVED 2026-07-29:** Confirmed and fixed — changing the View Tier selector did not repaint the matrix beneath it.

### [2026-07-28] Dashboard (index.html) — This rescue is too large for a single transaction right now …
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x832b95a579478784fada54ad7b62c7963e21fefb
- **Frequency:** Consistent
- **What happened:** This rescue is too large for a single transaction right now (16.5M gas, network limit ~17.8M). Nothing was sent and nothing was charged. The auto-rescue keeper will re-enter you — please report this so we can look at your position.
- **What was expected:** The expectation was to self-rescue this account.
- **Submitted:** Tue, 28 Jul 2026 17:25:13 GMT
**RESOLVED 2026-07-29:** This report quotes our own bad message. Two fixes: (1) the gas estimate was clamped with `Math.min(est * 1.05, 16_500_000)`, which on a genuine 17.7M estimate sent 16.5M — the wallet then padded ITS estimate past the chain cap and the RPC refused. A clamp cannot make a transaction cheaper; it only discards the number that explains the problem. All three clamp sites now refuse above 15M and print the real figure (`503636e`). (2) The underlying cost was a five-link rotation cascade fed by blanket TierRouter approvals on keeper-seeded wallets; `onCrossToMatB` (:1136) auto-upgrades any crossing member whose allowance covers the next fee, and the contract's own comment calls that path "rare in practice". 423 standing approvals were revoked and the keeper now approves just-in-time — **cascade depth 5 → 2, gas ~19M → 11.8M**, and a member walked T1→T10 unaided to confirm. The permanent fix is V8.46-B's depth cap.

### [2026-07-28] Dashboard (index.html) — I tried several times to self rescue from T3.1 Matrix A but …
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0xd4c441c795e86939fd19fc2ed05918bb75f1c905
- **Frequency:** Consistent
- **What happened:** I tried several times to self rescue from T3.1 Matrix A but transaction failed.
- **What was expected:** I should have been able to cycle.
- **Notes:** Here is the message that popped up.                                                                                        Rescue would fail: F8V8: already in matrix
- **Submitted:** Tue, 28 Jul 2026 17:11:03 GMT
**RESOLVED 2026-07-29:** Duplicate seat in T3.1 — the member held both halves, so re-entry would seat them twice and the contract refused. Self-clears when the held seat cycles out; `unwedge.js` is on cron to clear any that reach a root, and V8.46's pair guard prevents formation. `dupe_watch.js` proved the source: 52 of 67 formations came from `coPayRescue`, 7 from `selfRescue` — the rescue path, not the upgrade path.

### [2026-07-28] Dashboard (index.html) — I tried upgrading to tier 2 but the transactions failed even…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0xd4c441c795e86939fd19fc2ed05918bb75f1c905
- **Frequency:** Consistent
- **What happened:** I tried upgrading to tier 2 but the transactions failed even after several hard refreshes. I also tried bulk upgrade but it didn't work.
- **What was expected:** I expected the upgrade to go through.
- **Notes:** Here's the message that came up.  
                                                                          
  ❌ T2 upgrade would fail: F8V8: already in matrix
- **Submitted:** Tue, 28 Jul 2026 10:11:09 GMT
**RESOLVED 2026-07-29:** Same duplicate seat as the T3.1 report above, surfacing on the upgrade path instead of the rescue path. Both are the one underlying cause; closing together.

### [2026-07-28] Other — My self rescue is $5.00 short fall and I'm assuming it's to …
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x50c8426e34c14859dcbf361f80e9b5d3412780e0
- **Frequency:** Intermittent
- **What happened:** My self rescue is $5.00 short fall and I'm assuming it's to cross to the next matrix in T1.. my account says that there is $6.50 in T1.. Is this $6.50 part of the reserved held or is the $6.50 plus the $5 in reserves... If this is the case why do I need to self rescue when there is funds to cover the crossing..
- **What was expected:** To cross over since there is funds to cover the crossing...
- **Notes:** Still trying to get the bigger picture...lol..
- **Submitted:** Tue, 28 Jul 2026 00:46:43 GMT
**RESOLVED 2026-07-29 — answered in full in the community post.** They are SEPARATE pots and they ADD. Crossing reserve is always exactly half the tier fee ($5.00 at T1, $2,500 at T9) and is funded by the original entry. Earnings in that matrix are the other contribution. Reserve + earnings, and whatever is still missing is the shortfall, payable **from the wallet right now** — no waiting. So $5.00 + $3.40 = $8.40 of a $10.00 re-entry, short $1.60; the $6.50 sits alongside the $5.00, not inside it. The amount varies between $0.60 and $41 because earnings vary. **This was the most useful question anyone has asked — it exposed that nothing on the site said the shortfall was payable immediately, and several members sat parked with more than enough in their wallets.**

### [2026-07-26] Dashboard (index.html) — The requested funds were approved to upgrade my main account…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x145805e87ce365ad6c2636b8f6e10b6550f3dc2a
- **Frequency:** Consistent
- **What happened:** The requested funds were approved to upgrade my main account, but did not appear in the account.
- **What was expected:** To be able to upgrade my account with the necessary funds.
- **Submitted:** Sun, 26 Jul 2026 12:46:14 GMT

_(new reports land here — untriaged; respond, then move to Pending)_
**RESOLVED 2026-07-29:** "Requested funds did not appear" was not a funds problem — the wallet held $8,194 throughout. It is the same withdrawal defect as the $500-of-$514 report: the site subtracted a flat $10 lock, quoted a figure the contract would not release, and the transaction reverted. Fixed in `dc8237b` by reading `freeWithdrawable()` from the contract. This wallet is now seated across all nine tiers it holds and healthy.

| Date Reported | Date Fixed | Page | Summary | Commit |
|---------------|------------|------|---------|--------|
| _V8.43 and earlier_ | 2026-07-25 | — | Full history through the V8.44 baseline reset — see `BUGS_PRE_V8_44_ARCHIVE.md` | V8.44 |

### Closed 2026-07-27 — crossing stall + V8.44 rescue wedge

### [2026-07-26] Other — Think I can safely say that this account and all downlines a…
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x7d3c94885d2022200934d4908bca7b47905bbcf6
- **Frequency:** Consistent
- **What happened:** Think I can safely say that this account and all downlines attached to this account haven't crossed even once and are stuck in T1.1 Matrix A... Now I'm seeing that I can upgrade to T5 and never had a self rescue on option to upgrade to T2...
- **What was expected:** More movement at tier 1..
- **Notes:** Seem like I have this issue of not crossing to other matrices from the last 2 upgraded versions... not sure if it's the wallet or bug...
- **Submitted:** Sun, 26 Jul 2026 18:19:50 GMT
- **RESOLVED 2026-07-27:** MatA rotation had stopped on every saturated pair. `TierRouter._sameTierTarget` and PairManagerV8's oldest-first scan both compare a CUMULATIVE lifetime counter against a threshold their comments describe as capacity, so a pair was excluded permanently once past it and its MatA lost all entry sources. Fixed live without a redeploy: pairExpansionThreshold 381->1000000 (8:25 PM EDT) and T1 route threshold + round-robin keeper (8:50 PM). T1.0 MatA verified climbing 254->263 at ~26 rotations/hr. Reporter was correct across three consecutive versions.

### [2026-07-26] Other — Account haven't crossed from T1.1 matrix A to B. Not even a …
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x001d82fb20dc3b947f7023f198eee009533538a3
- **Frequency:** Consistent
- **What happened:** Account haven't crossed from T1.1 matrix A to B. Not even a self rescue display.. Think the account has been stuck at this level for a while... now I'm seeing to approve for T5 and haven't even gotten to T2..
- **What was expected:** To see crossing and rotations which aren't happening...
- **Notes:** None of the other accounts has crossed as well
- **Submitted:** Sun, 26 Jul 2026 18:11:58 GMT
- **RESOLVED 2026-07-27:** MatA rotation had stopped on every saturated pair. `TierRouter._sameTierTarget` and PairManagerV8's oldest-first scan both compare a CUMULATIVE lifetime counter against a threshold their comments describe as capacity, so a pair was excluded permanently once past it and its MatA lost all entry sources. Fixed live without a redeploy: pairExpansionThreshold 381->1000000 (8:25 PM EDT) and T1 route threshold + round-robin keeper (8:50 PM). T1.0 MatA verified climbing 254->263 at ~26 rotations/hr. Reporter was correct across three consecutive versions.

### [2026-07-26] Dashboard (index.html) — Crossing seems to have slowed as I'm been in T1.1 for some t…
- **Reporter:** Sherwyn
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x1e8e2dcf876d0d94077c93a7e33bda2ab72ab1f7
- **Frequency:** Consistent
- **What happened:** Crossing seems to have slowed as I'm been in T1.1 for some time and have noticed that T1.3 is opened. and still haven't crossed as yet...
- **What was expected:** To have moved to matrix B..
- **Notes:** May be I'm not understanding the crossing and opening of new tiers fully...
- **Submitted:** Sun, 26 Jul 2026 13:21:13 GMT
- **RESOLVED 2026-07-27:** MatA rotation had stopped on every saturated pair. `TierRouter._sameTierTarget` and PairManagerV8's oldest-first scan both compare a CUMULATIVE lifetime counter against a threshold their comments describe as capacity, so a pair was excluded permanently once past it and its MatA lost all entry sources. Fixed live without a redeploy: pairExpansionThreshold 381->1000000 (8:25 PM EDT) and T1 route threshold + round-robin keeper (8:50 PM). T1.0 MatA verified climbing 254->263 at ~26 rotations/hr. Reporter was correct across three consecutive versions.

### [2026-07-26] Dashboard (index.html) — Just checking, it doesn't look like crossing over from one m…
- **Reporter:** Sherwyn
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x7d3c94885d2022200934d4908bca7b47905bbcf6
- **Frequency:** Consistent
- **What happened:** Just checking, it doesn't look like crossing over from one matrix to the other is working as ( for me), none of my 4 other accounts have crossed as yet and I've monitor it from since registering...
- **What was expected:** To have moved to matrix B by now...
- **Notes:** Not sure if it is that for the last 2 versions I did register late (after the 250 mark) but normally I'm within the first 100 - 150 and crossing is usually fast but these last few times it's been real long and nothing...
- **Submitted:** Sun, 26 Jul 2026 13:15:03 GMT
- **RESOLVED 2026-07-27:** MatA rotation had stopped on every saturated pair. `TierRouter._sameTierTarget` and PairManagerV8's oldest-first scan both compare a CUMULATIVE lifetime counter against a threshold their comments describe as capacity, so a pair was excluded permanently once past it and its MatA lost all entry sources. Fixed live without a redeploy: pairExpansionThreshold 381->1000000 (8:25 PM EDT) and T1 route threshold + round-robin keeper (8:50 PM). T1.0 MatA verified climbing 254->263 at ~26 rotations/hr. Reporter was correct across three consecutive versions.

### [2026-07-26] Dashboard (index.html) — Self-recue failure. Transaction failed on-chain — hard-refre…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x832b95a579478784fada54ad7b62c7963e21fefb
- **Frequency:** Consistent
- **What happened:** Self-recue failure. Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To rescue this account.
- **Submitted:** Sun, 26 Jul 2026 01:53:12 GMT
- **RESOLVED 2026-07-26:** V8.44 nested-entry BFS corruption wedged the matrix (phantom seat 128, occupancy drift +44, position 1 emptied -> `F8V8: no root`). Self-rescue reverted for every affected member. Fixed by the V8.45 emergency redeploy at ~02:45 UTC; regression covered by `V8_45_NestedEntry.test.js` (N1/N2).

### [2026-07-26] Dashboard (index.html) — Haven't crossed over from T1 .1 Matrix A to B as yet, not ev…
- **Reporter:** Sherwyn
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x7d3c94885d2022200934d4908bca7b47905bbcf6
- **Frequency:** Consistent
- **What happened:** Haven't crossed over from T1 .1 Matrix A to B as yet, not even once and neither has my other accounts as well. Seems like they have stuck and have been in this position from since registrations were at 398 or so.
- **What was expected:** To have at least moved to matrix B and rotated..
- **Notes:** Never saw any of the other versions take this long to move through the matrix.
- **Submitted:** Sun, 26 Jul 2026 01:35:36 GMT
- **RESOLVED 2026-07-27:** MatA rotation had stopped on every saturated pair. `TierRouter._sameTierTarget` and PairManagerV8's oldest-first scan both compare a CUMULATIVE lifetime counter against a threshold their comments describe as capacity, so a pair was excluded permanently once past it and its MatA lost all entry sources. Fixed live without a redeploy: pairExpansionThreshold 381->1000000 (8:25 PM EDT) and T1 route threshold + round-robin keeper (8:50 PM). T1.0 MatA verified climbing 254->263 at ~26 rotations/hr. Reporter was correct across three consecutive versions.

### [2026-07-26] Dashboard (index.html) — i am not able to self rescue.
there is usdc and eth in walle…
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x9e0413a671f48da6317473e81eb089136e9f1273
- **Frequency:** Consistent
- **What happened:** i am not able to self rescue.
there is usdc and eth in wallet.
usdc is approved but when self rescue is clicked it says hard refresh and try again. it is happening on all wslleys beside the main.
Also not able to refresh so restarted phone but same result.
- **What was expected:** to be able to self rescue on all although i dont want to upgrade except on main account.
- **Submitted:** Sun, 26 Jul 2026 00:34:57 GMT
- **RESOLVED 2026-07-26:** V8.44 nested-entry BFS corruption wedged the matrix (phantom seat 128, occupancy drift +44, position 1 emptied -> `F8V8: no root`). Self-rescue reverted for every affected member. Fixed by the V8.45 emergency redeploy at ~02:45 UTC; regression covered by `V8_45_NestedEntry.test.js` (N1/N2).

### [2026-07-25] Dashboard (index.html) — Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) an…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x185b19c7d3872692981568985b21ae6f7f6be2a4
- **Frequency:** Consistent
- **What happened:** Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To self-rescue this account.
- **Submitted:** Sat, 25 Jul 2026 23:59:47 GMT
- **RESOLVED 2026-07-26:** V8.44 nested-entry BFS corruption wedged the matrix (phantom seat 128, occupancy drift +44, position 1 emptied -> `F8V8: no root`). Self-rescue reverted for every affected member. Fixed by the V8.45 emergency redeploy at ~02:45 UTC; regression covered by `V8_45_NestedEntry.test.js` (N1/N2).

### [2026-07-25] Dashboard (index.html) — The self-rescue fails.
 Transaction failed on-chain — hard-r…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x145805e87ce365ad6c2636b8f6e10b6550f3dc2a
- **Frequency:** Consistent
- **What happened:** The self-rescue fails.
 Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** Re-entry for this account.
- **Submitted:** Sat, 25 Jul 2026 23:54:45 GMT
- **RESOLVED 2026-07-26:** V8.44 nested-entry BFS corruption wedged the matrix (phantom seat 128, occupancy drift +44, position 1 emptied -> `F8V8: no root`). Self-rescue reverted for every affected member. Fixed by the V8.45 emergency redeploy at ~02:45 UTC; regression covered by `V8_45_NestedEntry.test.js` (N1/N2).

