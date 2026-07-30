# Community post — 29 July 2026, evening

*Telegram version with emoji, matching the 27/28/29 format.*
*Full disclosure of the balance bug up front · the action members must take ·
what closed today · bounties · no deploy date promised.*

---

🌙 **End of day — and one thing you need to know before you upgrade**

Long day. Every open ticket is now closed — **zero open, zero pending** — and
we'll get to that list. But one item goes first, because it affects what you do
next.

---

🛑 **Withdraw before you upgrade. Please read this one.**

This afternoon a wrong number on my own dashboard turned into the most serious
bug we have found on this testnet. Here it is in full.

**What happens.** When someone you referred enters a tier, your commission is
credited **inside that tier's matrix** — even if you have never joined that tier
yourself. That is normal and correct; the money is really yours and you can
withdraw it.

The problem is what happens if you then **enter that same tier**. The contract
checks a flag that means *"has this member ever taken a seat here?"*, sees "no",
and builds your record from scratch. Your commission balance in that tier is
overwritten with **zero**. Same for your earnings total, your withdrawal history
and your crossing reserve.

**So: if you hold commission in a tier you have not joined, and you join it, that
balance is deleted.** The USDC stays inside the matrix — it just stops being
yours.

**Who this can affect:** anyone whose referral went higher up the tiers than they
have. That is a lot of you, and most of the leaders.

**What to do until the fix is deployed — withdraw first, then upgrade.** 💸 Money
that is already in your wallet cannot be touched by this. Withdraw, then upgrade,
and you are completely safe.

**How we found it, honestly:** I withdrew $1,000 twice and noticed Total
Withdrawn was wrong. It read $1,947.50 instead of $2,000. My wallet had received
$1,970.00 — exactly $2,000 minus the 1.5% withdrawal fee — so the money was all
there and the *record* was short by $52.50. Chasing that $52.50 through sixteen
payouts found one tier where I had withdrawn commission, entered the tier two
hours later, and had the record wiped. **I lost only the history, because I had
already taken the money out.** Had I entered that tier first, the $52.50 itself
would have been gone.

**Status:** fixed in code, tested in both directions — the tests fail on the
current contract and pass on the fix, and all 420 of our contract tests pass. It
is **not deployed yet**. It goes out with V8.46.

**Nobody has lost funds to this that we can find**, and no member is owed
anything. We are building a scan to find every account currently holding
commission in a tier they have not joined, so we can tell you individually rather
than leaving you to guess.

I would rather tell you about this tonight and have you ask hard questions than
have one person lose a balance tomorrow that we already knew about. 🙏

---

✅ **43 reports closed — and 10 still open**

We went through the whole tracker tonight. **43 closed, 10 still open**, and I am
listing the open ones further down rather than rounding them away. Here is the
honest breakdown of the closed ones, because "closed" does not always mean "we
fixed a bug".

**Real bugs, fixed and live** 🔧

• **The referral count.** @queensonnie and @Lavern_Gay were both right. Our code
read the referrer from the wrong part of the data, so it silently fell back to a
method that only counts directs **currently seated** in the lowest tiers. Anyone
who upgraded, cycled out or parked was invisible. Four directs showed as one.
Fixed — hard-refresh and count again.

• **Only one parked position visible.** The dashboard showed one at a time with
no hint the others existed. One account was parked in **five** places. Every
position now has its own figures and buttons. *(@Koach100, Maximum-71,
CryptoJan22)*

• **Total Withdrawn and Total Earned were too low.** Any tier you had drained to
zero dropped out of the totals — so claiming your money removed the record of the
claim. **These numbers will go UP when you refresh.** That is the correction, not
new money.

• **"Back to Dashboard" went to the home page.** 🔗 Sherwyn flagged this on the
26th and called it cosmetic. It was — the link pointed at the site root instead of
the dashboard tab. Fixed tonight. Small things get fixed too, and they still count
as finds.

• Plus the withdrawal lock, the missing Upgrade button, the invisible Self Rescue
button, the gas message and the matrix tier selector — all covered in this
morning's post and all live.

**Not bugs — but our fault for not saying so** 🔑

