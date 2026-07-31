# CryptoNova July 19 Launch Runbook

> Last updated: 2026-07-09  
> Contract: V8.34 (live on Base Sepolia testnet; mainnet deploy target ~July 14–16)

---

## TIMELINE OVERVIEW

| Event | Date | Time |
|---|---|---|
| Testnet gate opens (leaders/testers) | **July 12, 2026** | **9:00 AM EDT** |
| Mainnet contract deploy | **~July 14–16, 2026** | — |
| Mainnet EA opens (coupon-only) | **July 19, 2026** | **9:00 AM EDT** |
| Mainnet public open (cryptonova.ai) | **July 19, 2026** | **12:00 PM EDT** |

---

## PHASE 1 — Pre-Deploy (target ~July 14–16)

### Before you deploy — critical checks

- [ ] Deployer key = **`0x5EaEfA3`** (clean EOA — NOT `0xCd0Af6`, which is EIP-7702 delegated and BANNED)
- [ ] Stop all 6 VPS keeper cron jobs before deploy (avoids keeper writes during deploy window)
  ```bash
  ssh -i C:\Users\CryptoTech\.ssh\do_keeper root@167.99.0.250
  crontab -e    # comment out all 6 CryptoNova lines
  ```
- [ ] Verify `ADDRESSES_FILE` in `.env` is pointing to the PREVIOUS version (not a stale path)
- [ ] Verify `PARKED_GRACE_SECS=172800` in `.env` for mainnet (48 hours — testnet uses 86400/24h)

### Contract deploy

- [ ] `npx hardhat compile --force`
- [ ] `npx hardhat test` — must see **205/205 pass** (or current count, 0 failing)
- [ ] `npx hardhat run scripts/predeploy_check.js --network baseSepolia` — 91/91 (testnet); update `--network base` for mainnet
- [ ] Update `hardhat.config.js` with mainnet RPC + chain ID 8453 before mainnet deploy
- [ ] Set USDC to real USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Base mainnet — NOT mock)
- [ ] **`npx hardhat run scripts/deploy_v8.js --network base`** ← ALWAYS `npx hardhat run`, NEVER `node`
  - Red flags if you see: deployer=0xf39Fd6e5, Network=hardhat, done in <2 min → you ran `node`, not `npx hardhat run`

### Immediately after deploy (do not skip)

- [ ] **Commit `deployed_addresses_vX_XX.json` to git immediately** — V8.29 was lost because this was skipped
- [ ] Run `setTierMatrices` for all 10 tiers — `registerTier` alone is not enough; `manualUpgrade` reverts without it
- [ ] Run `seed_w1.js` to place W1 at matrix position 1
- [ ] Set parked grace: `node scripts/set_parked_grace.js 172800` (mainnet = 48h)
- [ ] Register Chainlink Automation upkeep on mainnet registry and fund with LINK
- [ ] **Verify EVERY deployed contract on BaseScan** (`hardhat verify`; matrices need the `MatrixLogicLib` link) — an unverified contract is a top trigger for Blockaid's "malicious address/site" warning
- [ ] **Submit the domain + new contract addresses to Blockaid** at report.blockaid.io/mistake (verify contracts FIRST, then appeal) — clears the "you'll lose your assets to a scammer" banner across every Blockaid-powered wallet (MetaMask, Coinbase, Rainbow)

### Frontend update (post-deploy)

- [ ] Run `update_addrs.py` to replace all contract addresses across all HTML files
- [ ] Update `TIER_ROUTER` constant in `api/telegram-qa.js` to new mainnet address
- [ ] Update VPS keeper scripts with new mainnet addresses (edit `.env` on VPS)
- [ ] Truncation check: `tail -5 index.html` → must end `</body></html>`

### Frontend push checklist (every deploy — 3-stage mandatory)

```
Stage 1: git push origin admin
          ↓ verify: tail -5 index.html → </body></html>
Stage 2: git push origin admin:preview --force   ← STOP — show QA/leaders
Stage 3: git push origin admin:main --force      ← STOP — wait for leader sign-off
```

**NEVER push to `main` before `preview`. NEVER skip stages. NEVER push without explicit approval.**

If Vercel ignores force-push: `git commit --allow-empty -m "trigger deploy"` then push again.

## Timed launch-gate sequence (redeploy / relaunch)

