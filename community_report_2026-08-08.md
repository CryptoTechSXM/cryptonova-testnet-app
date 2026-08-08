# CryptoNova V8.47 — Test Report: The Loan System Works, and You Helped Prove It

## Where we stand

V8.47 has now been live for three days, and we have pushed it hard on purpose. **576 members** — the all-time join count on the Live Stats page — have generated more than **1,240 completed matrix cycles**. That ratio is the figure-8 design doing exactly what it was built to do: the self-sustaining loop keeps re-entering members as cycles complete, and every member holds a seat in **both halves** of their matrix, so a compact community produces continuous, compounding flow rather than needing endless new joins. Tiers T1 and T2 are filled to capacity on both halves. Through all of it, the hourly on-chain integrity check — which verifies every seat in every matrix — has stayed green, and a second hourly auditor now proves the Stability Fund's books balance to the cent: every loan on the ledger is matched by exactly what was lent minus what has been repaid. The Stability Fund itself has grown to over **$1,600 purely from organic protocol fees** — no top-ups, by policy.

## The headline: a rescue loan's full life, witnessed on-chain

V8.47's core promise was that a rescue advance follows the member until it is repaid. This week we watched that happen end to end on live accounts:

1. A member ran short at a crossing and the fund **advanced the shortfall** — the loan appeared on their dashboard banner immediately, with the exact amount and how it repays.
2. Their ongoing earnings **repaid it automatically**, a share of each payout at a time, from any tier they earned in.
3. When one member upgraded tiers, the upgrade **settled the remaining balance in the same transaction** — the approval screen showed it plainly: entry fee plus loan, one signature, done.

That is the Stability Fund working as designed: nobody stranded, nothing forgotten, everything visible.

## What you'll notice on the site

- **Your numbers agree everywhere.** The Withdrawable card, the balance breakdown, and the MAX button now all compute your claimable balance the exact way the contract does — including seats, reserves, pending pool earnings, and any loan. If two figures ever differ again, that's a bug report we want.
- **One signature to withdraw everything.** Withdraw All — and any full-amount withdrawal — sweeps every tier in a single transaction.
- **Partial withdrawals find all your money.** Typed amounts now source from every matrix you have a balance in. (Making typed amounts a single signature too is coming in V8.48 — see below.)
- **Three ways off the bench when you're parked.** Self Rescue (pay the gap from your wallet, no debt), the new **Copay Rescue** button (instant re-entry — the fund lends only the gap, repaid automatically from earnings), or simply wait: fully-funded members are re-entered free within minutes, and everyone else is auto-rescued after the grace period.
- **Honest reserve numbers.** If you use automation, the reserve badge now shows both the target and what is actually held from your current earnings.

## Bug bounty — the program is earning its keep

Two community finds were fixed **same-day** this week. Sherwyn's 11th accepted find caught the breakdown panel disagreeing with the withdrawal panel — chasing it led us to unify every money figure on one calculation. And a first-time reporter, Jacob, caught upgrades failing for members carrying a rescue loan — the fix means the approval now covers fee plus loan together, with a clear explanation on screen. Every accepted report still earns **$1**, credited at triage. The report button is at the bottom of every page — if something looks wrong, tell us. It keeps making the product better.

## Next phase: V8.48

The testing also confirmed a short list of refinements that live in the contracts themselves, so they arrive with the next deployment rather than a website update:

- The contract's public balance view will report exactly what a withdrawal would release (the website already computes this correctly; the chain should say it too).
- Reserve accounting gets first-class treatment on-chain, so "reserved" always means precisely what it says.
- **One-signature partial withdrawals** — the last piece of the streamlined withdrawal experience.

None of these affect the safety of funds on V8.47 — they make the chain's own bookkeeping as clear as the site's. A V8.48 deployment on testnet means a fresh start (positions reset, everyone re-registers), and we will announce the date well in advance with a withdrawal window beforehand, same as last time.

Thank you for testing, reporting, and pushing the system — this is exactly what this phase is for.

— The CryptoNova Team