Most of the "Transaction failed on-chain" self-rescue reports were **funding
shortfalls**. The rescue needed more USDC than the wallet held or had approved,
and instead of saying that, we showed a generic failure and told you to
hard-refresh. Hard-refreshing could never have helped. That is on us.

The panel now tells you the exact amount you are short, what your reserve and
earnings already cover, and whether you need to approve or top up. If you are one
of these, you have a real number to work with now:

| | Short by |
|---|---|
| Sherwyn | $2.26 more USDC |
| Cynthia Brown | $7.93 — your wallet already covers it, just approve |
| @Koach100 | ~$21 across three positions |
| CryptoJan22 | T3.1 MatA ready now; MatB short $7.68 |
| Maximum-71 | $1,408.73 across five positions |
| Maximum_71 | $288.37 + $1,006.97, wallet empty |

Nothing is owed and no position is lost. Test funds are coming this week.

**Working as designed** ⚙️

CryptoJan22 asked why self-rescue amounts swing from $0.60 to $41.00. That is the
funding rule, not a fault: your crossing reserve pre-funds **exactly half** of
your next entry fee, and the other half has to come from earnings. The shortfall
is simply whatever you have not earned yet. Your point that all the charges
should be shown together was fair, and that part is fixed.

---

📋 **Still open — 10 items, named**

Not everything is fixed and I would rather you see the list than wonder.

**Waiting on the V8.46 deploy** — diagnosed, written, tested, not yet live:

• The commission-balance bug above.
• **Rescue loans that never repay.** Sherwyn's $1.68 that would not clear no
matter how many times he rotated. The debt belongs to a *specific* matrix and only
clears from earnings inside that same matrix — so once you have moved on, nothing
can pay it. The strange part: on one account the money to clear the debt was
sitting in the very same tier. A one-line change makes a withdrawal settle it.

**Still being diagnosed** — I am not going to pretend I know the cause yet:

• **"Auto-upgrade did not fire even though I had earned enough."** Reported on the
call for June's account — $0.25 available against $88.98 earned. Those are two
different measurements sitting next to each other and I suspect that is the whole
story, but I need the wallet address to prove it. **June, please send it.**
• **A T2 upgrade behaving as if it needs funds already in T2.**
• **Accounts with several tiers enabled graduating when they should re-enter**, and
others cycling over and over without graduating.
• **Double re-entry appearing to block graduation entirely.**
• **@Koach100's T3 sitting at 0 cycles** while every other tier cycled, position
#4. This one has been open since the 27th without a proper answer — that is on us,
and it is next on the list.

**Frontend work, accepted and queued:**

• **Upgrade controls on the Registration page**, not only the Dashboard. *(Kira)*
• **The tiers page is ambiguous** and new pairs should show their count. *(Kira)*
Kira also suggested raising the Tier 1 entry numbers to 400–500 in that same
report — **that part is done**, and it is why T1 stopped stalling.
• **A completed rescue vanishes instead of confirming.** The panel just disappears,
which looks identical to a button that never worked. *(CryptoJan22)*

---

🏆 **Bounties**

**13 accepted finds** so far. Sherwyn 6, Kira 3, CryptoJan22 2, @Lavern_Gay 2.
Tallied and paid at go-live.

⚠️ **One ask: use the bug report form.** 🐛 Reports that come in through chat do
not get a ticket, a reply, or a bounty — and we have already lost at least one
good find that way. The form is linked at the bottom of every page. It takes a
minute and it puts your name on the record.

---

🔭 **What's next**

V8.46 carries the balance fix plus a keeper permission fix, and several more
items are still being built. **We do not have a deploy date and I am not going to
invent one.** The date mentioned on the call was tentative. It goes out when it is
ready and not before — tonight is a decent example of why. Something that looked
like a cosmetic display glitch this afternoon turned out to be the one bug in the
system that can delete a member's balance, and we only saw it because we fixed the
display first.

We reached **Tier 10** this week, organically, with the gate opening on its own
the way every tier before it did. 🚀 That still stands, and it is worth
celebrating.

Thank you for reporting things properly, for chasing them when we got it wrong,
and for being patient while we take the machine apart. 🙏

**Withdraw before you upgrade.** Everything else can wait until morning.
