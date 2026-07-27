# CryptoNova Testnet App — CLAUDE.md

Read this file at the start of every session before touching any frontend code.

---

## Active state (update after each session)

| Item | Value |
|------|-------|
| **TIMEZONE** | **Owner is EDT (UTC-4). Work in EDT, not UTC** — UTC makes evening look like the middle of the night. VPS commands: prefix `TZ=America/New_York date`. |
| **LIVE CONFIG CHANGES 2026-07-26 PM EDT** | **MatA rotation had STOPPED on every saturated pair in all 10 tiers** — members frozen in seats 2..127 permanently (Sherwyn reported it across 3 versions; Kira, CryptoJan22, Lavern corroborated). Fixed with TWO reversible owner calls, **no redeploy, no reset, nobody lost a position**: (1) **8:25 PM** `TierRouter.setPairExpansionThreshold` 381 → **1000000** (block 44671830) — **PERMANENT, do not revert**; revived T2.0/T3.0/T5.0 MatA. (2) **8:50 PM** T1 `PairManager.setEntryThresholds` route 381 → 3000 (block 44672565) — **now managed automatically by the round-robin keeper**. T1.0 MatA verified 254 → 263 at ~26 rotations/hr. Audit trail: `/root/keeper/threshold_changes.log`. Revert commands are logged with every change. |
| **Round-robin keeper (NEW)** | `/root/keeper/route_rr.js`, cron `*/5` + flock. Walks the new-member entry stream around T1's pairs so no MatA starves. **Entry-driven, not time-driven** (QUOTA=8 entries, MAX_MIN=30 fallback) because the stress keeper delivers bursts every 30 min. Kill switch: `touch /root/keeper/route_rr.OFF`. Master copy: CryptoNite-MT5-Bots/route_rr.js. Pairs with internal churn hand off fast; starved pairs hold — that allocation is intentional, don't "fix" it to strict fairness. |
| **Diagnostic scripts (NEW, masters in CryptoNite-MT5-Bots)** | `pair_entries.js` (per-pair entries vs threshold + which pair each threshold selects) · `check_reporters.js` (where every bug reporter's wallet sits) · `set_threshold.js` / `set_route.js` (owner-guarded, simulate-first, log the revert command) · `integrity_check.js` (BFS guard, run after every deploy). |
| Live contract version | **V8.45 (deployed 2026-07-26 ~02:45 UTC)** — emergency fix of a V8.44 bug that corrupted a matrix's seat map (nested entry during rotation → phantom seat 128, occupancy drift +44, position 1 emptied → `F8V8: no root` wedge → 42 members could not self-rescue). Fix: seat resolved after rotation, never out of range, self-healing root scan. 402 tests green incl. new N1/N2 regressions. Frontend updated (115 replacements, commit 7e44268→e3176f6 on all 3 branches); gates preview 11:45 PM / main 12:00 AM EDT. Keepers on V8.45, **stress keeper OFF pending owner green light**. Integrity gate: `node /root/keeper/integrity_check.js` = INTEGRITY OK. Addresses: TierRouter 0xC44c1A51…, PairFactory 0x71020540…, MatrixKeeper 0x603db2d9… |
| PREVIOUS (dead) | V8.44 (deployed 2026-07-25, killed within hours by the nested-entry BFS corruption — see V8.45 above). V8.43 and earlier archived in BUGS_PRE_V8_44_ARCHIVE.md. |
| Addresses file | **`deployed_addresses_v8_45.json`** — every keeper/diagnostic defaults to this. NOTE: `diag_member_rescue.js` still defaults to the DEAD v8_44 file; always pass `ADDRESSES_FILE=deployed_addresses_v8_45.json` when running it. |
| **V8.46 — THE REAL FIX (next build)** | Root bug found 2026-07-26, **two sites, same mistake**: a capacity concept implemented with a CUMULATIVE lifetime counter. (1) `TierRouter._sameTierTarget:1247` — re-entry goes to own MatB when `pairs[i].totalRegistered >= pairExpansionThreshold`, but the doc at TierRouter:230 says "combined occupancy" (max 254); live T2.0 was at 3064. (2) `PairManagerV8` oldest-first scan `:475-506` — picks the oldest pair with `totalRegistered < routeEntryThreshold`, doc says "whose MatA still has available seats". Both exclude old pairs FOREVER. **Fix: compare live occupancy as both comments already describe.** Test `test/V8_46_MatAStarvation.test.js`: S1 reproduces the freeze (PASSES), S3 proves a cascade does NOT steal the entrant's seat (PASSES), S2 cannot be proven in-harness — a passive member accrues only 7.436 of a 10.0 fee so re-entry parks before routing is reached. **Still unmeasured: cascade gas at 127 seats.** |
| **FUNDING CONSTRAINT (design fact, not a bug)** | The crossing reserve covers **exactly 50%** of the next entry fee; the member must have earned the other 50% or they PARK. Pool payout is fixed at 18% split across the matrix, so a member with **no referral income can essentially never self-fund a re-entry** — repeated parking with variable shortfalls is the DESIGNED path for them, not a fault. This is the honest answer to CryptoJan22's "$0.60 to $41.00" report. Referral income (5% L1 + 2.7%×5 chain) is what closes the gap. |
| Mainnet dates | Soft launch TBD (no countdown — opens by flag flip only); flagship June 19, 2027 |
| V8.44 GO-LIVE | **2026-07-25: preview 3:00 PM EDT, main 3:30 PM EDT — LIVE.** Frontend pushed to all 3 branches (33156be + gate commit 3dc9324); gates verified rendering. Owner Rabby registration test passed. 34/39 round-robin leaders registered via early access. VPS keepers all re-pointed to V8.44 + 8 cron lines active (incl. stress + channel_pulse). Health check: `node /root/keeper/v844_state.js`. First state @20:15 UTC: T1 MatA 88/127 rot=0 parked=0 — awaiting first cross into MatB (THE metric: MatB rot must climb, was frozen at 0 on V8.43). |
| Bigfill/stress keeper | **ON. Cron moved `*/5` → `*/30` on 2026-07-26** — runs were taking 60-93 min against a 5-min cron, so flock was discarding 12-18 ticks per run. Also added **`MAX_RESC` (default 120)**: rescues are now capped per run and the remainder rolls to the next one, instead of a single run trying to drain the whole parked backlog. Copay keeper (`*/10`) **gained a flock it never had** — it could previously overlap and collide on the keeper wallet's nonce. (Original notes below still apply.) State reset to wallet #0 for V8.43; ladder extended T1→T10 (deployer funds each rung; skips log `UPGR SKIP` if deployer USDC low — top up via `mint_deployer_usdc.js`, minted $20M 2026-07-23, balance ~$20.8M). Master copy: CryptoNite-MT5-Bots/stress_keeper.js. Watch `/root/keeper/stress.log` + deployer Base Sepolia ETH. GAS: full-matrix cascade ≈15.5M+, public RPC caps tx gas <~17.8M (-32003) — ALL four cascade keepers (stress, manual_rescue, direct, frozen_matb; masters in CryptoNite-MT5-Bots) use estimateGas ladder est×1.15→×1.05→est, never static limits. See MAINNET_TODO.md finding. |
| Working branch | `admin` |
| Admin frontend | https://admin.crypto-nova.app |
| Comp-plan docs | Synced to V8.43 contract truth 2026-07-23 (commit af8f569): faq/comp pages, all 10 locales, bot SYSTEM_PROMPT. Pushed to preview+main 2026-07-24 (508fa1f) along with gas fixes, standby-buffer UI, error-handler fix. |
| Marketing package | `CryptoNova-App/marketing/`: Member one-pager + 4 how-to PDFs + `CryptoNova_Explainer_Scripts_V8.md` (all contract-verified; QR/link placeholders pending). Old `CryptoNova_Video_Scripts.md` superseded. |
| V8.44 BUILD | **CONTRACTS COMPLETE 2026-07-25 (sandbox session, test-first, all suites green).** Full status table at TOP of CryptoNite-Smart-Contracts/CryptoNova/V8_44_PLAN.md. All fixes A–I built: escrow-funded additive engine + park-not-exit, overflow rework (own members → own MatB; rescueReentry/registerForMatB; rescueOverflow deleted), factory adminHandoff one-step ownership (Ownable2Step pendingOwner was the REAL orphan cause) + sweepMatrixOwnership + keeper WORK_FORCE_ROTATE backstop, pull-based pool (O(1) accumulators; withdrawableOf now includes pending accrual — FRONTEND note), _upgradeEligible unify + hybridUpgrade + registerWithOptions/Permit + bulkWithdraw + exitSeat (20% reserve penalty default — owner confirm), CW advanceEpoch permissionless + keeper auto-advance, adminReleaseStrandedReserve + enumerate_stranded_v843.js. Bonus fixes: missing softParkIdle wrapper (broken since V8.33), dead pendingCross deferral → now parks. NEXT: Windows full-suite run on real config → predeploy check → fresh V8.44 stress deploy (gates: MatB rot climbing all pairs keepers-off, 500+ rotations zero stranded, cascade gas < 17.8M) → THEN docs/bot/frontend sync (item F) vs deployed code. New tests: V8_44_CycleOut/Overflow/Keeper/PoolEquivalence/UX (.test.js). |

## OPEN AT END OF 2026-07-26 (start here tomorrow)

1. **Push the frontend custom-error fix** — committed locally as `7b3c327`, **NOT pushed**. V8.44/V8.45 swapped revert strings for custom errors but the frontend ABIs were never updated, so ethers got `reason=null` and members saw "RPC may be busy" / "Transaction failed on-chain" for what were plain out-of-USDC errors. All 8 contract errors + the 2 OpenZeppelin ERC20 ones now declared, `friendlyError()` decodes them with real figures, and `bulkUpgrade` checks balance/allowance before blaming the network. Needs the 3-stage deploy + truncation check after each push.
2. **Community post** drafted at `community_post_2026-07-27.md`, **not sent**. Emoji version was approved; bounty line reads "tallied and paid out once we go live".
3. **BUGS.md: 6 still open** — the whole upgrade cluster is now explained (see item 1) but Lavern's "approved funds didn't appear" on 0x145805 (wallet holds $8,194, so NOT a funds problem) and @queensonnie's referral count are genuinely undiagnosed. 3 in Pending-Responded await member confirmation.
4. **Bounties: 13 accepted finds, $13 owed, all `paid_usd: 0`** — payment deferred to go-live by owner decision. Sherwyn 6, Kira 3, CryptoJan 2, Lavern-Gay 2.
5. **V8.46 contract fix** — see the table above.
6. Watch `T1.0/T1.1 MatA parked`: an entry into a FULL MatA rotates the queue (good) but the entrant parks (~1 park per rotation). Single digits is fine; dozens means the round-robin trade isn't worth it.

## Doctrine: code is truth

**The deployed contract is the single source of truth — never copy comp-plan facts from site pages, locale files, or the bot prompt without verifying against the Solidity source** (CryptoNite-Smart-Contracts/CryptoNova/contracts/). Verified V8.43 facts: 50% crossing reserve (funds HALF the crossing fee — crossing costs the full entry fee, earnings cover the rest, shortfall → parked → self-rescue with no debt) · 2.5% instant earn · 5% L1 · 2.7%×5 chain pay (L2–L6) · 18% equalization pool distributed EVERY ROTATION across seats 2–127 weighted by depth (NO root lump payout, NO "2× entry" payout — these are common stale/invented claims) · treasury 5% · SF 3% · dev+ops 1.5% · CW/buyback/liquidity 0.5% each · Whale Gate: T2–T5 open at 25 T5 pioneers, T6–T10 at own 25-member milestone; auto-upgrades never whale-gated BUT are throttled by the separate VELOCITY gate (`tierVelocityGreen`, keeper-set, flips dynamically — display as "Auto-Paused", never conflate with Whale Gate) · V8.43 additive cycle-out: re-entry → upgrade → double seat (defaults: re-entry ON, upgrade ON first 5 cycles) · pair overflow: deploy next pair at 375 entries, route ALL overflow at 381. NOTE: locale JSONs override HTML via i18n.js — fixing page HTML alone is not enough; non-EN locales currently carry corrected ENGLISH text for changed keys, retranslation pending.

## Branch → Domain map

| Branch | Domain | Who reviews | Rule |
|--------|--------|-------------|------|
| `admin` | admin.crypto-nova.app | Owner (personal assessment) | All work goes here first |
| `preview` | early.crypto-nova.app | QA team (quality assessment) | Push ONLY after admin is verified |
| `main` | crypto-nova.app / v8.crypto-nova.app | Community / world | Push ONLY after QA + leader sign-off |

## 3-stage deploy order — MANDATORY

```
Stage 1: git push origin admin
Stage 2: git push origin admin:preview --force   ← STOP, wait for QA
Stage 3: git push origin admin:main --force      ← STOP, wait for leader sign-off
```

**NEVER push to `main` before `preview`. NEVER skip stages.**  
**NEVER push to `preview` or `main` without explicit approval.**

---

## CRITICAL: Post-push checklist — run EVERY TIME after git push

### Step 1 — Truncation check (ALWAYS FIRST, before anything else)

```powershell
# In the repo directory:
git show admin:index.html | Select-Object -Last 5
```

Or in bash:
```bash
tail -5 index.html
```

File **must** end with `</body></html>`. If it does not — it is truncated. Fix before checking RPC, wallet, or cache.

**DO NOT assume frozen spinners = wallet not connected or RPC slow. Check truncation first, every time.**

Correct index.html ending:
```
  console.log('[v8.8] ADDRS updated from deployed JSON');
}
</script>
<script src="/i18n.js" defer></script>
    <!-- Bug Report Footer -->
    <div style="text-align:center;...">🐛 Found a bug? Report it here</a></div>
</body></html>
```

### Step 2 — Hard refresh browser

`Ctrl + Shift + R` on each page. Vercel CDN caches aggressively; new builds take 1–3 min.

### Step 3 — Connect wallet

Live Stats on index.html require wallet connection. Spinners without a connected wallet are normal — not a bug.

---

## File editing rules (mount sync lag)

The bash sandbox may serve stale/truncated content from the Windows mount for files it has already seen.

**Safe write procedure:**
1. Write content to a **new path** (e.g., `index.html.new`) using Python or the Write tool
2. `os.replace(new_path, original_path)` from Python, or `mv` from bash
3. Strip trailing null bytes afterward:

```python
data = open(path, 'rb').read().rstrip(b'\x00')
open(path, 'wb').write(data)
```

**Never** use `sed -i` on large HTML files — it reads stale cached content and writes it back truncated.

**CRLF:** Python writes use LF (`newline=''` or leave default). Git on Windows converts to CRLF on checkout — the LF warnings on `git add` are normal and harmless.

---

## Truncation fix procedure

If index.html is truncated after a push:

1. Get the full correct content from the last known-good git commit:
   ```bash
   git show <good-commit-sha>:index.html
   ```
2. Apply current address replacements via Python (do not re-use the truncated version)
3. Strip null bytes
4. Write to `index.html.new`, then `os.replace()` over `index.html`
5. Verify: `tail -5 index.html` → must show `</body></html>`
6. `git add index.html && git commit -m "fix: restore truncated index.html"`
7. `git push origin admin`

---

## Vercel rules

- **NEVER delete a Vercel project.** Wipes all env vars, domains, and settings permanently. There is no undo.
- After a force-push that Vercel ignores, use the "empty commit trick": `git commit --allow-empty -m "trigger deploy"` then push again.

---

## PowerShell rules

- **NEVER put keys or credentials in PowerShell commands.** All secrets live in `.env`.
- **PowerShell does not support `&&`.** Always give one command at a time. Wait for output + no-error confirmation before the next step.
- Runtime params only go on the command line: `HDR_OFFSET`, `COUNT`, `TIER`, etc.

---

## Common address variables in this repo

All contract addresses live in the `const ADDRS = {...}` block near the top of each HTML file. When a new version deploys, run the `update_addrs_vX_XX.py` script to replace all addresses in one pass.

**MANDATORY: `update_addrs_vX_XX.py` MUST include `api/telegram-qa.js` in its `ALL_FILES` list.**  
The Telegram bot has 3 hardcoded addresses (TIER_ROUTER, CNOVA_TOKEN, CNOVA_TREASURY) and a version label in the SYSTEM_PROMPT (`## Contracts (Base Sepolia — VX.XX)`) that go stale after every deploy. The script handles all of them automatically — do NOT skip it.

Always verify with truncation check afterward (`tail -5 index.html`).
