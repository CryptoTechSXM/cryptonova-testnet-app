# Bug report replies — 2026-07-29

All figures read from chain at ~13:00 UTC via `ticket_triage.js`. Balances move,
so re-run before sending if this sits for a few hours:

```
ADDR=0x… node ticket_triage.js
```

**Owner decision needed before sending Group D.** Everything else is ready.

---

## The one thing to say first (post this before the individual replies)

> **Two balances, not one.** Your *in-matrix* balance (crossing reserve +
> earnings the system holds for you) is what automatic re-entry and automatic
> upgrade spend. Your *wallet* USDC is separate — it is only ever used when you
> press Self Rescue or Upgrade yourself. A full wallet does not stop you being
> parked, and that is working as designed.
>
> **Re-entry costs the full tier fee.** Your crossing reserve always covers
> exactly half of it. The other half comes from earnings while you sit in that
> seat. If those earnings have not built up yet, you park — that is the designed
> path, not a fault.
>
> **The shortfall is payable from your wallet, today.** You do not have to wait.
> Approve the shortfall amount **to that matrix** and press Self Rescue.
> Important: approve the **matrix**, not TierRouter — the dashboard's Approve
> button already targets the right one.
>
> **If you are parked in more than one place**, the dashboard now shows every
> position with its own numbers and its own buttons. It used to show only one.

---

## Group A — already resolved, just needs a refresh

Their pair rotated overnight and they are seated and healthy. Nothing to do.

| Reporter | Wallet | State now |
|---|---|---|
| CryptoJan22 | `0x5fc30b09` | seated T1.2 MatA |
| Cynthia Brown | `0x7b0ad58f` | seated T1.3 MatB |
| @Lavern_Gay | `0x145805e8` | seated in all nine tiers, T9 |
| (reporter) | `0x70569791` | seated T1.1 MatB |

> Good news — this one sorted itself out when your matrix rotated. You are
> seated and everything is healthy. Hard-refresh with Ctrl+Shift+R and it should
> look right. Sorry for the noise, and thank you for reporting it.

---

## Group B — has the money, needs one approval

The single most common case. They are not short of funds; they have not approved
the shortfall to that matrix.

| Reporter | Wallet | Parked in | Approve | Wallet holds |
|---|---|---|---|---|
| Sherwyn | `0x50c8426e` | T1.1 MatA | **$1.60** | $596.09 |
| CryptoJan22 | `0x3289a65c` | T3.1 MatB | **$7.68** | $29,985 |
| Cynthia Brown | `0xb9e6aed9` | T2.1 MatB | **$7.93** | $27.20 |
| @Koach100 | `0xd4c441c7` | T8.1 MatA | **$313.56** | $29,996 |
| @Lavern_Gay | `0x832b95a5` | T1.1 / T2.1 / T3.1 / T8.1 / T9.1 MatB+A | **$5.00 / $7.49 / $5.22 / $267.17 / $382.39** | $24,987 |
| (test) | `0x558E7848` | eight positions | **$679.88 total** | $10,756 |

> You have more than enough — the only thing missing is the approval. Re-entry
> costs the full tier fee; your crossing reserve covers half and your earnings
> cover most of the rest, so you only pay the difference from your wallet. Open
> your dashboard, press **Approve $X**, then **Self Rescue**. If you are parked
> in several tiers you will now see each one listed separately with its own
> amount — they are approved and rescued one at a time.

**Special case — CryptoJan22 `0x3289a65c` T3.1 MatA:** already approved $23.75,
estimate 9,982,980 gas, will succeed. Tell them to press Self Rescue now.

---

## Group C — genuinely short, needs a top-up

| Reporter | Wallet | Parked | Short by | Wallet |
|---|---|---|---|---|
| Sherwyn | `0x1e8e2dcf` | T2.1 MatA | **$2.26** more needed | $9.61 |
| @Koach100 | `0x5d6ca88a` | T2.1 / T3.1 / T4.1 | $1.46 / $5.49 / $13.97 | $2.02 |
| Maximum-71 | `0x5f3f8152` | five positions | **$1,408.73 total** | $0.00 |
| Maximum_71 | `0x4cf7f43a` | T8.1 / T9.1 | $288.37 / $1,006.97 | $0.00 |

> You are close. Re-entry needs the full tier fee — your reserve covers half and
> your earnings have covered part of the rest, so the remaining difference comes
> from your wallet. You need about **$X** more in the wallet, then approve that
> amount and press Self Rescue. On testnet, ask for a top-up and we will send it.

---

## Group D — OWNER DECISION NEEDED

