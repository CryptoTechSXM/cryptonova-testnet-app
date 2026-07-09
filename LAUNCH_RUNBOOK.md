# CryptoNova July 19 Launch Runbook

> Last updated: 2026-07-05  
> Contract: V8.31 (deployed on Base Sepolia for testnet dry-run; mainnet deploy T-minus ~7 days)

---

## PHASE 1 — Pre-Deploy (T-7 days, ~July 12)

### Contract deploy checklist
These must be done BEFORE July 19 — ideally July 12 to give a week of soak time.

- [ ] Run full test suite: `npx hardhat test` — must see 173/173 pass
- [ ] Run predeploy_check.js: `npx hardhat run scripts/predeploy_check.js --network baseSepolia` — 91/91 checks
- [ ] Disable ALL 7 Windows Task Scheduler keepers before deploy (`schtasks /Change /TN "\CryptoNova-*" /DISABLE`)
- [ ] Verify deployer key = `0x5EaEfA3` (clean EOA, not EIP-7702 delegated)
- [ ] Verify ADDRESSES_FILE in `.env` points to correct version file
- [ ] Run deploy: `npx hardhat run scripts/deploy_v8.js --network baseSepolia`
- [ ] **IMMEDIATELY commit deployed_addresses_vX_XX.json to git** (never lose addresses again)
- [ ] Run setTierMatrices for all tiers (registerTier alone is not enough)
- [ ] Register new Chainlink upkeep for MatrixKeeper
- [ ] Update ADDRESSES_FILE in `.env` → new version
- [ ] Run update_addrs.py to update all HTML files
- [ ] Run truncation check: `tail -5 index.html` → must end `</body></html>`
- [ ] Re-enable keepers after frontend is updated and deployed

### Frontend push checklist (every deploy)
```
Stage 1: git push origin admin
Stage 2: tail -5 index.html  ← MUST see </body></html> before continuing
Stage 3: git push origin admin:preview --force   ← STOP, show QA team
Stage 4: git push origin admin:main --force      ← STOP, wait for leader sign-off
```

**If Vercel ignores force-push:** `git commit --allow-empty -m "trigger deploy"` then push again.

---

## PHASE 2 — Pre-Launch Day (July 18 evening)

### System health verification
- [ ] Run `node scripts/monitor_v8.js` — check Telegram report looks clean
- [ ] Check SF balance: `npx hardhat run scripts/sf_topup_t1.js --network baseSepolia` dry-run
- [ ] Top up SF if < $200: `npx hardhat run scripts/sf_topup_t1.js --network baseSepolia`
- [ ] Verify keeper is running: check Task Scheduler `\CryptoNova-Rescue` last run time
- [ ] Confirm Chainlink upkeep has LINK balance (check upkeep page on automation.chain.link)
- [ ] Verify admin.crypto-nova.app loads and wallet connects (hard refresh first)
- [ ] Confirm Telegram bot responds to `/status` with V8.31 contract address

### Vercel env var checklist
These must be set in the CORRECT Vercel project:

| Project | Required Env Vars |
|---|---|
| cryptonova-testnet-app | TELEGRAM_QA_BOT_TOKEN, ANTHROPIC_API_KEY, BASE_SEPOLIA_RPC, FAUCET_PRIVATE_KEY, GITHUB_TOKEN, BUG_REPORT_PASSWORD |
| cryptonova-preview | (same as above) |
| cryptonova-main | TELEGRAM_QA_BOT_TOKEN, ANTHROPIC_API_KEY, BASE_RPC (mainnet), GITHUB_TOKEN, BUG_REPORT_PASSWORD, GAS_GIFT_PRIVATE_KEY |

**Never delete a Vercel project** — all env vars, domains, and settings are wiped permanently with no undo.

---

## PHASE 3 — Launch Day (July 19)

### Opening sequence (9am EST)
1. Hard refresh admin.crypto-nova.app — verify everything loads clean
2. Open gates in this order:
   - ea.cryptonova.ai (coupon-only) — opens 9am EST
   - cryptonova.ai (open registration) — opens 12pm EST
