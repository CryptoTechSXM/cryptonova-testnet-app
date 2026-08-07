# BUGS.md — member bug reports

> **HOW THIS FILE IS READ — READ THIS BEFORE REARRANGING ANYTHING.**
>
> `api/get-reports.js`, rendered by `reports.html`, does **not** understand the
> section headings in this file. It does exactly two things:
>
> 1. It splits the file on the Resolved-Issues heading. **Everything above that
>    heading is counted as OPEN** — one ticket per `### [YYYY-MM-DD] …` heading,
>    regardless of which sub-heading it sits under.
> 2. **Only pipe-table rows below that heading count as RESOLVED**, and only when
>    they have 5+ cells: Date Reported / Date Fixed / Page / Summary / Commit.
>    A `###` write-up placed below it is invisible to the page — by design.
>
> Learned the hard way on 2026-07-29. Sub-sections such as "Pending — Responded"
> and "Fix In Progress" were sitting ABOVE the Resolved heading, so they were
> published to the world as open member tickets; and 33 detailed resolution
> write-ups were sitting below it, so they counted for nothing. The page read
> **29 open / 1 resolved** while this file appeared to say 0 open and 33 resolved.
>
> **Rules**
>
> - Genuinely open member reports go under the Open-Issues heading below.
> - Anything closed gets a TABLE ROW under the Resolved heading. The row is the
>   ledger; the prose write-up is only for us.
> - Engineering work (V8.46 items) and mainnet design questions live BELOW the
>   Resolved heading so they can never masquerade as member tickets. They are
>   tracked properly in `V8_46_PLAN.md`.
> - `api/submit-bug.js` inserts new reports at the Open-Issues heading and takes
>   the FIRST match, so that heading must stay unique, unrenamed, and first.
>
> **Do not quote either heading name verbatim in this note.** Writing the literal
> text would make this documentation itself the first match — the split would
> happen here, and `submit-bug.js` would file live member reports inside the
> instructions. That is not hypothetical: it happened twice while this note was
> being written.

## Open Issues

### [2026-08-05] Other — Withdrew all my CNova tokens but was testing the unlock butt…
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x1e8e2dcf876d0d94077c93a7e33bda2ab72ab1f7
- **Frequency:** Consistent
- **What happened:** Withdrew all my CNova tokens but was testing the unlock button after I withdrew and got the error of fail on chain error and hard reset...
- **What was expected:** A message that states that all CNova tokens had already been withdrawn or no CNova token found or some thing to that effect and not a fail error message...
- **Notes:** May be a rewording of the message so it doesn't look like a system failure ...
- **Submitted:** Wed, 05 Aug 2026 02:14:00 GMT


### [2026-08-05] Dashboard (index.html) — In prep to withdraw my earnings , i checked the balance on t…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0xd4c441c795e86939fd19fc2ed05918bb75f1c905
- **Frequency:** Intermittent
- **What happened:** In prep to withdraw my earnings , i checked the balance on the dashboard. In the available for withdrawal  section it $287.83. When clicked withdraw all the amount that populated the space was $152.23
The amount deposited into my wallet was $302.63 the withdrawn amount on the dashboard was a few dollars more.
- **What was expected:** I expect for their to be less disparity in the numbers.
- **Submitted:** Wed, 05 Aug 2026 01:23:20 GMT


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
- **PARTIAL 2026-07-30 — and the tool could not answer the question.** `member_ledger.js` on `0x1ca3316E` shows **T3.1 MatA and MatB both `left`**, so she passed through T3 and out; `memberHighestTier` is now T10. That is consistent with T3 having cycled. But her report was specifically about the *cycle count* reading 0, and `member_ledger` prints state and balances — **not `cyclesCompleted`** — so it cannot see the field the question is about. Adding that column is the next step; guessing from state would be exactly the kind of plausible-but-unverified answer that wasted two hours tonight. **Also flagged: this ticket sat from 2026-07-27 to 2026-07-30 without a reply. That is on us, not the reporter.**

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


## Resolved Issues

