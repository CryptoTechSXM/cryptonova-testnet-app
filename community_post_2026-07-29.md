# Community post — 29 July 2026

*Telegram version with emoji, matching the 27 July format.*
*Reports first · our own find alongside them · V8.46 note · T10 celebration at the close.*

---

📢 **Today's fixes — every one from your reports**

Another big list, and it's yours. 🙏

• **Withdrawals that failed for no reason.** 💸 Sherwyn: *"Withdrawing $500 from
$514 available… transaction failed."* We were subtracting a flat **$10** as your
locked amount — but $10 is only Tier 1's entry fee. In higher tiers the real lock
is that tier's own fee minus your crossing reserve, which can run to thousands.
So we showed you money the contract was never going to release, and the
withdrawal reverted every time. The figure now comes straight from the contract.

⚠️ **You'll see your "Available USDC" drop if you hold higher tiers.** That's the
correction, not a loss — nothing left your account. The old number was simply too
high. *(Sherwyn)*

• **Four directs showing as one.** 👥 @Lavern_Gay caught this. Our code was
reading the referral field from the wrong place, so every lookup quietly fell back
to a slower method that only counts directs currently seated in the first few
tiers. Any direct who upgraded past T3, cycled out, or parked was invisible.
Hard-refresh and you should see all of them. *(@Lavern_Gay)*

• **Parked in several tiers? You now see all of them.** 📋 The dashboard showed
one parked position at a time and gave no hint the others existed. One account we
checked was parked in **eight** places while holding $10,756 in its wallet, with
nothing approved anywhere — every one of those was a single click from
re-entering, and there was no way to know. Each position now has its own numbers
and its own buttons. *(@Koach100, Maximum-71)*

• **The upgrade button that wasn't there.** ⬆️ If you were sitting in a full
Matrix A without having completed a cycle yet, the dashboard hid your Upgrade
button — even though the contract would have accepted it. It was applying two of
the contract's three eligibility rules. All three now. *(Cynthia Brown, @Koach100)*

• **"Gas limit too high" now explains itself.** ⛽ Honest and slightly annoying:
the cost of entering a tier depends on whether *your* entry is the one that fills
the matrix and sets off a chain of rotations. Same wallet, same upgrade, a minute
apart — one goes through, one is too big for the network to carry. **Retrying
genuinely works**, and the message now says so instead of telling you to
hard-refresh. *(Sherwyn, @Lavern_Gay, Maximum_71)*

• **Self Rescue tells you the number.** 🔑 Instead of "Transaction failed
on-chain", it now says exactly how much you're short, how much your reserve and
earnings already cover, and whether you need to approve or top up.
*(Sherwyn, CryptoJan22, @Koach100)*

• **Matrix page tier selector.** 🔄 Changing the tier didn't repaint the matrix
below it. Fixed. *(@Koach100)*

• **The Self Rescue button that wasn't there.** 👻 Someone approved their $15.50,
saw *"✅ USDC approved — now click Self Rescue"*… and had no Self Rescue button to
click. It was there the whole time — rendered at half opacity on a dark
background, which on a phone is invisible. We were dimming it whenever a
shortfall existed, and a shortfall doesn't disappear when you approve. So every
30-second refresh re-dimmed the button we'd just told you to press. Now it dims
only while the approval is genuinely outstanding, and the approve step disappears
once it's done. *(caught mid-session today)*

---

🔎 **One we found ourselves, while testing alongside you**

Worth flagging in the same breath, because it's the same kind of thing you've
been catching.

While tracing an account that looked odd, the dev team and I found that the
dashboard was offering a **"re-entry" to tiers a member had never joined** —
*"Your T8 Matrix A slot was cleared — Re-Entry Fee $2,500"*, with a working
button behind it.

**Why it happened:** when someone you referred joins a tier, your commission is
credited inside *that tier's* matrix — the one they entered, not the one you're
sitting in. So you accumulate balances in tiers you've never occupied. The
dashboard saw a balance there, saw you weren't seated, and concluded your slot
must have been cleared. It hadn't been. You were never there.

**Six members acted on it** before we caught it. Here's the straight version:

• **Nothing was stolen and nothing was lost.** The seats are real, they're still
yours, and the fee bought a genuine position in that tier.
• **We checked every seat in the system** — all 25,306, the full history — and
found exactly these six.
• **Tier milestones are unaffected.** These entries weren't counted toward the
pioneer gates, so the gates opened *later* than they strictly should have, never
earlier.

Fixed in the dashboard today, and locked at the contract level in V8.46. If you
were one of the six, we're contacting you directly.

---

💬 **Sherwyn's question — the best one we've had**

> *"My self rescue is $5.00 short and my account says there's $6.50 in T1. Is
> that $6.50 part of the reserve, or the $6.50 plus the $5 in reserves? If there
> are funds to cover the crossing, why do I need to self rescue?"*

**They're separate, and they add together.** Two things pay for a re-entry:

**1. Your crossing reserve** — always *exactly half* the tier's fee, funded by
your original entry and locked to that seat. At T1 that's $5.00; at T9, $2,500.

**2. Your earnings in that matrix** — pool income and referral commission built up
while you sat there.

Add them. Whatever's still missing is your shortfall, and that part comes from
your wallet.

So: $5.00 reserve + $3.40 earned = $8.40 toward a $10.00 re-entry. **$1.60 short.**
Your $6.50 isn't inside the $5.00 — it sits alongside it.

**Why doesn't it just take the money?** Because the reserve is deliberately only
half. The system never assumes you want back in — it holds half and asks you for
the rest. The amount varies because your earnings vary, which is why one rescue
costs $0.60 and another $41.

📌 **The part worth knowing:** your shortfall is payable from your wallet **right
now**. You don't have to wait for earnings to build. Approve the amount and press
Self Rescue. Several of you have been sitting parked with more than enough in your
wallet, because nothing told you that.

---

🛠️ **V8.46 — in the workshop now**

We're finetuning the next contract version, and it addresses the reported issues
at their root rather than at the surface:

• **Capping the rotation cascade**, so upgrades and rescues stop occasionally
exceeding what the network can carry — this is the "gas limit too high" one,
fixed properly
• **Locking tier entry to the proper route**
• **Preventing duplicate seats** — the cause behind "F8V8: already in matrix"
• **Tightening keeper permissions**

These are contract changes, so they ship together as one version rather than one
at a time. Every bug reported in this channel is on that list.

---

🏔️ **And to finish — Tier 10 is open. The full ladder is live.**

Overnight, Tier 9's Matrix A filled to 127 and rotated for the first time. That
crossing put members into T9 Matrix B, which is what unlocks T10 — and five
pioneers went through and opened the gate.

**All ten tiers now have members. Every tier has rotated at least once.** T10 went
from empty to 18 members in a few hours.

It opened the way it was meant to: on its own, by members reaching it. We could
have forced that gate open at any point this past week and chose not to — and it
turns out that mattered, because forcing it would have frozen the pioneer counter
at zero permanently and we'd never have known whether the milestone was real.

It's real. From a stalled Matrix A three days ago to a complete ten-tier ladder.

Thank you — Sherwyn, Kira, CryptoJan22, @Lavern_Gay, @Koach100, Maximum-71,
Cynthia Brown, @queensonnie. That withdrawal bug had been quietly failing for days
and nobody would have caught it without someone saying *"$500 of my $514 won't
come out."*

---

🐛 **One ask — please use the bug report link**

The invisible Self Rescue button above came to us in a chat message today. It was
a genuinely good find — a member did everything right, the approval went through,
and the button they were told to press was hidden. We fixed it within the hour.

**But it didn't come through the bug report form, so it wasn't logged and it
wasn't eligible for the bounty.** That's a shame, because it deserved one.

The form is at the bottom of every page — 🐛 *Found a bug? Report it here*. It
captures your wallet, your page and your wallet type automatically, which is
usually what lets us reproduce something in minutes instead of hours. Every
accepted report is tallied and paid out at go-live.

Chat is great for *"is anyone else seeing this?"* 💬 — the form is what gets it
fixed and gets you paid. If you've already flagged something in chat and it never
got a form entry, send it through now and we'll count it.

Keep them coming. 🐛🚀