The maintenance gate in `index.html` (~:502) is **host-based**: `admin.*` is always open (so testing is never gated); `early.*` counts down to `EARLY_MS` then shows the coupon bypass; main counts down to `MAIN_MS` then opens. One `index.html` serves all three — set both epoch-ms constants + the two pill labels and it's ready.

**Sequence (proven 2026-07-31 V8.46 redeploy):**
1. Push the cutover to **admin** → verify + register test accounts on the new contracts (admin bypasses the gate, so you test the real build ungated).
2. Take the live site offline at **midnight EDT**.
3. Gate **PREVIEW (early.)** to open **9:00 AM EDT** — set `EARLY_MS`.
4. Gate **MAIN** to open **10:00 AM EDT** — set `MAIN_MS`.
5. **Prep the gate in admin's index.html now, but do NOT push to preview/main until midnight.** At midnight: `git push origin admin:preview --force` then `git push origin admin:main --force`.

EDT = UTC-4 → 9 AM EDT = 13:00 UTC, 10 AM EDT = 14:00 UTC. Compute epoch-ms accordingly (e.g. Fri Jul 31 2026: EARLY_MS=1785502800000, MAIN_MS=1785506400000).


---

## PHASE 2 — Pre-Launch Day (July 18 evening)

### System health verification

- [ ] SSH to VPS: confirm all 6 keeper cron jobs are running and last-run times are recent
  ```
  ssh -i C:\Users\CryptoTech\.ssh\do_keeper root@167.99.0.250
  crontab -l
  ls -lt ~/keeper/logs/
  ```
- [ ] Run `node scripts/monitor_v8.js` — check Telegram report looks clean
- [ ] Check SF balance — minimum $500 buffer recommended at launch
  - If low: `npx hardhat run scripts/sf_topup_t1.js --network base`
- [ ] Confirm Chainlink upkeep has LINK balance (check automation.chain.link on mainnet)
- [ ] Hard refresh admin.cryptonova.ai — wallet connects, all stats load (not frozen)
- [ ] Confirm Telegram bot responds with V8.34 mainnet address when asked about contracts
- [ ] Send test channel pulse: `node ~/keeper/channel_pulse.js` on VPS — verify member count matches website

### Vercel env var checklist (mainnet project = cryptonova-mainnet-app)

| Var | Mainnet value |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Haiku — same key as testnet |
| `TELEGRAM_QA_BOT_TOKEN` | Same bot token (webhook will be re-registered to mainnet domain) |
| `BASE_RPC_URL` | Mainnet Base RPC (NOT Base Sepolia) |
| `GITHUB_TOKEN` | Contents R+W on cryptonova-testnet-app repo (bug reports) |
| `BUG_REPORT_PASSWORD` | Same as testnet |
| `FAUCET_PRIVATE_KEY` | Leave empty / remove for mainnet (faucet is testnet only) |
| `GAS_GIFT_PRIVATE_KEY` | Set on mainnet — funds new-member ETH gas gifts |

**✅ GITHUB_TOKEN updated 2026-07-09** — fine-grained PAT (CryptoNova-BugReport, no expiration, Contents R+W on cryptonova-testnet-app repo). Bug reports via crypto-nova.app/v8 are live.

**NEVER delete a Vercel project.** Wipes all env vars, domains, settings. Permanent — no undo.

---

## PHASE 3 — Launch Day (July 19)

### Opening sequence

1. Hard refresh admin.cryptonova.ai — verify everything loads clean, no frozen spinners
2. Open gates in order:
   - **ea.cryptonova.ai** (coupon-only) — opens 9am EDT
   - **cryptonova.ai** (open registration) — opens 12pm EDT
3. Monitor Telegram bot for member questions
4. Watch VPS keeper logs: `tail -f ~/keeper/logs/direct_keeper.log`
5. Check that first registration cycles correctly (W1 seats, SF balance draws, keeper responds)

### Day-of monitoring cadence

- Every 30 min: Check Telegram for member questions
- Every 1 hr: Run `node scripts/monitor_v8.js` manually if automated Telegram report missed
- Every 2 hr: Check SF balance — `node ~/keeper/sf_diag.js` on VPS
- Flag for attention: Any "CRITICAL" or "ALERT" line in monitor report; any keeper cron job failing (check `~/keeper/logs/`)

### Member-facing comms

