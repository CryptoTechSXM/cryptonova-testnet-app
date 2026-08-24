# 🔑 Self Rescue — what your wallet is actually being asked for

Hey team 👋

Short post, important one. A few of you pressed **Self Rescue** this week and came back to me with the same two questions. Both have good answers. Both are now written into the app itself, on the parked panel, right above your positions — because my rule is that the site says it before I do. Here it is in plain words too.

---

## 💰 Why the approval is bigger than the amount you owe

When you press Self Rescue, your wallet pops up asking to approve the **full entry fee** for that tier — $10 at T1, $25 at T2, $50 at T3.

**Only your shortfall is taken.** If you are $1.57 short, $1.57 leaves your wallet. The rest stays approved and unspent. The line under the button tells you the exact figure before you sign.

So why not just approve the exact shortfall? Because your shortfall **moves** ⏱️. Your earnings keep landing while you sit parked, so the gap is a live number — and one of our members approved $11.88 for a gap that had grown to $12.50 by the time they pressed the button. Stuck, 62 cents short of their own rescue, through no fault of theirs. Approving the full fee means that can never happen to you 🛡️

---

## 🔄 Why a tier can ask you again right after you rescued it

This is the one that looks alarming, so read this part twice 👀

Every tier is a **pair** — Matrix A and Matrix B — and the figure‑8 moves you between them. So you clear **T1 Matrix B**, the system seats you, moves you along to the other half… and if your in‑matrix balance doesn't cover that entry either, **T1 Matrix A** turns up parked. Minutes later. Same tier number on your screen.

That is **a new seat. It is not a second charge for the one you just cleared.**

And I didn't want you to take my word for it, so we went and read the chain 🔍. We pulled every USDC transfer for two wallets across five rescues and checked what was left sitting on each approval:

| You approved | Still unspent afterwards | Actually taken |
|---|---|---|
| $10.00 | $8.939645 | **$1.060355** |
| $25.00 | $22.373477 | **$2.626523** |
| $50.00 | $44.693798 | **$5.306202** |

Every single one is **exactly one shortfall** — to the last decimal. If anything had been pulled twice, every number in that right-hand column would be $2–$5 bigger and your leftover approval would be that much smaller. Five rescues, five exact matches, on chain, in public.

**Nobody was double charged.** ✅ And if you did click a few times in frustration — that's fine, the contract refuses a rescue on a position that's already cleared.

---

## 🧯 What we fixed this week — all of it from you testing it

- **The Self Rescue button disappeared** for anyone who cleared down to their last parked position. The status line said *"Now click Self Rescue"* and there was no button on the screen. Only a full page reload brought it back. Fixed ✅
- **Fast clicks were sending more than one transaction.** The buttons on the position cards were never being disabled while your wallet was open, and the background refresh could swap the button out from under you mid‑signature. Now it's one action at a time, and extra clicks get a polite *"still working on your last request — check your wallet."* Fixed ✅
- And honestly — **my first fix for the first bug leaked a second button onto the screen** for anyone with two parked positions, so some of you were clicking a small banner that did nothing while the big one at the bottom worked fine. Caught and fixed. Three goes at one screen 😅

We are in building phase, and this is exactly what the phase is for. I'd rather tell you all three than just the two that make us look good.

---

## 📌 Quick reminders while you're parked

- **Self Rescue** — you pay the gap from your own wallet. No loan, nothing owed back.
- **Copay Rescue** — the Stability Fund puts in only the gap. That one **is a repayable advance**: it stays on your account until it's cleared, and it repays itself automatically out of your future earnings.
- **Or do nothing at all** — if your *in‑matrix* balance already covers the fee, the system re‑enters you **free, within minutes**. If it falls short, then after the **24‑hour grace period** the system re‑enters you automatically with a loan for the gap. (That window is a testnet setting — on mainnet you'll get **48 hours** to act on your own terms before the fund steps in.)

You never get left behind 💪 — but the sooner you act, the sooner you're earning again.

---

## 🐛 $1 per accepted bug — always on

Every accepted bug report earns **$1**, credited at triage. The report button sits at the bottom of every page. You do **not** need to be sure it's a bug — if a number looks wrong, if a button doesn't do what it says, tell us. Every fix in the list above started as somebody saying "this looks off." 🙏

— CryptoNova
