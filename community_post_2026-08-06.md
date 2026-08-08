# CryptoNova V8.47 — Day 2 Update & How You Get Paid

## The system is healthy

V8.47 has been live for a little over a day, and the numbers speak for themselves: **285+ members registered**, the first **matrix cycles completed cleanly**, and our automated integrity checks — which verify every seat in every matrix, every hour, on-chain — have passed **every single run** since launch. When T1 filled up, the system automatically opened a second T1 matrix pair, exactly as designed. No stuck positions, no lost funds, no drama.

## How the compensation actually pays — worth 2 minutes of your time

We had a great bug report this week (thank you Sherwyn — this is exactly what testing is for) that turned out not to be a bug, but it showed us we haven't explained the comp plan clearly enough. So here it is, straight from the contract code:

**You earn TWO different income streams, and they follow different rules:**

**1. Direct Commission — 5% — follows YOUR REFERRALS.**
Every person who registers with your referral link pays you 5% of their entry fee ($0.50 on a $10 T1 entry), instantly, every time, unlimited width. Your personal recruiting, your money.

**2. Chain Pay — 2.7% × five levels — follows THE MATRIX.**
When any new member lands in a matrix, the five members seated directly **above their position** each receive 2.7% of the pay base — whether they referred that person or not. This is the community income stream: as matrices fill and rotate, people land under your seat and pay your chain, including members you've never met.

**What this means in practice:** your referral's referral does NOT automatically pay you chain pay — their chain pay goes to whoever is seated above them in the matrix. In exchange, you receive chain pay from everyone who lands under YOUR seat, referred by anyone. Over time, active members earn from far more people through the matrix than through their personal tree alone. That's the figure-8 design working as intended.

## Fixes shipped from YOUR bug reports (keep them coming — $1 per accepted find)

- **Toggle switches needed two clicks** (reported by Sherwyn, confirmed by the owner) — fixed. One click, one transaction, the tick holds.
- **Reserve breakdown showed the wrong auto-upgrade amount after upgrading** (Sherwyn + Kira) — fixed. It now always shows your real next-tier fee.
- **Dashboard hung on "Refreshing…" after an upgrade or self-rescue** (Kira) — fixed. The dashboard now retries on its own; no more manual refresh.
- **Status page showed old totals from the previous version** — fixed. Fresh deployment, fresh numbers.

Every accepted bug report earns **$1**, credited at triage. The report button is at the bottom of every page. You don't need to be sure it's a bug — if something looks wrong, tell us. Two of this week's best reports turned out to be "working as designed," and they still made the product better.

## A note on rescue loans

If the system ever advances funds to keep your position moving (a rescue), that advance is a **repayable loan that stays on your account until cleared** — it repays automatically out of your future earnings, from any tier. V8.47's headline feature is precisely this: rescue advances now follow the member reliably instead of getting stranded. It's working, it's monitored hourly, and it's what makes the Stability Fund sustainable for everyone.

— The CryptoNova Team
