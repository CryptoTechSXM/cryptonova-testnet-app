# Community post — 28 July 2026

*Draft. Telegram version with emoji, matching the 27 July format.*

---

📢 **Three matrix pairs had stopped accepting entries. Found, cleared, no reset.**

If you tried to upgrade this morning and got a red error that made no sense — it wasn't your account, and it wasn't your money. Here's exactly what happened. 🙏

🔍 **What was wrong**

Every pair has two halves, Matrix A and Matrix B. You sit in A, work your way to the front, and hand over into B. That handover is the figure eight.

A small number of members had ended up holding a seat in **both halves of the same pair at once**. Harmless while they're partway down the queue — but the moment one of them reached the front, the system tried to hand them into a Matrix B they were already sitting in. That's not allowed, so the whole transaction stopped.

Here's the part that made it confusing: the transaction that got stopped **wasn't theirs**. It was whoever happened to be entering that pair at that moment. Their upgrade, their registration, their rescue — killed by a collision two seats away that had nothing to do with them.

That's why the reports looked unrelated to each other. Three pairs were affected: **Tier 2, Tier 3 and Tier 4.**

💰 **No money moved. At all.**

This kind of failure stops the transaction *before* anything changes. No fees were taken, no balances altered, no positions lost. If your upgrade failed this morning, you were blocked — not charged.

🔧 **What we did**

We freed the duplicate seat on the affected members' Matrix B side, which let the handover complete normally.

**No redeploy. No reset. Nobody lost a position.** The members involved kept their place at the front of Matrix A, kept every cent, and crossed into Matrix B properly within minutes — their held reserve was released straight into their withdrawable balance in the process.

Within ten minutes of the fix, dozens of upgrades that had been failing all morning went through on the first try.

🛡️ **So it can't sit unnoticed again**

There's now an automatic check running every ten minutes that looks for this exact condition and clears it. Previously we'd only have found out the way we found out today — because you told us.

✅ **What you should do**

**If your upgrade failed this morning, just try it again.** It should go through now. If it doesn't, report it and say so — that's useful information, not a nuisance.

🙏 **Who found this**

**@Koach100** reported a Tier 2 upgrade failing repeatedly and — crucially — **pasted the exact error text**. **Kira** hit the same wall on Tier 3. That error message was the thread we pulled to find all of it. Without those two reports we'd have spent the day guessing.

Several others reported failed rescues and upgrades overnight that trace back to the same cause.

---

💬 **Sherwyn's question — worth answering for everyone**

*"My self rescue says I'm $5.00 short, but my account shows $6.50 in T1. Why do I need to rescue when there are funds to cover it?"*

Fair question, and the answer isn't a bug.

Your **crossing reserve** covers exactly **half** of your next entry fee. Always half, by design. The other half has to come from **earnings you've accumulated**. If your earnings haven't reached that half yet, you're parked and asked to cover the difference.

The $6.50 showing in T1 isn't all spendable toward the crossing — part of it is the reserve already earmarked for it. The $5.00 is what's genuinely still missing.

Referral income is what usually closes that gap. Accounts with active referrals tend to cover it automatically and never see the prompt. (Sherwyn has since crossed into Matrix B. ✅)

📋 **Still open**

A member showing a tier on their account without a matching seat, one self-rescue failure, the referral count display, and a couple of interface items. All logged, none forgotten.

🐛 **Keep them coming**

Today is the clearest example yet of why this matters. Two members pasted an error message and it led straight to a bug affecting three tiers. The bounty stands at **$1 per accepted find** — tallied and paid out once we go live.

If something looks wrong, report it — **and paste the exact error text if you can see it.** It's worth more than you'd think.

— CryptoNova Team
