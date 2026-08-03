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

### [2026-08-03] Other — The matrix tree view is not loading.
- **Reporter:** @Koach100
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x2444f367f023872804d99d6f5dae906d19d5977f
- **Frequency:** Intermittent
- **What happened:** The matrix tree view is not loading.
- **What was expected:** I expected it to load.
- **Notes:** This message popped up.
Error: missing revert data (action="call", data=null, reason=null, transaction={ "data": "0xb0482fd9", "to": "0xA2a749173fE3307
- **Submitted:** Mon, 03 Aug 2026 14:40:52 GMT


### [2026-08-03] Dashboard (index.html) — I disabled auto upgrade and my income lessened by about $200…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0xd4c441c795e86939fd19fc2ed05918bb75f1c905
- **Frequency:** Intermittent
- **What happened:** I disabled auto upgrade and my income lessened by about $200 and 4 tiers graduated even the ones that has not even made a complete cycle.
- **What was expected:** I expect the opposite to happen.
- **Submitted:** Mon, 03 Aug 2026 14:26:13 GMT


### [2026-08-03] Dashboard (index.html) — There is more than enough USDC in my wallet however I am get…
- **Reporter:** Barbara
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0xf657a95268f395f855eae0f8f57741c080a1cf25
- **Frequency:** Consistent
- **What happened:** There is more than enough USDC in my wallet however I am getting an error message when I do self rescue that I do not have enough. Does the self rescue have to come from matrix earnings?
- **What was expected:** I do not know.
- **Submitted:** Mon, 03 Aug 2026 13:17:04 GMT


### [2026-08-03] Dashboard (index.html) — this morning all of my 8 accounts are saying no active posit…
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x79470c63b5421e333ab4149b3206d55a39c17532
- **Frequency:** Consistent
- **What happened:** this morning all of my 8 accounts are saying no active positions and there is no self rescue option.
- **What was expected:** to be able to self rescue and get back in.
- **Submitted:** Mon, 03 Aug 2026 11:39:29 GMT


### [2026-08-03] Dashboard (index.html) — I have upgraded this account to tier 5. It's showing tiers t…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x5d6ca88ac287579c8d8660c881302bad6bf0d2f2
- **Frequency:** Intermittent
- **What happened:** I have upgraded this account to tier 5. It's showing tiers that have not completed a cycle as graduated. Tiers 3 - 5 sometimes 4 and 5.
Sometimes it says no active position.
When the self rescue window pops up and I click to do so It does not execute the rescue and the window disappears.
- **What was expected:** I expect the info to be consistent. I expect to cycle on all tiers until I disable the automation.
- **Submitted:** Mon, 03 Aug 2026 02:02:23 GMT


### [2026-08-03] Dashboard (index.html) — After a refresh, the CNova Balance is not showing.... 000 Ba…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x46cc052b2eb70f869b8ceae6f217d475a4e0c6d5
- **Frequency:** Consistent
- **What happened:** After a refresh, the CNova Balance is not showing.... 000 Balance.
- **What was expected:** To see my CNova Balance.
- **Submitted:** Mon, 03 Aug 2026 01:48:46 GMT


### [2026-08-03] Other — It looks like every refresh displays the amount you have in …
- **Reporter:** sherwyn
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x001d82fb20dc3b947f7023f198eee009533538a3
- **Frequency:** Consistent
- **What happened:** It looks like every refresh displays the amount you have in each tier so depending on how many tiers you're in you need to refresh that number of times until you get to the end and then your total amount earned will show.. so self rescue if you need to may not show up until you refresh and get to that tier..
- **What was expected:** One refresh and all info is displayed...
- **Notes:** This is what I am seeing which can be a bit confusing and annoying since you're not sure of the status..
- **Submitted:** Mon, 03 Aug 2026 01:36:49 GMT


### [2026-08-02] Dashboard (index.html) — I'm currently upgraded to tier 3. i have all three automatio…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x9133213faa78ef4ea6651a2d492a20a19d301c34
- **Frequency:** Consistent
- **What happened:** I'm currently upgraded to tier 3. i have all three automation enabled but I was still graduated from tiers 1&2.
- **What was expected:** i should have remained in tiers 1 and 2 until i disable the automation.
- **Notes:** Before displaying the graduated status , there was a no active status. After a few hard refreshes the self rescue screen popped up but I was unable to self rescue even though I clicked on the button. The screen subsequently disappeared and the graduated status appeared.
- **Submitted:** Sun, 02 Aug 2026 19:58:55 GMT


### [2026-08-02] Other — Every Refresh of the system gives me different info for the …
- **Reporter:** Sherwyn
- **Page:** Other
- **Wallet Type:** Rabby
- **Wallet Address:** 0x1e8e2dcf876d0d94077c93a7e33bda2ab72ab1f7
- **Frequency:** Consistent
- **What happened:** Every Refresh of the system gives me different info for the account, mainly the total earned area and the members ID section.  Needs to refresh about 6 or so times in order to get accurate info... most times the member section doesn't show any directs in the account  and is saying that I have graduated from Tiers without even a single crossing or rotation.. the RPC seems to be very slow in getting and displaying accurate info, or may be it's my computer...lol. Self rescue is another issue.. one refresh says I'm in the matrix and another refresh says that I must self rescue..
- **What was expected:** Not to have to do so many refresh to get accurate info.. Sorry for the long post...
- **Notes:** Happening to all my accounts.. I'm not able to keep track of what is really happening to each account because everytime I do a refresh new info is displayed. and every refresh takes you back to the home page and then you have to select dashboard which may be another refresh.... Can it be done that when a refresh is done, the page which invoked the refresh you come back to that page instead of going to home page?
- **Submitted:** Sun, 02 Aug 2026 19:08:27 GMT


### [2026-08-02] Dashboard (index.html) — i am still not able to refresh my accounts.
i have to either…
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x79470c63b5421e333ab4149b3206d55a39c17532
- **Frequency:** Consistent
- **What happened:** i am still not able to refresh my accounts.
i have to either restart my phone or playing around clicking from home to register to dashboard then it refreshes.
Also most times the  account shows the wrong total earned until i get page to refresh 2 or 3 times.
when i do a self rescus and the dashboard is updated it sometimes come back with everything showing zero until i am able to refresh.
- **What was expected:** honestly i dont know.
- **Submitted:** Sun, 02 Aug 2026 14:45:55 GMT


### [2026-08-02] Onboarding / Registration — I keep getting and error when I tap on the 'approve $10' tab…
- **Reporter:** E2theb
- **Page:** Onboarding / Registration
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x878660b77ddea5884709d2cd2e9453931cc528a0
- **Frequency:** Consistent
- **What happened:** I keep getting and error when I tap on the 'approve $10' tab.
- **What was expected:** The system should have approved my $10 and then register
- **Notes:** Step 2: Register ($10 USDC)
❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below
- **Submitted:** Sun, 02 Aug 2026 14:22:27 GMT


### [2026-08-01] Dashboard (index.html) — I was graduated from tier 1 even though I have auto re-entry…
- **Reporter:** @Koach100
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x1ca3316ebc2f991c073ccdd1a25c68d482589a94
- **Frequency:** Consistent
- **What happened:** I was graduated from tier 1 even though I have auto re-entry and double re-entry enabled.
- **What was expected:** I expect to still be in tier one until I disable the automation.
- **Submitted:** Sat, 01 Aug 2026 16:42:54 GMT


### [2026-07-31] Other — ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) …
- **Reporter:** Jacob Banji-Ajala
- **Page:** Other
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x95ebde6a7c0a91699eac972c8cd3284f45d5e1e5
- **Frequency:** Intermittent
- **What happened:** ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** Should be smooth alignment
- **Notes:** ❌ Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **Submitted:** Fri, 31 Jul 2026 22:18:48 GMT


### [2026-07-31] Dashboard (index.html) — i am not able to refresh on any of my accounts.I have to res…
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x79470c63b5421e333ab4149b3206d55a39c17532
- **Frequency:** Consistent
- **What happened:** i am not able to refresh on any of my accounts.I have to restart everytime.
- **What was expected:** to be able to refresh without always having to restsrt my pjone.
- **Submitted:** Fri, 31 Jul 2026 14:59:50 GMT


### [2026-07-30] Other — When I trying to register an account:

after clicking Approv…
- **Reporter:** Anthony L
- **Page:** Other
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x3c17556855cfbd29b6f7a41ebfdbe8e914b7bbdd
- **Frequency:** Consistent
- **What happened:** When I trying to register an account:

after clicking Approve $10  USDC then confirm from Metamask 
then I check off the box and click GOT IT and confirm

then the bot that I checked off and clicked GOT IT re-appears with the box already check off, and when i click got it again the same thing happens and that senario keeps reapeating 

I am unable to register any account
- **What was expected:** the box should repair unchecked allowing me to check the box and CONFIRM to Approve the $10 usdc to register the account
- **Submitted:** Thu, 30 Jul 2026 19:36:33 GMT


### [2026-07-30] Buy CNOVA (buy.html) — I tried upgrading from T1 to T2 but was unable to do so.
- **Reporter:** @Koach100
- **Page:** Buy CNOVA (buy.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x56a832cc5f2617c08e6484c2b04d971edc1ec57f
- **Frequency:** Consistent
- **What happened:** I tried upgrading from T1 to T2 but was unable to do so.
- **What was expected:** I should have been able to upgrade.
- **Notes:** Here's the message that popped up.
 This upgrade is currently too large for the network to process (needs ~15.8M gas, the chain's limit is ~17.8M). Nothing was sent and nothing was charged. This happens when entering a tier sets off a long chain of matrix rotations — it clears on its own as those settle. Please try again shortly, and let us know if it persists.
- **Submitted:** Thu, 30 Jul 2026 18:23:02 GMT
- **STATUS 2026-07-30 — DUPLICATE of the gas ticket below ("upgrade too large for the network", 4 reports consolidated).** Same bimodal cascade gas: a T1→T2 upgrade that lands on the entry filling a MatA triggers a long rotation chain (~15.8M) against the ~17.8M ceiling; a quiet entry is ~13M. The frontend behaved correctly — it refused the doomed tx and told him nothing was sent/charged (gas guard working on buy.html too). **Workaround = retry** (T2 turns over constantly, so a second attempt usually lands in the cheaper mode). **Permanent fix = V8.46 item 3 (cascade depth cap, BUILT, GREEN)** — closes on deploy. No new work.


### [2026-07-30] Dashboard (index.html) — this account is upgraded all the way to T10.
T2 has graduate…
- **Reporter:** CryptoJan22
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x79470c63b5421e333ab4149b3206d55a39c17532
- **Frequency:** Consistent
- **What happened:** this account is upgraded all the way to T10.
T2 has graduated a couple days ago and has not reentered T2.
it says the reserve is 20,000 .
this or none of my other accounts have assets to claim or withdraw.
this account has 4 direct referrals and 4 second level referrals.
- **What was expected:** reentry into T3 by now.
i am supprised about the quantity of reserve.
to be able to have some withdrawable assets.
- **Submitted:** Thu, 30 Jul 2026 16:07:01 GMT
- **DIAGNOSIS 2026-07-30 (on-chain, wallet 0x79470c63) — NOT A BUG; working as designed, wording owed.** Read live off V8.45: highestTier **T10**, `reservedFor` **$20,000.00**, T10 fee $10,000, autoUpgrade **OFF**, autoReentry **ON**, doubleReentry **ON**. The reserve is exactly re-entry ($10,000) + double ($10,000); auto-upgrade contributes $0. **The "phantom fee to upgrade past T10" suspicion from the 29th is DISPROVEN** — `reservedFor` (TierRouter:1667) sets `nextFee = (nextIdx < MAX_TIERS) ? tierEntryFees[nextIdx] : 0`, so the top tier reserves nothing for a non-existent next tier (guard added V8.19, commit 36cde38 — live in V8.45). His "no withdrawable" is earnings committed to those two seats, not lost. **Member fix:** turn OFF double re-entry to free $10,000 (keeps single re-entry); turn OFF auto re-entry to free the other $10,000 (then parks at cycle-out). "T2 hasn't re-entered" is separate — the graduate-vs-re-enter item below, not the reserve. **Frontend owed:** itemise the reserve box ("Auto re-entry $10,000 · Double re-entry $10,000 — turn a toggle off to free it") instead of a bare $20,000. No contract change.


### [2026-07-30] Dashboard (index.html) — "upgrade too large for the network" / "gas limit too high" (4 reports consolidated)
- **Reporter:** Maximum_71 (wallets 0x99b52ee9, 0x7010ad1e, 0xde580069, 0x18750a2c)
- **Page:** Dashboard (index.html) — upgrade / re-entry
- **What happened:** Upgrades quote ~15-17M gas against the chain's ~17.8M ceiling and refuse ("too large for the network" / "gas limit too high" / "transaction failed").
- **Diagnosis:** Bimodal upgrade gas — an entry that triggers a long rotation cascade costs ~18M, a quiet one ~13M; which you get depends on the second you press. **Retrying usually lands in the cheaper mode and succeeds.**
- **STATUS 2026-07-30 — KNOWN, workaround = retry.** Permanent fix is the cascade depth cap, **V8.46 item 3 (BUILT, GREEN)** — closes on the V8.46 deploy. (Consolidated from 4 separate Maximum_71 reports the same morning.)

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


### [2026-07-29] Auto-upgrade — fails despite sufficient earnings (community call)
- **Reporter:** Community call (owner relay) — June's account cited
- **Page:** Dashboard (index.html)
- **Frequency:** Consistent on affected accounts
- **What happened:** Account showed only **$0.25 available** against **$88.98 total earned**, and auto-upgrade did not fire.
- **What was expected:** Auto-upgrade to trigger from accumulated earnings.
- **STATUS 2026-07-29 — NOT YET DIAGNOSED, address needed.** Leading hypothesis, testable in one run of `member_ledger.js`: `$0.25` is `freeWithdrawable` (after the crossing reserve AND the whole automation reserve are withheld) while `$88.98` is lifetime `totalEarned` across every matrix. Those are different quantities and the screen puts them side by side. If confirmed it is a WORDING bug, not an engine bug — but `_executeAdditive` spends `escrow + withdrawable` in the cycling matrix only, so a genuine funding gap is also possible. **Need June's wallet address to settle it.**
- **DIAGNOSIS 2026-07-30 — mechanism confirmed on a SIBLING account, not yet on hers.** June is Koach100, who runs several test accounts; neither wallet on file matches the reported $88.98, so the exact account is still unidentified. But the pattern is reproduced exactly on `0x1ca3316E`: **$5,540.35 total earned against $389.92 releasable**, because lifetime `totalEarned` spans every tier while "available" is `freeWithdrawable` after the crossing lock and the automation reserve. Her `$0.25 vs $88.98` is the same ratio at a smaller scale. **Almost certainly a labelling problem rather than an engine fault — but I will not close it on a sibling account.** Need her wallet address to confirm, then this closes as wording.

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
