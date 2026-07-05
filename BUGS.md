# CryptoNova — Issue Tracker

> Drop new issues here as members report them. Start a session with "check BUGS.md" and Claude will read this directly.
> Format: **[Page] — What happened / What was expected** + wallet type if relevant + consistent or intermittent

---

## Open Issues

### [2026-07-05] Bug Report Page — Admin pipeline test — verifying end-to-end bug report flow: …
- **Reporter:** Claude (Admin Test)
- **Page:** Bug Report Page
- **Wallet Type:** MetaMask
- **Wallet Address:** 0xb41a3cfb7e3125aa42f938ed9a8c6807b459617c
- **Frequency:** Consistent
- **What happened:** Admin pipeline test — verifying end-to-end bug report flow: password gate → form submission → GitHub BUGS.md write.
- **What was expected:** This report should appear in BUGS.md on the admin branch within seconds of submission, confirming the full pipeline (Vercel API → GitHub token → BUGS.md append) is working correctly before July 19 launch.
- **Notes:** TEST SUBMISSION — safe to close/archive. Triggered by admin to verify system integrity pre-launch.
- **Submitted:** Sun, 05 Jul 2026 19:37:11 GMT


### [2026-07-03] Dashboard (index.html) — This is the second time that I have entered T1A
The dashboar…
- **Reporter:** Dee1
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x299dcdddbe11ec3b4518cc5f47925fbb447bfd59
- **Frequency:** Consistent
- **What happened:** This is the second time that I have entered T1A
The dashboard show that I am 147 in the matrix and therevhas been no payments on the account since then
- **What was expected:** I should have been in the matrix between 1- 27 and received some payment for the cycle by now
- **Submitted:** Fri, 03 Jul 2026 09:09:23 GMT


### [2026-07-03] Dashboard (index.html) — This is the second time I have entered T1 A. The dashboard s…
- **Reporter:** Dee1
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x063793b17f5bf7040ee2924d58067887f6fa5256
- **Frequency:** Consistent
- **What happened:** This is the second time I have entered T1 A. The dashboard say that I am 146 in the que, there has been no earnings on the account since then
- **What was expected:** I should have been in the que between 1-127 and have receive some paymemta by now
- **Submitted:** Fri, 03 Jul 2026 09:00:33 GMT


### [2026-07-02] Dashboard (index.html) — My Member ID# is 444, whereas only 442 members have totally …
- **Reporter:** Kolawole Ola
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0xafa21bb205fc3294d7bc129897889b40ba8b155e
- **Frequency:** Consistent
- **What happened:** My Member ID# is 444, whereas only 442 members have totally registered as stated on the Home page.
- **What was expected:** My member ID should have not exceeded 442.
- **Submitted:** Thu, 02 Jul 2026 19:26:08 GMT


### [2026-07-02] Dashboard (index.html) — Firstly, when I registered with a coupon, on the Registratio…
- **Reporter:** Kolawole Ola
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0xafa21bb205fc3294d7bc129897889b40ba8b155e
- **Frequency:** Consistent
- **What happened:** Firstly, when I registered with a coupon, on the Registration tab, under "Your Balances", > You Pay > FREE &#127881; (That's the gibberish it displayed after "FREE".

After registering, on the Dashboard tab, my MM wallet keeps failing each time I try to enable Auto-Reentry or double reentry. It says this transaction will fail and it never goes through.
- **What was expected:** 1. only FREE should display after "You Pay"
2. The wallets should link without an error when confirming any transaction.
- **Submitted:** Thu, 02 Jul 2026 19:22:24 GMT


### [2026-07-02] Dashboard (index.html) — Auto entry and auto upgràde set up from registration of acco…
- **Reporter:** Dee1
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0xa56cfcde5d539f95c22d723c0ffca5fadf6b47f4
- **Frequency:** Consistent
- **What happened:** Auto entry and auto upgràde set up from registration of account. T1 Matrrix was not reentered  at the end of  T1 Matrix B cycle even though money was available. Only T2 matrix showing. It does not give option to restart T1
- **What was expected:** Tier 1 to be re entered
- **Notes:** Same in my other accounts
- **Submitted:** Thu, 02 Jul 2026 19:22:10 GMT


### [2026-07-02] Dashboard (index.html) — I have all auto reentry's disabled. I tried to withdraw the …
- **Reporter:** KolawoleOla
- **Page:** Dashboard (index.html)
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x5704e5f537069127a8a53e7c85d522264a0135ed
- **Frequency:** Consistent
- **What happened:** I have all auto reentry's disabled. I tried to withdraw the funds I have in the back office to my MM wallet, and the transaction failed, giving F8V8 error, that I need to keep funds in my active account. I assumed you mentioned that once I disable the entry options, it will cycle twice(which has occurred) , then it will comply with my option to disable the auto-reentry. I am also still far off from a cycle to matrixB. Does this mean that the system first keeps the funds to cycle before releasing the extras?
- **What was expected:** I should have been able to withdraw the funds (about $21) to my wallet without the system stopping me. I might decide not to continue with the cycle and be allowed to have access to my funds. My take.
- **Submitted:** Thu, 02 Jul 2026 19:06:29 GMT


---

## Template

```
### [YYYY-MM-DD] Short title
- **Page:** index / buy / governance / liquidity / status / comp / terms / faq
- **Wallet:** MetaMask / Rabby / Other
- **What happened:** ...
- **What was expected:** ...
- **Consistent or intermittent:** Consistent / Only sometimes
- **Notes:** (screenshot path, member address, anything else useful)
```

---

## Resolved Issues

| Date Reported | Date Fixed | Page | Summary | Commit |
|---------------|------------|------|---------|--------|
| 2026-07-02 | 2026-07-03 | All sub-pages | Nav link showed "📊 Dashboard" and went to index.html#dashboard; changed to "🏠 Home" → index.html across all 7 sub-pages | 0b9e3b8 |
| 2026-07-02 | 2026-07-03 | index.html | "FREE 🎉" showing as HTML entity &#127881; — fixed textContent → innerHTML on coupon You Pay display | pending |
| 2026-07-02 | 2026-07-03 | index.html | Withdrawal blocked error message too terse — expanded to explain crossing reserve and when funds unlock | pending |
| 2026-07-02 | 2026-07-03 | index.html | Double Reentry / Auto Reentry tooltips unclear — member confused why T1 not re-entered after upgrade to T2; tooltips now explain the distinction | pending |

## Notes on Open Issues

- **KolawoleOla withdrawal ($21)** — Contract-level block (crossing reserve). Member must wait for current matrix cycle to complete. V8.31 Task #63 will fix for members with automation disabled.
- **Dee1 auto-reentry failure** — Works as designed: auto-upgrade to T2 fired, T1 not re-entered (double reentry was not enabled). Not a bug.
- **Kolawole auto-reentry TX fails** — Coupon members bypass TierRouter globalJoined. Requires V8.31 deploy to fix.
- **Kolawole member ID 444 vs 442** — Known V8.30 coupon bypass side-effect. V8.31 fixes going forward; 2-member gap baked in on-chain.
- **Dee1 #146/#147 no earnings** — Base Sepolia RPC outage (SERVER_ERROR confirmed 2026-07-03 13:35 UTC) prevented keeper from running force-crosses. Not a code bug. Monitor and retry once RPC recovers.