3. Monitor Telegram bot for early member questions
4. Keep PowerShell open with `drip_fill.ps1` ready as backup in case keepers lag
5. Watch `\CryptoNova-Rescue` task — should auto-trigger within 5 min of first parked member

### Day-of monitoring cadence
- Every 30 min: Check Telegram for member questions
- Every 1 hr: Run `node scripts/monitor_v8.js` manually if automated report missed
- Every 2 hr: Check SF balance via `sf_diag.js`
- Flag for attention: Any "ALERT" line in monitor report, any keeper failure in Task Scheduler

### Member-facing communications
- Leaders with referral links go live day 1
- Coupons active day 1 (coupon issuance costs $10 USDC → covers new member's entry fee)
- Testnet members who asked: point them to the gas gift flow for ETH, USDC faucet for first $10

---

## PHASE 4 — Rollback Plan

### If contract has a critical bug post-launch
1. Do NOT delete Vercel projects
2. Disable keepers immediately (Task Scheduler)
3. Update frontend to show "Maintenance — back shortly" banner
4. Fix contract, deploy new version, update addresses via update_addrs.py
5. Resume from Stage 1 of frontend push checklist

### If frontend is broken (spinners frozen)
1. Run: `tail -5 index.html` — if not `</body></html>`, file is truncated
2. Restore from git: `git show HEAD:index.html > index.html.new && mv index.html.new index.html`
3. Run truncation check again, then push

### If Vercel deploy is stuck
1. `git commit --allow-empty -m "trigger deploy"` and push
2. Check Vercel build logs for error
3. Never force-push to main without verifying preview first

---

## PHASE 5 — Known Issues at Launch (document these for members)

| Issue | Status | Workaround |
|---|---|---|
| Crossing reserve ($5) locked during active matrix | By design — unlocks at cycle completion | Wait for your matrix to cycle |
| Pre-V8.31 coupon members can't set Auto-Reentry | V8.32 fix (Aug 19) | Contact admin to update options manually |
| Member ID can gap slightly with coupon registrations | Known V8.30 side-effect, fixed in V8.31 | Cosmetic only — earnings not affected |
| Register page shows "already registered" after joining | UI bug — needs page reload | Hard refresh the page |
| Position >127 display confusing members | Members see totalJoined, not BFS position | FAQ explains this |

---

## Quick-Reference: Key Addresses & Files (V8.31)

| Item | Value |
|---|---|
| Contract version | V8.31 |
| Addresses file | `deployed_addresses_v8_31.json` |
| TierRouter | `0x3A569619f0FB2A0ef48d7eDB1BFeA34AeF35512c` |
| CNOVA Token | `0x8e81Ea3fE21DfFe30804cB46bE8543bD32CeC626` |
| CNOVA Treasury | `0x3980ed891B29d8745E6e116B8e010ac74701Da6f` |
| CouponRegistry | `0x20b66F6fb4554d0CD283590d747c5474d2923971` |
| Deployer EOA | `0x5EaEfA3...` (clean, non-delegated) |
| Working branch | `admin` |
| Admin frontend | https://admin.crypto-nova.app |
| Testnet QA | https://early.crypto-nova.app |
| Monitor script | `scripts/monitor_v8.js` |
| SF top-up | `npx hardhat run scripts/sf_topup_t1.js --network baseSepolia` |

---

## PowerShell Rules (always)

- **NEVER chain commands with `&&`** — one command at a time, wait for output
- **NEVER put keys/credentials in PowerShell commands** — all secrets in `.env`
- **NEVER delete a Vercel project** — no undo, permanent data loss

## Git Lock Recovery

If `git add` fails with "index.lock: File exists":
```powershell
Remove-Item "C:\CryptoNova-Testnet-App\.git\index.lock" -Force
Remove-Item "C:\CryptoNova-Testnet-App\.git\HEAD.lock" -Force
```