These members were charged real entry fees for seats our own dashboard
mis-offered. The panel said *"Your T{n} Matrix A slot was cleared — Re-Entry Fee
$X"* for tiers they had **never joined**. It appeared because referral commission
is credited into the matrix where their *direct* entered, and the panel read a
balance there as evidence of a lost slot. The button behind it worked, so the
entry went through and was charged.

**6 transactions, 8 seats, ~$20,025**, blocks 44752308–44781263:

| Member | Seat bought | Fee |
|---|---|---|
| `0x1e8e2dcf` (Sherwyn) | T2.1 MatA | $25 |
| `0x536685f0` | T8.1 MatA | $2,500 |
| `0xd6fbdf7a` | T8.1 MatA | $2,500 |
| `0x0af85760` | T8.1 MatA | $2,500 |
| `0x1acc0225` | T8.1 MatA | $2,500 |
| `0x84a4d33a` | T10.1 MatA | $10,000 |
| `0x5816e46a`, `0x0f509981` (Kira) | crossed into MatB by the resulting rotation | — |

**What is true and worth stating plainly:** nothing was stolen, the seats are
real and still theirs, the money bought a genuine position, and the whale gates
were not compromised (uncounted entries make a gate open *late*, never early).
The fault is that they were invited to buy something they did not need and would
not have chosen.

**Decision:** testnet funds, so there is no financial loss — but do you want to
(a) say nothing individually and cover it in the general notice, (b) tell those
six specifically what happened, or (c) reimburse the testnet USDC as a gesture?
I would lean to (b): they are our most active testers and finding this is exactly
what we asked them to do.

Fixed in the dashboard (commit `77c26ed`). The contract-side lock is item 2 in
`V8_46_PLAN.md`.

---

## Individually answered

### Sherwyn — "$5.00 shortfall but my account says $6.50 in T1, is the $6.50 part of the reserve or plus it?"

The best question anyone has asked. **They are separate and they are added
together.**

> Re-entry costs the full tier fee. Two things pay it:
>
> - **Crossing reserve** — always exactly half the fee, funded by your original
>   entry and locked to that seat. At T1 that is $5.00.
> - **Your earnings in that matrix** — pool income and referral commission that
>   built up while you sat there.
>
> They add: reserve + earnings. Whatever is still missing is your shortfall, and
> that part comes from your wallet.
>
> So with $5.00 reserve and $3.40 earned, you have $8.40 of a $10.00 re-entry —
> $1.60 short. Your $6.50 is not inside the $5.00; it sits alongside it.
>
> Why does it not just take the money? Because the reserve is deliberately only
> half. The system never assumes you want to re-enter — it holds half and asks
> you for the rest.

### Sherwyn — "Withdrawing $500 from $514 available, transaction failed"

> Our fault, now fixed. The site was subtracting a flat **$10** as your locked
> amount, but $10 is only T1's entry fee — the real lock is that tier's own fee
> minus your crossing reserve, which at higher tiers is much larger. So we showed
> you a number the contract was never going to release, and the withdrawal
> reverted. The figure on your dashboard now comes straight from the contract.
> You will see "Available USDC" drop for higher tiers — that is the correction,
> not a loss.

### @Lavern_Gay — "Four directs showing as one"

> Fixed. Our event-reading code had the referral field in the wrong place, so
> every lookup fell back to a slower method that only counts directs currently
> seated in the first few tiers. Any direct who upgraded past T3, cycled out, or
> parked was invisible. Hard-refresh and it should show all four.

### @Koach100 — "Matrix page tier selector does not change the view"

> Fixed — the selector was not repainting the matrix beneath it. Hard-refresh and
> try again; please tell us if any tier still looks wrong.

### Kira — "Upgrade option only works from the dashboard, not the registration page"

> Confirmed, still open. The upgrade controls only exist on the dashboard. We are
> adding them to the registration page. For now, upgrade from the dashboard.

### @queensonnie — manual placement / referral count

> Still investigating. The referral-count fix above may cover it — please
> hard-refresh and tell us whether the number is right now. If not, we will look
> at your specific placement.

---

## Also fixed since yesterday, worth mentioning in the general notice

- Members seated in a full matrix could not see the **Upgrade** button at all —
  the dashboard was applying two of the contract's three eligibility rules
- **"Gas limit too high"** now explains itself and says to retry, because the
  cost genuinely varies depending on whether your entry triggers a rotation
- **Self Rescue** now names the shortfall in dollars instead of failing with
  "Transaction failed on-chain — hard-refresh"
- **Parked in several tiers** now shows every position, not just one
