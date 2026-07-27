# Community post — 27 July 2026

*Telegram version with emoji, as approved. Bounty line updated to tallied-at-go-live. Now includes the fixes that shipped this afternoon.*

---

📢 **Matrix A rotation — we found it, and it's fixed without a reset**

First: thank you to everyone who kept reporting. 🙏

**Sherwyn** flagged "my accounts haven't crossed from Matrix A to Matrix B, not even once" across four different wallets and three versions running. **Kira** independently noticed the T1 slowdown. **CryptoJan22** reported repeated self-rescue prompts. **Lavern** filed report after report on failed rescues and upgrades.

You were all describing the same thing from different angles, and you were right.

🔍 **What was actually wrong**

Matrix A only turns when someone enters it. Two separate settings decide where entries go — one for brand-new members, one for members cycling out and re-entering.

Both were checking a pair's **lifetime total** of entries instead of how full it is **right now**. A lifetime total only ever grows, so every pair eventually crossed the line and got permanently marked "done" — at which point it stopped receiving anyone, from either direction. Its Matrix A had nothing left to turn it, and everyone sitting in it stopped moving. Permanently.

That's why it looked like the system had slowed down. It hadn't slowed — those matrices had stopped completely.

🔧 **What we changed**

Two settings, adjusted directly on the live contracts. **No redeploy. No reset. Nobody lost their position or their progress.** After the last two nights, that mattered to us a great deal.

Within seconds of the second change, Matrix A rotation restarted on the affected pairs. Tier 2, Tier 3 and Tier 5 came back first, then Tier 1.

🚀 **What you should see**

Movement — gradual, not instant. If you've been stuck in Matrix A, you're now in a queue that's actually advancing rather than frozen.

Each rotation moves everyone in that matrix up one seat, so depending on where you're sitting you should cross within hours rather than never. We're watching the counters continuously.

---

✅ **Also shipped today — straight from your reports**

Every one of these came from someone in this channel:

• **Error messages that actually say what happened.** "Transaction failed on-chain — RPC may be busy" was appearing when you'd simply run out of USDC. It now tells you which it is, with the real figures. *(reported by several of you across three days)*

• **Two balances, clearly separated.** 💡 Automatic re-entry and automatic upgrade can only spend the balance the system already holds for you — your crossing reserve plus earnings. **USDC sitting in your wallet cannot be used automatically**; it's only spent when you press Self Rescue or Upgrade yourself. So a full wallet does not stop you being parked. The panel now shows both figures separately and explains the difference. *(Sherwyn)*

• **Refresh button while parked.** Earnings arrive continuously, but the rescue button only re-checked on a full page reload — awkward on mobile. There's now a refresh control beside it, plus an automatic check every 30 seconds while you're parked. *(Kira, who suggested exactly this)*

• **A warning before turning auto re-entry off.** ⚠️ Switching it off means you *leave* each tier you cycle out of, permanently, rather than re-entering. Nothing warned you. Now it asks first. *(@Koach100)*

• **Your earnings breakdown now shows every tier.** If you sponsor people who upgrade, you earn commission in tiers you never joined yourself. Those tiers were being left out of the breakdown, so the total and the itemised list disagreed. Both now match. *(Kira)*

• **The two "reserved" amounts explained.** 🔓 Tap either one on your dashboard for a full breakdown — the **crossing reserve** (half of each tier's entry fee, held per seat toward its next crossing) and the **automation reserve** (earnings held so your auto-upgrade or re-entry can pay its own fee). Two different things that shared one word.

• **CNOVA vesting, mint by mint.** Every completed cycle mints its own batch with its own 180-day countdown — an older mint can be free while a newer one is still locked. You can now see each batch, its release date and its countdown. There's also an option to release a batch early for a penalty that shrinks to zero as its date approaches. Waiting always costs nothing. ⏳

---

💬 **About those self-rescue charges**

CryptoJan22 asked why the amounts vary so much, from under a dollar to over forty. Here's the honest answer, because it isn't a bug:

When you cycle out, your crossing reserve covers exactly **half** of your next entry. The other half comes from your earnings. If your earnings haven't reached that half — which is common for accounts without referrals — you're parked and asked to cover the difference. The amount varies because your earnings vary. Accounts with active referrals usually cover it automatically and never see the prompt.

📋 **Still open**

A few upgrade-path issues, the referral count display, and some interface fixes. All logged, none forgotten.

🐛 **Keep them coming**

Every fix above started with a member report. The bug bounty stands at **$1 per accepted find** — payments are **tallied and will be paid out once we go live**. If something looks wrong, report it, even if you think someone else already has.

— CryptoNova Team