| Date Reported | Date Fixed | Page | Summary | Commit |
|---|---|---|---|---|
| 2026-08-07 | 2026-08-07 | Other | With all check boxes disabled, breakdown 'available to claim' differed from the Withdrawal section — fixed — card, MAX and breakdown unified on a withdrawCore mirror (_claimableAll); root-caused double reserve subtraction + stale freeWithdrawable view (contract fix logged V8_48_BACKLOG) · Sherwyn · bounty +1 | 427beb5 |
| 2026-08-06 | 2026-08-06 | Other | "Incorrect amount displayed" - Just upgraded to T2 and notic — fixed — reserve breakdown now reads the real next-tier fee · Sherwyn | 66ecdff |
| 2026-08-06 | 2026-08-06 | Dashboard (index.html) | 1. Dash Board Page Incorrect information — fixed — next-tier fee + staggered post-action refresh (upgrade/rescue no longer hang) · Kira | 66ecdff |
| 2026-08-05 | 2026-08-06 | Comp Plan (compensation.html) | Have one level 2 person already signed up and commissions no — by design — Chain Pay L2-L6 follows MATRIX seat ancestors, not the referral tree; explainer posted 2026-08-06 · Sherwyn | working-as-designed |
| 2026-08-05 | 2026-08-06 | Other | When disabling the auto reentry, upgrade or double re entry — fixed — all toggle painting via pin-aware painter; one click, one tx · Sherwyn | pinned-paint |
| 2026-08-04 | 2026-08-06 | Other | Still not in matrix, hard refresh didn't bring up any prompt — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · Sherwyn | reset-v8.47 |
| 2026-08-03 | 2026-08-06 | Other | Active position doesn't show a number and under my position — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · Sherwyn | reset-v8.47 |
| 2026-08-03 | 2026-08-06 | Dashboard (index.html) | I disabled auto upgrade and my income lessened by about $200 — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · @Koach100 | reset-v8.47 |
| 2026-08-03 | 2026-08-06 | Dashboard (index.html) | this morning all of my 8 accounts are saying no active posit — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · CryptoJan22 | reset-v8.47 |
| 2026-08-03 | 2026-08-06 | Dashboard (index.html) | I have upgraded this account to tier 5. It's showing tiers t — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · @Koach100 | reset-v8.47 |
| 2026-08-03 | 2026-08-06 | Dashboard (index.html) | After a refresh, the CNova Balance is not showing.... 000 Ba — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · @Lavern_Gay | reset-v8.47 |
| 2026-08-02 | 2026-08-06 | Dashboard (index.html) | I'm currently upgraded to tier 3. i have all three automatio — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · @Koach100 | reset-v8.47 |
| 2026-08-02 | 2026-08-06 | Other | Every Refresh of the system gives me different info for the — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · Sherwyn | reset-v8.47 |
| 2026-08-02 | 2026-08-06 | Dashboard (index.html) | i am still not able to refresh my accounts — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · CryptoJan22 | reset-v8.47 |
| 2026-08-02 | 2026-08-06 | Onboarding / Registration | I keep getting and error when I tap on the 'approve $10' tab — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · E2theb | reset-v8.47 |
| 2026-08-01 | 2026-08-06 | Dashboard (index.html) | I was graduated from tier 1 even though I have auto re-entry — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · @Koach100 | reset-v8.47 |
| 2026-07-31 | 2026-08-06 | Other | ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · Jacob Banji-Ajala | reset-v8.47 |
| 2026-07-31 | 2026-08-06 | Dashboard (index.html) | i am not able to refresh on any of my accounts.I have to res — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · CryptoJan22 | reset-v8.47 |
| 2026-07-30 | 2026-08-06 | Other | When I trying to register an account: — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · Anthony L | reset-v8.47 |
| 2026-07-29 | 2026-08-06 | Auto-upgrade | fails despite sufficient earnings (community call) — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · Community call (owner relay) — June's account cited | reset-v8.47 |
| 2026-07-29 | 2026-08-06 | Cycle-out | accounts with several tiers enabled graduate incorrectly; others cycle — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · Community call (owner relay) | reset-v8.47 |
| 2026-07-29 | 2026-08-06 | Double re-entry blocks graduation entirely (community call) | Double re-entry blocks graduation entirely (community call) — V8.47 fresh redeploy: positions/state reset; underlying causes addressed in V8.46/V8.47; re-report if it recurs on V8.47 · Community call (owner relay) | reset-v8.47 |
| 2026-08-03 | 2026-08-04 | Other | Matrix tree view not loading — seat reads batched via Multicall3 + retry, no more dropped/empty · @Koach100 | multicall3 |
| 2026-08-03 | 2026-08-04 | Other | Refresh showed one tier at a time — dashboard now reads one consistent snapshot · sherwyn | 8bd752e |
| 2026-08-03 | 2026-08-04 | Dashboard (index.html) | Self-rescue 'not enough' with funded wallet — by design: reserve+earnings then wallet shortfall (needs Approve first); dashboard names the exact shortfall · Barbara | working-as-designed |
| 2026-07-30 | 2026-08-04 | Buy CNOVA (buy.html) | Upgrade T1->T2 'too large for the network' — V8.46 cascade-depth cap · @Koach100 | V8.46 |
| 2026-07-30 | 2026-08-04 | Dashboard (index.html) | 'Upgrade too large / gas limit too high' (4 consolidated) — V8.46 cascade-depth cap · Maximum_71 | V8.46 |
| 2026-07-30 | 2026-08-04 | Dashboard (index.html) | T10 reserve $20k / no withdrawable — by design: re-entry $10k + double $10k · CryptoJan22 | working-as-designed |
| 2026-07-29 | 2026-08-04 | Dashboard (index.html) | Rescue loan couldn't repay after leaving a matrix — V8.46 item 7 settles on withdraw (verified on-chain) · Sherwyn/owner | V8.46 |
| 2026-07-29 | 2026-08-04 | Contract — MatrixLogicLib | FUND LOSS: balance overwrite on re-entry — V8.46 item 8 (verified live) · owner | V8.46 |
| 2026-07-30 | 2026-07-30 | Dashboard (index.html) | T4.1 re-entry BLOCKED at T10 — working as designed: holds both halves, clears on cycle-out, nothing owed · Maximum_71 | working-as-designed |
| 2026-07-30 | 2026-07-30 | Other | T4.1 re-entry BLOCKED at T10 — working as designed: holds both halves, clears on cycle-out, nothing owed · bugbounty | working-as-designed |
| 2026-07-29 | 2026-07-30 | Dashboard (index.html) | Auto-upgrade appeared to need funds in the destination tier - working as designed, wording owed · Community call | `member_ledger` |
| 2026-07-25 | 2026-07-26 | Dashboard (index.html) | Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) an · @Lavern_Gay | — |
| 2026-07-25 | 2026-07-26 | Dashboard (index.html) | The self-rescue fails. · @Lavern_Gay | — |
| 2026-07-26 | 2026-07-29 | Dashboard (index.html) | I manually entered my account 2 and placed it under account · @queensonnie | `a873e8d` |
| 2026-07-26 | 2026-07-29 | Dashboard (index.html) | All day today on a more than ususl occurrence my accounts h · CryptoJan22 | `d71254a` |
| 2026-07-26 | 2026-07-29 | Dashboard (index.html) | Auto Self-rescue failed. · @Lavern_Gay | — |
| 2026-07-26 | 2026-07-29 | Dashboard (index.html) | Self=rescue failed. Transaction failed on-chain — hard-refre · @Lavern_Gay | — |
| 2026-07-26 | 2026-07-29 | Dashboard (index.html) | The requested funds were approved to upgrade my main account · @Lavern_Gay | `dc8237b` |
| 2026-07-26 | 2026-07-27 | Other | Think I can safely say that this account and all downlines a · Sherwyn | `1000000` |
| 2026-07-26 | 2026-07-27 | Other | Account haven't crossed from T1.1 matrix A to B. Not even a · Sherwyn | `1000000` |
| 2026-07-26 | 2026-07-27 | Dashboard (index.html) | Crossing seems to have slowed as I'm been in T1.1 for some t · Sherwyn | `1000000` |
| 2026-07-26 | 2026-07-27 | Dashboard (index.html) | Just checking, it doesn't look like crossing over from one m · Sherwyn | `1000000` |
| 2026-07-26 | 2026-07-26 | Dashboard (index.html) | Self-recue failure. Transaction failed on-chain — hard-refre · @Lavern_Gay | — |
| 2026-07-26 | 2026-07-27 | Dashboard (index.html) | Haven't crossed over from T1 .1 Matrix A to B as yet, not ev · Sherwyn | `1000000` |
| 2026-07-26 | 2026-07-26 | Dashboard (index.html) | i am not able to self rescue. · CryptoJan22 | — |
| 2026-07-26 | 2026-07-29 | Dashboard (index.html) | T5 upgrade check failed — try again in a moment (RPC may be · @Lavern_Gay | `7b3c327` |
| 2026-07-26 | 2026-07-29 | Dashboard (index.html) | Could not upgrade bulk tiers. · @Lavern_Gay | `7b3c327` |
| 2026-07-26 | 2026-07-29 | Dashboard (index.html) | System not upgrading bulk tiers. · @Lavern_Gay | `7b3c327` |
| 2026-07-26 | 2026-07-29 | Bug Report Page | Back to dash board after submitting report takes you to home · Sherwyn | — |
| 2026-07-27 | 2026-07-27 | Other | ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) · Sherwyn | `c7916c8` |
| 2026-07-27 | 2026-07-27 | Dashboard (index.html) | Incomplete information. withdrawable card shows 1507.xx whil · Kira | `81a5793` |
| 2026-07-27 | 2026-07-27 | Dashboard (index.html) | I am parked and but continue collected from directs, eventua · Kira | `38605d7` |
| 2026-07-27 | 2026-07-29 | Other | Enough funds in wallet to re-enter and upgrade hence I'm get · Sherwyn | `38605d7` |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | cant self rescue. it says already in matrix. · CryptoJan22 | `d71254a` |
| 2026-07-28 | 2026-07-29 | Other | Rescue would fail: F8V8: already in matrix · Maximum - 71 | `d71254a` |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | Rescue would fail: ❌ Transaction failed on-chain — hard-refr · Cynthia Brown | — |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | I tried to self rescue from T2.1 Matrix A and it kept failin · @Koach100 | `d71254a` |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) · Maximum_71 | — |
| 2026-07-28 | 2026-07-29 | Other | Rescue would fail: ❌ Transaction failed on-chain — hard-refr · Sherwyn | — |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | cant self rescue. it says already in matrix. · CryptoJan22 | — |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) an · Cynthia Brown | `ba2d775` |
| 2026-07-28 | 2026-07-29 | Other | I tried to view my position on each matrix on the Matrix pag · @Koach100 | — |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | This rescue is too large for a single transaction right now · @Lavern_Gay | `503636e` |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | I tried several times to self rescue from T3.1 Matrix A but · @Koach100 | — |
| 2026-07-28 | 2026-07-29 | Dashboard (index.html) | I tried upgrading to tier 2 but the transactions failed even · @Koach100 | — |
| 2026-07-28 | 2026-07-29 | Other | My self rescue is $5.00 short fall and I'm assuming it's to · Sherwyn | — |
| 2026-07-29 | 2026-07-29 | Other | ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) · Sherwyn | `2337401` |
| 2026-07-29 | 2026-07-29 | Dashboard (index.html) | the self rescue button took some time but it eventually came · CryptoJan22 | `5a6dd64` |
| 2026-07-29 | 2026-07-29 | Dashboard (index.html) | i have 2 self rescues . · CryptoJan22 | `d71254a` |
| 2026-07-29 | 2026-07-29 | Other | I had four directs for this account, but it shows one direct · @Lavern_Gay | `a873e8d` |
| 2026-07-29 | 2026-07-29 | Other | Withdrawing $500 from $514 available.. ❌ Transaction failed · Sherwyn | `dc8237b` |
| 2026-07-29 | 2026-07-29 | Total Withdrawn under-reported | matrices counted by balance instead of history · Owner, mid-call | `ce6c734` |
| _V8.43 and earlier_ | 2026-07-25 | — | Full history through the V8.44 baseline reset — see `BUGS_PRE_V8_44_ARCHIVE.md` | V8.44 |

---

### Detail — resolved report write-ups

Moved to `archive/BUGS_RESOLVED_DETAIL.md` on 2026-07-30. The summary table above stays current; full per-report write-ups live there.
