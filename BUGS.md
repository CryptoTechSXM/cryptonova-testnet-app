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






### [2026-08-08] Dashboard (index.html) — The self rescue transaction is taking an extremely long time…
- **Reporter:** @ronnienic197
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x75784fe21f201f8b1f909cf9b055ef5e19fb7385
- **Frequency:** Consistent
- **What happened:** The self rescue transaction is taking an extremely long time to complete
Takes  forever for USDC approval and theneven more time spent trying to complete self rescue.
- **What was expected:** Should be a seamless process but this process is taking up a lot of time. 
May not be a bug but could this just be my mm. Is anyone else having this issue?
- **Submitted:** Sat, 08 Aug 2026 10:42:44 GMT



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

## Resolved Issues

| Date Reported | Date Fixed | Page | Summary | Commit |
|---|---|---|---|---|
| 2026-08-22 | 2026-09-05 | Dashboard (index.html) | @bevmawire — Dashboard (index.html) — WAS IN THE PROCESS OF DOING A SECOND "RESCUE" and all o | FIXED: frontend cbeedfd (2026-08-29, F2, from this report) - a refresh whose registration read fails now HOLDS the last good dashboard with a Showing-your-last-known-figures banner and a Retry button; the Could-not-load-your-status card appears only when nothing has ever loaded. Plus af94619 (2026-08-24): the 30s poll no longer re-renders while a rescue signature is open. Live on all three domains (605d884). |
| 2026-08-10 | 2026-09-05 | Dashboard (index.html) | Deborah — Dashboard (index.html) — Tried withdrawing and it failed, $50 - **Reporter:** De | CLOSED ON EVIDENCE (BaseScan, wallet 0x0ddb6a96): two withdrawPartial txs to V8.47 T4 MatA reverted 2026-08-10 23:14Z and 23:16Z (8.03 and 8.17 USDC, blocks 45317696 / 45317749) - the 50 was the dashboard total across 13 matrices, and the withdraw loop of that day had no per-matrix try/catch and a hardcoded 200k gas, so one reverting matrix reported the whole run as failed after other matrices had paid. FIXED bc96ea2 (2026-08-11, from this report): per-matrix handling, gas estimate, receipt of what ARRIVED, withdrawal history. Live on all three domains. |
| 2026-08-13 | 2026-09-05 | Other | Sherwyn — Other — Withdraw all triggers the contract but no reaction in wallet… - **Report | FIXED: frontend 41aaa2e (2026-08-12, from this report) - the withdraw-all pre-check no longer hangs or fabricates nothing-to-withdraw; a failing gas estimate shows its reason instead of silence, and unverified balances are reported as unverified, never as zero. Live on all three domains. |
| 2026-08-05 | 2026-09-05 | Other | Sherwyn — Other — Withdrew all my CNova tokens but was testing the unlock butt… - **Report | FIXED: frontend 6f71565 (2026-08-06) - unlock says nothing is left to unlock instead of the raw revert; 605d884 (2026-09-05) - a FAILED balance read no longer claims there is nothing to unlock, it says the read failed and nothing was sent. Live on all three domains. |
| 2026-07-29 | 2026-09-05 | Dashboard (index.html) | CryptoJan22 (via the second of two reports today) — Rescue panel vanishes silently when a rescue completes - **Reporter:** CryptoJan | FIXED frontend 4cd678f (2026-09-05, all three domains): when the dashboard has seen the member parked and the next chain read shows them seated, a green Rescue complete card names the seat instead of the orange panel vanishing; shown once per rescue, never to a member who was never parked, never on a failed read. The approval-to-button lag was already fixed: the button enables on the approval receipt. |
| 2026-08-29 | 2026-09-05 | Other | Sherwyn — Other — Forgot to add - it looks like everytime I do the continuous … - **Report | CLOSED ON EVIDENCE: member_history.js (V8.50 book) shows six MemberCrossedToPartner then MemberParked shortfall 0 in the same tx = MatrixLogicLib:529 no-seat park in a pair full in both halves (T1.1 127/127 A and B). Reproduced line for line in fixture C5/G0b; noseat_witness 105/105 on chain. Cured by item G graduation + item S overflow, live on V8.51/V8.52; 2026-09-05 T1 window NO-SEAT 0. Reply sent 2026-08-30. |
| 2026-08-29 | 2026-09-05 | Other | Sherwyn — Other — Continuous self rescue loop - each time I approve and self r… - **Report | CLOSED ON EVIDENCE: member_history.js (V8.50 book) shows six MemberCrossedToPartner then MemberParked shortfall 0 in the same tx = MatrixLogicLib:529 no-seat park in a pair full in both halves (T1.1 127/127 A and B). Reproduced line for line in fixture C5/G0b; noseat_witness 105/105 on chain. Cured by item G graduation + item S overflow, live on V8.51/V8.52; 2026-09-05 T1 window NO-SEAT 0. Reply sent 2026-08-30. |
| 2026-07-26 | 2026-09-05 | Onboarding / Registration | Kira — Onboarding / Registration — The upgrade option is not visibly working. I an bot  | BY DESIGN (owner 2026-09-05): the Registration page is for joining only; upgrades, rescues and earnings live on the Dashboard. The already-registered banner now says so explicitly and links there (29bc6c3, live on main) |
| 2026-08-11 | 2026-09-05 | Dashboard (index.html) | CryptoJan22 — Dashboard (index.html) — decided to do a withdrawal. It took forever and after c | wallet 0x7947...7532 never registered on the current V8.52 chain (diag_withdraw: no position with any credit) - not reproducible; the 50 pct shape matches the MatA crossing reserve that must stay in the matrix, unmeasured for this wallet; reopen if it recurs on the current chain |
| 2026-08-10 | 2026-09-05 | Dashboard (index.html) | CryptoJan22 — Dashboard (index.html) — this account has 5 directs. i stsrted with only auto re | wallet 0x7947...7532 never registered on the current V8.52 chain (diag_referrer: NOT REGISTERED, no positions, no events) - not reproducible; cycles are driven by matrix fill, not direct count; reopen if it recurs on the current chain |
| 2026-09-03 | 2026-09-05 | Dashboard (index.html) | CryptoJan22 — Dashboard (index.html) — Matrix does not seem to be moving. Looks like nothing i | diag_member_positions on the V8.51 book: wallet 0x7d9c...9635 was seated in T1.2 MatA with 0 cycles - the later-pair FREEZE (REGRESSION_REGISTER R1); cured by V8.52 (_fullPairWaitingLongest, contracts 1507c28), community chain 2026-09-04; on V8.52 T1.2 received circulation and rotated on 09-05; member is registered on V8.52 |
| 2026-08-05 | 2026-09-05 | Dashboard (index.html) | @Koach100 — Dashboard (index.html) — In prep to withdraw my earnings , i checked the balance | receipt 302.63 vs Total Withdrawn 307.24 = the 1.5 pct health fee, measured (withdrawCore counts gross, transfers net); fee now labelled on the card (0c0dbe1, owner-verified); the card-vs-MAX gap did not reproduce on two full sweeps (241 and 376 members) |
| 2026-08-18 | 2026-09-05 | Dashboard (index.html) | Maximum_71 — Dashboard (index.html) — The RPC node didn't respond after several retries — thi | the quoted text is the deliberate honest read-failed panel (index.html:1246); the failed read now retries instead of giving up (F3, 9a33b90, live on main) |
| 2026-08-27 | 2026-09-05 | Onboarding / Registration | @Lavern_Gay — Onboarding / Registration — REOPENED: could not change the referrer address - ** | diag_referrer on V8.52: 0x1458...dC2a registered T1 (id 44) under sponsor 0x1498...1040, not the default and not her own main; fix 98a0da2 live - REOPEN if a NEW account under another link still shows her main address |
| 2026-08-27 | 2026-09-05 | Onboarding / Registration | @ThanksAndPraises — Onboarding / Registration — All CryptoNover accounts opened with different refer | diag_referrer on V8.52: 0x3c17...bbdd registered T2 (id 138) under sponsor 0x1498...1040, NOT the default, dashboard source agrees with the registration record; per-wallet sponsor cache fix 98a0da2 live |
| 2026-09-01 | 2026-09-05 | Onboarding / Registration | CryptoJan22 — Onboarding / Registration — It says transaction failed on chain. I restarted my  | wallet 0xec5f...03eb is registered on V8.52 (T1, id 68, sponsor 0x7d9C...) - registration works for this wallet on the current chain; same class as the 09-01 RPC failures |
| 2026-09-01 | 2026-09-05 | Onboarding / Registration | CryptoJan22 — Onboarding / Registration — Getting an error when registering - **Reporter:** Cr | wallet 0xc63a...4998 is registered on V8.52 (T1, id 67, sponsor 0x7d9C...) - registration works for this wallet on the current chain; 09-01 failure was on the retired V8.51 chain via an RPC the wallet supplied |
| 2026-09-05 | 2026-09-05 | Dashboard (index.html) | Kira — Dashboard (index.html) — Just noticed i have a reserve of 10$ but copay says 2$  | first cycle-out parks by design (reentryMinCycles=2); USD 8 earned + USD 0 reserve vs USD 10 re-entry = USD 2 shortfall, selfRescue simulated OK; Reserve-target badge was read as a balance - reworded 6098934; member re-entered |
| 2026-07-26 | 2026-08-28 | Other | Kira — Other — on the tiers page the information is a bit ambiguous. - **Reporter:** Ki | display fixed - T1 pair sizing remains an open product decision |
| 2026-08-08 | 2026-08-28 | Dashboard (index.html) | CryptoJan22 — Dashboard (index.html) — i got 2 self rescue alerts at the same time. t 1 cleare | fixed - approval now sized to entry fee, shortfall no longer goes stale |
| 2026-08-17 | 2026-08-28 | Bug Report Page | Jacob — Bug Report Page — Fail to create "[From https://sepolia.base.org] gas limit to…  | fixed - bug report page sends no on-chain transaction |
| 2026-08-26 | 2026-08-26 | Dashboard (index.html) | CryptoJan — parked, no approve button, "still a shortfall" on click, intermittent. ROOT CAUSE: both ready-gates tested `allowance >= SHORTFALL`, but the shortfall MOVES while parked, so an allowance that covered it at render failed at click — the measured 0xa0763F34 case (08-24 diag: $11.88 vs $12.50) happening to a live member. Both gates now compare against `max(fee, shortfall)`, the contract's actual pull ceiling, so READY can never go stale. Shipped with the V8.50 cutover; his position reset at noon regardless. Reporter added to fund_list (wallet #111). | `1b0ed5f` |
| 2026-08-26 | 2026-08-26 | Other | Sherwyn — "tokens are being redeemed but not reflecting in wallet". CLOSED BY MEASUREMENT (`scripts/diag_sherwyn_redeem.js`, read-only, refuses non-v8_48 addresses): BOTH redeems succeeded AND paid — $6.571675 (08-25, tx 0xab637c8d…) and $0.566131 (08-26, tx 0xcf03f2b7…). The 45% early-exit penalty (joined <30d) withheld $5.84 of $12.98 gross, and a sub-$7 bump on a wallet holding $30,065 USDC is easy to miss. NOT A BUG — penalty disclosure did its job on-chain; closed on the old chain the morning of the V8.50 cutover. | (diagnosis only — no code change) |
| 2026-08-21 | 2026-08-26 | Other | Sherwyn — redeem "step 2 fail asking to do a hard reset". Same wallet and path as his 2026-08-26 ticket; superseded by it and closed by the same measurement — the redeems that mattered went through and paid. Old-chain (V8.48) report; the redeem path it exercised retired with that chain at the cutover. | (diagnosis only — no code change) |
| 2026-08-24 | 2026-08-24 | Dashboard (index.html) | @Koach100 — approved USDC, then the Self Rescue button never appeared ("this also happened with another account"). ROOT CAUSE: `approveSelfRescue` granted the EXACT shortfall, and the button visibility test is `allowance < shortfall`. The shortfall moves while a member is parked because earnings keep landing, so a single cent of drift flipped that test back to true on the next 30-second poll and re-dimmed the Self Rescue button to opacity 0.5 — invisible on a dark phone screen. This is the SAME symptom recorded in the 2026-07-29 in-code note, which was treated as fixed then; the exact-amount approval is what kept re-triggering it. Now approves the full `ENTRY_FEE`, which is the maximum `_selfRescue` can ever pull (`shortfall = entryFee - effectiveContrib`, floored at 0), so the approval cannot go stale. Only the actual shortfall is ever taken. | `ca66731` |
| 2026-08-21 | 2026-08-24 | Other | Sherwyn — "Approving of self rescue fail.. On Chain error message display... On all my accounts." Same root cause as the 2026-08-24 ticket: an exact-shortfall approval that no longer covered what `safeTransferFrom` pulled, so the rescue reverted on allowance. CONFIRMED INDEPENDENTLY ON-CHAIN 2026-08-24 by `scripts/diag_parked_solvency.js`: of 41 past-grace parked positions, exactly ONE held any allowance at all — $11.88 standing against a $12.50 shortfall, i.e. a member who followed the instructions and was left $0.62 short. | `ca66731` |
| 2026-08-21 | 2026-08-24 | Bug Report Page | Sherwyn — withdrew his own report nine minutes after filing it ("self rescue was approved.. All accounts were able to self rescue now... so cancelled last report"). WITHDRAWN BY THE REPORTER BUT THE BUG WAS REAL. Intermittent success is exactly what a drifting shortfall produces — sometimes the exact-amount approval still covers it, sometimes it does not — and the same defect recurred for @Koach100 three days later. Closed by the fix rather than as invalid, and the bounty stands. | `ca66731` |
| 2026-08-20 | 2026-08-20 | Dashboard (index.html) | CryptoTech (owner) — deliberate test of the screenshot-upload path added in `74a1588`. The upload succeeded and the screenshot attached, so the feature works. Not a defect; closed as a test submission. The note carried on it ("we may need to change this info with v8.50") belongs to the V8.50 scope, not to this file. | `74a1588` |
| 2026-08-19 | 2026-08-24 | Dashboard (index.html) | @bevmawire — TWO issues in one ticket. (a) The bug-report form did not expose "Steps to reproduce / screenshot filename / error message" and offered no screenshot upload: FIXED in `74a1588`, and confirmed by this same reporter successfully attaching a screenshot to their 2026-08-22 ticket. (b) "Couldn't find your status" blocking dashboard access: NOT FIXED and deliberately NOT closed here — it remains open under the 2026-08-22 ticket, which carries the screenshot. This row closes (a) only. | `74a1588` |
| 2026-08-11 | 2026-08-24 | Dashboard (index.html) | @Lavern-Gay — "had to click both Approval and Self-Rescue several times, even though the transaction was marked as complete." Same root cause as the 2026-08-24 ticket, and the EARLIEST report of it — thirteen days and three reporters before it was diagnosed. Previously treated as retired by the V8.48 permit path (one signature, no separate approve step), but @Koach100 was still prompted to approve on 2026-08-24, which is evidence the permit probe is not succeeding on this deployment. That retirement was an assumption and is now recorded as UNVERIFIED; the report is closed by the approval fix instead. | `ca66731` |
| 2026-08-08 | 2026-08-08 | Other | Two accounts, 6 cycles vs 1 — NOT A BUG. Cycling is by SEAT, not tier traffic: _cycleOutRoot cycles position 1 and each rotation advances everyone one seat. Both wallets sit in T1.1 but different halves — MatB had 1,786 rotations vs MatA 315. MatB is draining a parked-member backlog (115/115 of its entrants had cycled out of MatA earlier, 111 previously parked, median lag 37.6h), so it runs ~24x faster. Verified with scripts/diag_cycle_rate.js + diag_matb_inflow.js + diag_matb_source.js. | (diagnosis only — no code change) |
| 2026-08-08 | 2026-08-08 | Other | Main account "stuck" in slow T1 while T2 cycles faster — NOT A BUG, same cause. Seat 12 of 127 in T1.1 MatA, which rotates at real registration throughput (~1 per 33 min) rather than backlog-drain speed; ~11 rotations from cycling. T2 appears faster because it has fewer matrices, so upgrade traffic concentrates. | (diagnosis only — no code change) |
| 2026-08-07 | 2026-08-08 | Dashboard (upgrade) | Generic red-X on tier upgrade — V8.47 gate pulls fee + outstanding rescue loan from the wallet, UI approved/checked fee only; approve/checks now fee+debt with loan-aware copy, ERC20 errors decode — verified live on two debted wallets (loan settled via upgrade, banner cleared) · Jacob · bounty +1 (first find) | 50c59b1 |
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

