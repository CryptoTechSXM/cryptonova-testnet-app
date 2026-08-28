# BUG TRIAGE — 2026-08-28 (session 45)

17 open reports in `BUGS.md` on `origin/data`. Two are post-V8.50; fifteen predate
the 2026-08-26 community redeploy.

## The rule this pass followed

**A ticket closes only when a specific line of current code or a chain read explains
the reported mechanism.** Not because it is old, not because the chain it was filed
against no longer exists, and never on an explanation shared across several tickets.

That rule is not abstract. `@Lavern_Gay`'s report was closed once on a mechanism read
out of the source — "a coupon locks the referrer to its funder" — that was never
checked against her wallet. The chain contradicted it and the ticket had to be
reopened. **Fifteen of these are old-chain tickets, and "the chain was replaced" is
exactly the kind of shared explanation that closed hers.** So it is not used here.

## ⛔ Found during this pass, before any ticket was touched

`bug_manager.js` — the tool that closes reports — was still hardcoded to
`const BRANCH = 'admin'`. Handoff 45.1 warned that the three API files moving to the
`data` branch must "all move together or the data forks", and named three.
**There were four.** Running it would have read the stale ledger on `admin`, written
closures there against the live one on `data`, and burned a Vercel deployment doing
it. Fixed to `process.env.GH_BRANCH || 'data'`, and `close-all` now refuses without
`CONFIRM_BULK_CLOSE=yes` because bulk-closing is a standing owner "do not".

---

## CLOSE — mechanism explained by current code

**[2026-08-17] Jacob — Bug Report Page, "Fail to create … gas limit too high"**
Measured: `bug-report.html` contains **zero** `estimateGas` / `sendTransaction` /
`.wait()` / `signer` calls. It POSTs to `/api/submit-bug` (lines 426, 529) and touches
`window.ethereum` only to read an address. **The submission path sends no transaction,
so a wallet gas error cannot arise from it.** Corroborating: his report is *in the
ledger* — the submission that produced the error still filed. Closing as resolved,
with a reply asking him to re-report if it recurs.

**[2026-08-08] CryptoJan22 — "T2 USDC approved but the self rescue button is not showing"**
This is the stale-shortfall gate, and it was fixed twice over. The shortfall MOVES
while a member sits parked, so an allowance that covered it at render time failed at
click time. `index.html:1382` records the 2026-08-24 change: **the approval is now the
ENTRY FEE, not the exact shortfall** (measured case `0xa0763F34`, $11.88 approved
against a $12.50 shortfall). Both ready-gates then adopted `max(fee, shortfall)` on
2026-08-26. A "Refresh balance" button was added on the same panel so the button can
no longer stay grey until a full page reload. Closing.

**[2026-07-26] Kira — "on the tiers page the information is a bit ambiguous … T1.1/T2.1
new pairs could have the count when new"**
The display half shipped: `index.html:3630-3634` carries the fix for exactly this —
new pairs showing `0/127` while the community filled an earlier pair, with the active
pair now chosen correctly. Closing the display half.
▶ Her second point — *"the slow down on T1 is very noticeable, maybe we can increase
the numbers to 400 or 500"* — is a **product decision, not a defect**, and is the
owner's call. Tracked separately; not closed as a bug and not silently dropped.

---

## STAY OPEN — with the specific next measurement, not a shrug

