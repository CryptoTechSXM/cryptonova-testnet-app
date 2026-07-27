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

### [2026-07-26] Onboarding / Registration — The upgrade option is not visibly working. I an bot able to …
- **Reporter:** Kira
- **Page:** Onboarding / Registration
- **Wallet Type:** Rabby
- **Wallet Address:** 0x0f50998163f3dee028a3d72153659d08aede45f3
- **Frequency:** Consistent
- **What happened:** The upgrade option is not visibly working. I an bot able to upgrade from that page. Once registered it is non functional, only available on dashboard!
- **What was expected:** I expected to have the option to upgrade from either places registration and dashboard!
- **Submitted:** Sun, 26 Jul 2026 23:08:21 GMT

### [2026-07-26] Dashboard (index.html) — I manually entered my account 2 and placed it under account …
- **Reporter:** @queensonnie
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x70569791ab42304adde5a34c412ec6e411ae0b0b
- **Frequency:** Intermittent
- **What happened:** I manually entered my account 2 and placed it under account 1 then, I copied the referral  link and placed it in the browser to place account 3 under account 1,  but it did not show that account 1 has 2 direct referrals.
- **What was expected:** Account 1 should have two Direct referrals
- **Submitted:** Sun, 26 Jul 2026 15:37:52 GMT

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

## Pending — Responded (12h auto-close)

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


## Fix In Progress — closes when the fix ships

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

