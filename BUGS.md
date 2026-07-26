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


### [2026-07-26] Dashboard (index.html) — I manually entered my account 2 and placed it under account …
- **Reporter:** @queensonnie
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x70569791ab42304adde5a34c412ec6e411ae0b0b
- **Frequency:** Intermittent
- **What happened:** I manually entered my account 2 and placed it under account 1 then, I copied the referral  link and placed it in the browser to place account 3 under account 1,  but it did not show that account 1 has 2 direct referrals.
- **What was expected:** Account 1 should have two Direct referrals
- **Submitted:** Sun, 26 Jul 2026 15:37:52 GMT


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


### [2026-07-26] Dashboard (index.html) — The requested funds were approved to upgrade my main account…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x145805e87ce365ad6c2636b8f6e10b6550f3dc2a
- **Frequency:** Consistent
- **What happened:** The requested funds were approved to upgrade my main account, but did not appear in the account.
- **What was expected:** To be able to upgrade my account with the necessary funds.
- **Submitted:** Sun, 26 Jul 2026 12:46:14 GMT


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


### [2026-07-26] Dashboard (index.html) — Self=rescue failed. Transaction failed on-chain — hard-refre…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x185b19c7d3872692981568985b21ae6f7f6be2a4
- **Frequency:** Consistent
- **What happened:** Self=rescue failed. Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To re-enter the Queque.
- **Submitted:** Sun, 26 Jul 2026 12:10:39 GMT


### [2026-07-26] Dashboard (index.html) — Self-recue failure. Transaction failed on-chain — hard-refre…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x832b95a579478784fada54ad7b62c7963e21fefb
- **Frequency:** Consistent
- **What happened:** Self-recue failure. Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To rescue this account.
- **Submitted:** Sun, 26 Jul 2026 01:53:12 GMT


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


### [2026-07-25] Dashboard (index.html) — Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) an…
- **Reporter:** @Lavern_Gay
- **Page:** Dashboard (index.html)
- **Wallet Type:** Rabby
- **Wallet Address:** 0x185b19c7d3872692981568985b21ae6f7f6be2a4
- **Frequency:** Consistent
- **What happened:** Transaction failed on-chain — hard-refresh (Ctrl+Shift+R) and try again. If it persists, use the bug report link below.
- **What was expected:** To self-rescue this account.
- **Submitted:** Sat, 25 Jul 2026 23:59:47 GMT


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


_(new reports land here — untriaged; respond, then move to Pending)_

## Pending — Responded (12h auto-close)

_(none yet on V8.44)_

## Fix In Progress — closes when the fix ships

_(none yet on V8.44)_

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