**Awaiting live confirmation (fix shipped and on the members' domain)**

* **@Lavern_Gay** — referrer could not be changed. Fixed in `98a0da2`; confirmed on
  chain for a *different* wallet. ▶ NEXT: ask her to retest and run `diag_referrer.js`
  on her account either way. **Do not close a second time on an explanation not run
  against her wallet.**
* **@ThanksAndPraises** — accounts revert to the default referrer. Same fix, same
  status. ▶ NEXT: `diag_referrer.js` on a wallet he registers after the fix. His
  existing placements are on chain and a frontend fix does not move them — what to do
  about those is a separate owner decision.

**Dashboard status read fails (one defect, two reporters)**

* **@bevmawire** (08-22) — "Couldn't load your status" appeared mid-rescue and blocked it.
* **Maximum_71** (08-18) — quoting our own message back to us: *"The RPC node didn't
  respond after several retries — this is NOT a confirmation that you're unregistered."*

Both are the same panel (`index.html:1246-1247`). The message itself is **correct and
deliberately honest** — it refuses to report a failed read as "not registered". The
defect is the frequency, and that a failed read can interrupt a rescue already in
progress. ▶ NEXT: this is the **index.html failure-as-zero sweep** that status.html
already had and index.html never did. Do that sweep; it closes both.

**Withdrawal family — four reports, no shared excuse**

* **Sherwyn** (08-13) — "Withdraw all triggers the contract but no wallet confirmation;
  CNova withdrawals worked."
* **CryptoJan22** (08-11) — "clicking max, only 50% went through."
* **Deborah** (08-10) — "Tried withdrawing and it failed, $50." (no further detail)
* **@Koach100** (08-05) — dashboard said $287.83 available, max populated $152.23,
  wallet received $302.63.

Session 44 fixed the withdraw-destination normaliser (unreadable input was silently
falling back to the connected wallet). That is **not** the mechanism in any of these.
▶ NEXT: one instrument that replays the withdraw path against a V8.50 wallet and
prints, side by side, `withdrawableOf` · what the max button computes · what the
contract actually transfers. Koach100's three disagreeing numbers are the sharpest
lead — **the disagreement IS the finding**. Until that exists, these stay open.
⚠ 44.6 remains an open owner call on the same panel: unreadable destination text still
falls back to the connected wallet rather than blocking the withdrawal.
Recommendation given: it should block.

**Self-rescue experience**

* **@ronnienic197** (08-08) — "self rescue takes an extremely long time … could this
  just be my MetaMask?" ▶ NEXT: a performance report with no measurement attached
  cannot be closed honestly. Ask him to retest on V8.50 and time it. Keeper-side
  discovery is currently flat at 1.0-1.1s, but that is the keeper's path, not his.
* **CryptoJan22** (07-29) — rescue panel vanishes silently when a rescue completes.
  ▶ MEASURED TODAY, **still real**: there is no positive empty state. The revert
  decoder has friendly text ("no rescue needed right now"), but that fires on a
  *reverted transaction*, not on a panel that renders nothing. `renderParkedList`
  (`index.html:10131`) hides the box and says nothing. Needs a short confirmation.

**Product/UX, confirmed and queued**

* **Kira** (07-26) — upgrade controls exist only on the Dashboard, not on Registration.
  ▶ MEASURED TODAY, still true: all 13 `manualUpgrade` call sites are dashboard-side.
  Design gap, no contract change needed. Owner to confirm the intent before building.
* **Sherwyn** (08-05) — the unlock button after withdrawing all CNOVA returns a raw
  chain failure; he asked for wording, not a fix. ▶ A friendly revert decoder now
  exists (`index.html:9226+`) but has no case for this one. Small, worth doing.
* **CryptoJan22** (08-10) — "5 directs but only 2 cycles." Cycles are driven by matrix
  fill, not direct count. ▶ Likely not a defect, but that has NOT been run against his
  wallet, so it is not closed. Run `member_history.js` on `0x79470c63…` first.
* **@Koach100** (07-27) — T3 showing 0 cycles. Already diagnosed: **the chain said 2**,
  so the dashboard figure was wrong. The seat question was explained (auto re-entry
  off = graduation, which returns the reserve but does not keep the seat). ▶ The
  display half is still open.

---

## Counts

* 17 open → **3 closed on evidence**, 14 remain with a named next measurement.
* 2 of the 14 are awaiting a member's retest and could close this week.
* The largest single win available is the **index.html failure-as-zero sweep**: it
  closes two tickets outright and is already on the open-items list independently.
