# Community post — 27 July 2026

*Draft for Telegram. Plain language, no reset required this time.*

---

**Matrix A rotation — we found it, and it's fixed without a reset**

First: thank you to everyone who kept reporting. **Sherwyn** flagged "my accounts haven't crossed from Matrix A to Matrix B, not even once" across four different wallets and three versions running. **Kira** independently noticed the T1 slowdown. **CryptoJan22** reported repeated self-rescue prompts. **Lavern** filed report after report on failed rescues and upgrades. You were all describing the same thing from different angles, and you were right.

**What was actually wrong**

Matrix A only turns when someone enters it. Two separate settings decide where entries go — one for brand-new members, one for members cycling out and re-entering.

Both were checking a pair's **lifetime total** of entries instead of how full it is **right now**. Since a lifetime total only ever grows, every pair eventually crossed the line and got permanently marked "done" — at which point it stopped receiving anyone, from either direction. Its Matrix A had nothing left to turn it, and everyone sitting in it stopped moving. Permanently.

That's why it looked like the system had slowed down. It hadn't slowed — those matrices had stopped completely.

**What we changed**

Two settings, adjusted directly on the live contracts. **No redeploy. No reset. Nobody lost their position or their progress.** After the last two nights, that mattered to us a great deal.

Within seconds of the second change, Matrix A rotation restarted on the affected pairs. Tier 2, Tier 3 and Tier 5 came back first, then Tier 1.

**What you should see**

Movement — gradual, not instant. If you've been stuck in Matrix A, you're now in a queue that's actually advancing rather than frozen.

Tier 1 is currently turning at roughly **25 rotations an hour**. Each rotation moves everyone in that matrix up one seat, so depending on where you're sitting you should cross within the next few hours rather than never. We're watching the counters continuously and will post real numbers tomorrow.

**About those self-rescue charges**

CryptoJan22 asked why the amounts vary so much, from under a dollar to over forty. Here's the honest answer, because it isn't a bug:

When you cycle out, your crossing reserve covers exactly **half** of your next entry. The other half comes from your earnings. If your earnings haven't reached that half — which is common for accounts without referrals — you're parked and asked to cover the difference. The amount varies because your earnings vary. Accounts with active referrals usually cover it automatically and never see the prompt.

We think the interface explains this badly. "Transaction failed on-chain" when you simply need more USDC is not a useful message, and that's on us to fix. It's on the list.

**Still open**

A few upgrade-path issues, the referral count display, and some interface fixes. All logged, none forgotten.

**Keep them coming**

Every fix in the last three days started with a member report. The bug bounty stands at $1 per accepted find, and payouts are going out. If something looks wrong, report it — even if you think someone else already has.

— CryptoNova Team
