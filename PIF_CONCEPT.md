# PIF — Pay It Forward (mainnet growth concept)

Owner's idea, captured 2026-08-26 (V8.50 community deploy day, ~1h before cutover).
Status: CONCEPT — build after V8.50 launch settles. Nothing here is committed to code yet.

## The idea, in the owner's words (paraphrased faithfully)

Word of mouth is the advertising. Existing members generate coupons and GIFT them to
people who cannot afford to enter and would never have tried crypto. A page for
potential members to raise their hand; members with coupons match to them. No
repayment stipulation — the only ask is to pay it forward: when you can, give someone
else the opportunity you got. Call it Pay It Forward — "PIF".

## Why this fits what is already deployed (V8.50, live since 2026-08-26)

- **CouponRegistry is on-chain and wired**: default coupon = $10 USDC (a T1 entry),
  T1–T10 MatA authorized to redeem. Gifting an entry is a solved mechanic.
- **Gas-gift wallet is wired** (`setGasGiftWallet` in the deploy): the classic
  "newcomer can't pay gas for tx #1" wall already has an answer.
- **The PIF cohort is MEASURED, not hoped**: PHASE G.5 deliberately ran a population
  that could not self-fund (`-SelfRescueRate 0.1`). Every one of them was carried —
  70/70 fund-backed rescues, $157.39 advanced (~$2.25/carried crossing), repaid from
  earnings by design. A member who arrives with $0 beyond their gifted entry is
  exactly this cohort. The system's answer is yes, at a known price.
- Word-of-mouth + sponsor-line seating is what the figure-8 is built around.

## The shape (proposal to refine)

1. **pif.html** — two doors:
   - "I want in but can't afford it": short form — wallet (or guided wallet
     creation), a sentence on why. Lands on a waitlist.
   - "I want to gift an entry": member connects, generates/funds a $10 coupon
     (CouponRegistry), picks from the waitlist (or auto-match oldest-first).
2. **Redemption**: recipient registers with the coupon code — coupon covers the fee,
   gas gift covers the transaction. They seat in the gifter's line (sponsor = gifter).
3. **The pledge, not a debt**: at redemption the recipient accepts one line — "when my
   seats start earning, I'll pay one entry forward." Soft, public, no enforcement.
4. **PIF chain counter**: profile shows "gifted by 0xAB…12 · has gifted 3 onward".
   Culture as the enforcement mechanism.

## Design decisions the owner holds (to decide before building)

- **Funding source**: gifter's own $10 (honest, self-limiting, RECOMMENDED to start)
  vs. a CW/treasury-subsidized pool (scales, but invites farming and needs caps).
- **Self-dealing cap**: a gifter's coupon seats the recipient in the gifter's line, so
  chain pay partially recycles to the gifter. Feature if capped (e.g., ONE active PIF
  gift per member, next unlocks when the recipient's seat completes a cycle), exploit
  if uncapped (sock-puppet farming of chain pay with a $10 discount loop).
  ⛔ STATUS 2026-08-28: **THIS CAP WAS NEVER IMPLEMENTED.** CouponRegistry.issueCoupon
  has no per-issuer mapping at all (CouponRegistry.sol:117-119), and index.html:5124
  issues through the same function with no gate — pif.html merely hid its own form and
  printed a hardcoded "1 active", which is how the owner came to hold two. The false
  copy was removed rather than the cap added (owner, 2026-08-28). Re-opening it is a
  CONTRACT change. Measured input for that decision: the cash loop is NOT profitable —
  a sponsor at L1 earns 500bps + 270bps = $0.77 on a $10 entry they funded with $10,
  i.e. -$9.23 per sock puppet. The open question is non-cash: sponsoring inflates
  directCount, which the V8.50 sponsorship gate reads. Whether a farmed direct is worth
  $9.23 has NOT been measured — see [[cryptonova-gate]] before deciding.
- **Waitlist moderation**: open queue vs. owner-approved vs. referral-of-a-referral.
  Testnet can run open; mainnet likely needs light friction (one per person signals).
- **SF exposure budget**: PIF members lean on the fund early (measured above). Decide
  what share of SF headroom PIF regs may consume before the tap tightens — the
  insolvency floor (PARAM 59 = 5000) already evicts the never-earning tail, so the
  guardrail exists; the dial is how many enter per week.

## What it is NOT

- Not a loan program — no repayment tracking, no debt language. (House rule: rescue
  advances are "repayable advances"; PIF gifts are GIFTS. Keep the vocabularies apart.)
- Not a faucet — every entry is a real member in a real line, funded by a real person
  who chose them.

## Next steps (post-launch)

1. Owner decides the four dials above.
2. Session builds pif.html against the live CouponRegistry (testnet first, obviously).
3. Trial run with the community: 10 founding members each gift one entry, measure the
   cohort against G.5's baseline (rescue rate, fund draw, retention).
4. Community post announcing PIF — only once the page ships (house rule: the site
   says it before the owner does).