- Leaders with referral links go live day 1
- Coupons active day 1 (coupon issuance costs $10 USDC → covers new member's entry fee)
- For new members with no ETH for gas: gas gift flow via GAS_GIFT_PRIVATE_KEY

---

## PHASE 4 — Rollback Plan

### If contract has a critical bug post-launch

1. **Do NOT delete Vercel projects**
2. Disable all 6 VPS keeper cron jobs immediately: `crontab -e` → comment out all CryptoNova lines
3. Update frontend to show "Maintenance — back shortly" banner
4. Fix contract, deploy new version, update addresses via `update_addrs.py`
5. Re-enable keepers after frontend is updated and verified
6. Resume from Stage 1 of frontend push checklist

### If frontend is broken (spinners frozen)

**ALWAYS check truncation FIRST before assuming RPC or wallet issues.**

```bash
tail -5 index.html
```
Must end with `</body></html>`. If not — file is truncated. Fix:
```bash
git show HEAD:index.html > index.html.new && mv index.html.new index.html
tail -5 index.html   # verify
# then git add + commit + push
```

### If Vercel deploy is stuck

1. `git commit --allow-empty -m "trigger deploy"` then push
2. Check Vercel build logs for error
3. Never force-push to main without verifying preview first

---

## PHASE 5 — Known Issues at Launch

| Issue | Status | Workaround |
|---|---|---|
| Crossing reserve ($5) locked during active matrix | By design — unlocks at cycle completion | Wait for your matrix to cycle |
| Members who registered before V8.31 via coupon can't set Auto-Reentry | Fixed in V8.32 — requires re-registration or admin update | Contact admin |
| Member ID can gap slightly with coupon registrations | Cosmetic only — earnings not affected | None needed |
| Position >127 display confusing members | Members see totalJoined, not BFS position | FAQ explains this |
| VPS keeper rescue latency (up to 5 min) | By design — cron schedule | Members wait briefly before slot clears |

---

## Quick-Reference: V8.34 Addresses & Files

| Item | Value |
|---|---|
| Contract version | **V8.34** |
| Addresses file | `deployed_addresses_v8_34.json` |
| TierRouter | `0x8a02C52F...` (Base Sepolia testnet) |
| MatrixKeeper | `0xcf6c9439...` (Base Sepolia testnet) |
| Deployer EOA | `0x5EaEfA3...` (clean EOA — non-delegated) |
| W1 wallet | `0x6512e9B5...` |
| Working branch | `admin` |
| Admin frontend (testnet) | https://admin.crypto-nova.app |
| Testnet preview | https://early.crypto-nova.app |
| Mainnet admin | https://admin.cryptonova.ai |
| VPS SSH | `ssh -i C:\Users\CryptoTech\.ssh\do_keeper root@167.99.0.250` |
| Keeper logs | `~/keeper/logs/` on VPS |

**Mainnet addresses will be different — update this table after mainnet deploy.**

---

## Gate Timestamps

| Domain | Opens | Timestamp (ms) |
|---|---|---|
| early.crypto-nova.app | July 12 2026 9:00 AM EDT | `1783861200000` |
| crypto-nova.app | July 12 2026 9:00 AM EDT | `1783861200000` |
| cryptonova.ai (mainnet EA) | July 19 2026 9:00 AM EDT | `1784466000000` |
| cryptonova.ai (auto-open) | July 19 2026 12:00 PM EDT | `1784476800000` |

---

## Standing Rules (always)

- **NEVER chain commands with `&&` in PowerShell** — one command at a time, wait for output
- **NEVER put keys/credentials in PowerShell commands** — all secrets in `.env`
- **NEVER delete a Vercel project** — no undo, permanent data loss
- **ALWAYS `npx hardhat run scripts/deploy_v8.js --network base`** — NEVER `node`
- **ALWAYS commit addresses JSON immediately after deploy** — V8.29 was lost by skipping this
- **ALWAYS verify contracts on BaseScan AND submit the domain to Blockaid (report.blockaid.io/mistake) after every deploy** — unverified contracts + fresh domains get flagged "malicious/scam" by MetaMask/Coinbase/Rainbow (all Blockaid) and members bail on the warning. Verify FIRST, then appeal.

## Git Lock Recovery

If `git add` fails with "index.lock: File exists":
```powershell
Remove-Item "C:\CryptoNova-Testnet-App\.git\index.lock" -Force
Remove-Item "C:\CryptoNova-Testnet-App\.git\HEAD.lock" -Force
```

All git operations run from **PowerShell**, not bash (bash git lock is a mount phantom on Windows).
