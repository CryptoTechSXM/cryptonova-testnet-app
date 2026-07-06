# CryptoNova — Issue Tracker

> Drop new issues here as members report them. Start a session with "check BUGS.md" and Claude will read this directly.
> Format: **[Page] — What happened / What was expected** + wallet type if relevant + consistent or intermittent

---

## Open Issues

### [2026-07-06] Coupon System — Suggestion: It would be good if after purchasing the coupon …
- **Reporter:** Sherwyn
- **Page:** Coupon System
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x7d3c94885d2022200934d4908bca7b47905bbcf6
- **Frequency:** Consistent
- **What happened:** Suggestion: It would be good if after purchasing the coupon and when you click the copy button to copy the link, to have an acknowledgement that says the link was actually copied...
- **What was expected:** To see acknowledgement of the copy..
- **Submitted:** Mon, 06 Jul 2026 20:14:17 GMT


### [2026-07-06] Coupon System — When trying to use coupon code this is the error: ❌ ❌ "", "f…
- **Reporter:** Sherwyn
- **Page:** Coupon System
- **Wallet Type:** MetaMask
- **Wallet Address:** 0x50c8426e34c14859dcbf361f80e9b5d3412780e0
- **Frequency:** Consistent
- **What happened:** When trying to use coupon code this is the error: ❌ ❌ "", "from": "0x50c8426E34C14859DcbF361f80E9b5D3412780E0", "to": "0x8c854e61E92999dE1741943C145b58Df7
- **What was expected:** To be registered..
- **Notes:** This seems to happen only when using the coupon codes... Didn't have this issue with other accounts as I used the referral link and wallet address... also happened in the previous version (V8.31)
- **Submitted:** Mon, 06 Jul 2026 20:10:08 GMT


*No open issues — ready for launch.*

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
| 2026-07-02 | 2026-07-05 | index.html | "FREE 🎉" showing as HTML entity &#127881; — fixed textContent → innerHTML on coupon You Pay display | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Withdrawal blocked error message too terse — expanded to explain crossing reserve and when funds unlock | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Double Reentry / Auto Reentry tooltips unclear — member confused why T1 not re-entered after upgrade to T2; tooltips now explain the distinction | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | KolawoleOla — withdrawal of ~$21 blocked. Works as designed: crossing reserve is locked while in an active matrix cycle to fund your next re-entry. Funds unlock on cycle completion. Error message improved. | ff76143 |
| 2026-07-02 | 2026-07-05 | index.html | Dee1 — T1 not re-entered after T2 upgrade. Works as designed: auto-upgrade to T2 fires when MatB crosses; T1 re-entry only happens if Double Reentry was enabled. Not a bug. | — |
| 2026-07-02 | 2026-07-05 | index.html | Kolawole — member ID 444 vs 442 member count. Known V8.30 coupon bypass side-effect — 2-member gap is baked on-chain. V8.31 fixes globalJoined for all new coupon registrations going forward. | V8.31 |
| 2026-07-02 | V8.32 (Aug 19) | index.html | Kolawole — Auto-Reentry TX fails after coupon registration. Root cause: pre-V8.31 coupon members have globalJoined=false in TierRouter → setMemberOptions reverts. Fix: setGlobalJoined() admin fn in V8.32 (Aug 19). | V8.32 |
| 2026-07-03 | 2026-07-05 | index.html | Dee1 (0x299d / 0x0637) — positions 146/147 in T1A MatB, no earnings. Root cause: Base Sepolia RPC outage (SERVER_ERROR confirmed 2026-07-03 13:35 UTC) prevented keeper from running force-crosses. Not a code bug. Keeper resumes when RPC recovers. | — |
