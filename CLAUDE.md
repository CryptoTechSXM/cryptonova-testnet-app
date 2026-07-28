# CryptoNova Testnet App — CLAUDE.md

Read this file at the start of every session before touching any frontend code.

---

## Active state (update after each session)

| Item | Value |
|------|-------|
| **PAIR NUMBERING** | **The dashboard numbers pairs from 1 (T1.1/T1.2/T1.3); the contracts index them from 0.** So dashboard T1.3 == `pairs[2]`. All keeper/diagnostic scripts were switched to 1-BASED display on 2026-07-27 to match what you and the members see — the index passed to contract calls is still 0-based. Anything written before that date in this file or in logs may be off by one. |
| **TIMEZONE** | **Owner is EDT (UTC-4). Work in EDT, not UTC** — UTC makes evening look like the middle of the night. VPS commands: prefix `TZ=America/New_York date`. |
| **LIVE CONFIG CHANGES 2026-07-26 PM EDT** | **MatA rotation had STOPPED on every saturated pair in all 10 tiers** — members frozen in seats 2..127 permanently (Sherwyn reported it across 3 versions; Kira, CryptoJan22, Lavern corroborated). Fixed with TWO reversible owner calls, **no redeploy, no reset, nobody lost a position**: (1) **8:25 PM** `TierRouter.setPairExpansionThreshold` 381 → **1000000** (block 44671830) — **PERMANENT, do not revert**; revived T2.1/T3.1/T5.1 MatA. (2) **8:50 PM** T1 `PairManager.setEntryThresholds` route 381 → 3000 (block 44672565) — **now managed automatically by the round-robin keeper**. T1.1 MatA verified 254 → 263 at ~26 rotations/hr. Audit trail: `/root/keeper/threshold_changes.log`. Revert commands are logged with every change. |
| **Round-robin keeper (NEW)** | `/root/keeper/route_rr.js`, cron `*/5` + flock. Walks the new-member entry stream around T1's pairs so no MatA starves. **Entry-driven, not time-driven** (QUOTA=8 entries, MAX_MIN=30 fallback) because the stress keeper delivers bursts every 30 min. Kill switch: `touch /root/keeper/route_rr.OFF`. Master copy: CryptoNite-MT5-Bots/route_rr.js. Pairs with internal churn hand off fast; starved pairs hold — that allocation is intentional, don't "fix" it to strict fairness. |
| **ENTRY THRESHOLDS NOW 375/400 ON T2–T10 (2026-07-28, owner call)** | `PairManagerV8.deployEntryThreshold` stays **375**; `routeEntryThreshold` **381 → 400** on every tier T2–T10 (block 44738582 onward, gas 33,346 each). **Why:** the gap between the two is the window the factory has to deploy the next pair, wire its partner and have it ready to receive. At 375/381 that window was **SIX ENTRIES** — seconds under the stress keeper — and pair expansion has already caused two incidents (the T1.2-at-254 freeze needing `adminForceRotateRoot`, and the 2026-07-28 wedge where the upgrade guards went blind the moment a second pair existed). 375/400 gives **25 entries** of headroom. Nothing in the contract depends on 381 being 127×3 — it is documentation (comments at PairManagerV8:130-137 and :496), not logic. **Forward-looking only:** T2.1–T5.1 are already at thousands of entries, far past both values, so nothing was un-saturated. **T1 DELIBERATELY EXCLUDED — its `routeEntryThreshold` is driven by the round-robin keeper (~3000 and moving); setting it by hand fights the keeper and the keeper wins on its next tick.** Tool: `set_entry_thresholds.js` (read-only default · `DRY_RUN=1` · `TIERS=T8` for one · refuses unless BOTH values passed, since the setter takes them together and passing one silently resets the other · warns when a pair is already at/over the new route value, because LOWERING a route threshold instantly saturates a pair — the 2026-07-26 freeze in reverse). Revert commands per tier in `/root/keeper/threshold_changes.log`. |
| **PAIR WEDGE: A ROOT HOLDING BOTH HALVES STOPS THE WHOLE PAIR (2026-07-28) — DETECTED, REPAIRED LIVE, WATCHDOGGED** | Members reported `T3 upgrade would fail: F8V8: already in matrix` and a "host" of unrelated-looking failures. **Cause: a member seated in BOTH halves of one pair.** Harmless until they reach position 1 — then the rotation cycles them out of MatA, `_crossToPartner` tries to seat them in the MatB they already occupy, `require(!isInMatrix)` (MatrixLogicLib:255) reverts, and **that revert is NOT inside a try/catch**. It propagates out and kills whatever transaction triggered the rotation — a stranger's `register()` or upgrade. **Exactly the DoS `V8_46_SeatCollision.test.js` predicted on 2026-07-27 and I recorded as hypothetical.** Measured: **25 live duplicates** (T2.1×12, T3.1×5, T4.1×7, T6.1×1; ZERO in all four T1 pairs), of which **2 were at root and hard-stopping T3.1 and T4.1**. **NO FUNDS MOVED — these revert before any state change.** **REPAIRED LIVE, no redeploy:** `unwedge.js` borrows the keeper slot on ONE MatB (`setMatrixKeeper(us)` → `softParkIdle(member)` → restore in a `finally`), freeing the duplicate MatB seat. Free **MatB, never MatA** — the member keeps their MatA root position, cycles out normally and the crossing re-seats them; freeing MatA would cost them the root seat they were about to be paid from. `softParkIdle` on the MATRIX has **no idle gate** (the 7-day `extendedIdleTimeout` lives in `MatrixKeeper._doReclaimSlot`, not there), so no global parameter is touched. Verified: reserve moved into withdrawable ($346.51+$25.00 → $371.51), keeper restored, root unchanged, 48 previously-reverting upgrades succeeded immediately after. **Clear ONLY the root duplicate, reactively** — freeing a non-root duplicate just parks them and the rescue keeper re-seats them into MatB while they still hold MatA, recreating it. Watchdog cron `4-59/10` runs `LIVE=1 unwedge.js` (no-op when clean). Tools: `seat_audit.js` (`ROOTS=1` wedge check · `DUPES=1` population · `SCAN=1` blast radius · `ADDR=` one member), `whois_wallet.js`, `unwedge.js`. |
| **THE ONE-SIDED SEAT GUARD — FOUR SITES, ALL CHECK ONE MATRIX OUT OF A WHOLE TIER (2026-07-28)** | `_manualUpgrade:825`, `hybridUpgrade:854`, `bulkUpgrade:986` and `_executeAdditive:1185` all test `tierMatrixAAddr[i]` (+`tierMatrixBAddr` in the last). **`setTierMatrices` is `onlyOwner` and was set once at deploy, so those addresses are PAIR 1 FOREVER while `pairCount()` grows.** T1 now has 4 pairs and T2–T6 have 2 each, so a member seated in pair 2+ is invisible to every one of those guards. **Currently harmless only because T2.2–T6.2 are deployed but EMPTY** — a landmine, not yet a victim. Fix must iterate `pairCount()`/`getPairAt()`, or compare against the PairManager, never a single stored address. **ALSO in `bulkUpgrade`: the fee loop (:976-980) sums EVERY tier from `startIdx` to target, but the seating loop (:984-989) `continue`s past tiers the member already holds — so the member is charged for a tier they are not seated in.** Latent today because the skip never fires; **becomes a live overcharge the moment the skip is fixed. Both must ship together.** |
| **STILL UNPINNED (2026-07-28): WHAT CREATES THE DUPLICATES** | A duplicate is MatA **and** MatB of the **SAME pair**, so the upgrade paths cannot be the whole story — an upgrade into a tier you already occupy would not be offered. Leading candidate: the re-entry path after a crossing, interacting with the **2026-07-26 `pairExpansionThreshold` 381 → 1000000** change that forces re-entry to MatA. **NOT PROVEN — do not act on it.** Two observations that must be explained by any theory: (1) **zero duplicates in all four T1 pairs**, the fastest-rotating tier — consistent with duplicates draining naturally when the MatB side cycles out first (confirmed live: T2.1's `0xdB79ef3B` was a duplicate, reached root, and read clean); (2) they accumulate in slow pairs. **BLOCKS V8.46:** V8.46-A routes re-entry to MatA more aggressively, so if re-entry is the source the "fix" would manufacture these systematically. **Read the cycle-out flow in MatrixLogicLib and prove the mechanism BEFORE writing the V8.46 guards.** |
| **PUBLIC ARRAY GETTERS TAKE uint256 — AND A SILENT CATCH TURNS THAT INTO A LIE (2026-07-27)** | `tierPairManagers` is `address[MAX_TIERS] public` (TierRouter:149), so Solidity's generated getter is **`tierPairManagers(uint256)`**. Declaring `tierPairManagers(uint8)` in an ABI is a **different selector for a function that does not exist** — the call reverts. In `status.html` that revert sat inside `catch(_){}`, so the pair-manager list silently stayed `[T1pm]` and the loan-book panel reported **"Loans by tier — T1: 1965"** as though T2–T10 had issued nothing. **That reading was false**: `/root/keeper/copay.log` showed T2 and T3 rescues running the whole time. A keeper "fix" for the non-existent starvation was written, deployed and reverted before it did harm. **Rules: (1) a public array getter is uint256, never uint8; (2) prefer `getAllTiers()` — one call, no per-index guessing; (3) never wrap a contract read in an empty catch — log the error; (4) CHECK THE KEEPER LOG BEFORE BELIEVING A PANEL.** Same class as the earlier `memberPosition(address)` and `tierPairManagers(uint8)` guesses in check_reporters.js / tier_costs.js. `diag_cycleout_revert.js` still carries the bad ABI line but never calls it, so its elimination of the router-funding hypothesis stands. |
| **TWO DIFFERENT "RESERVES" — AND AN ON-CHAIN OVERRIDE THAT HID A WRONG BREAKDOWN (2026-07-27)** | The dashboard card said **"$10,000 reserved"** while the withdrawable modal showed a crossing reserve of **$2,217.50**. Both were correct — they are unrelated mechanisms sharing one word. **Crossing reserve** = half of each tier's entry fee, funded BY the entry fee, locked per seat toward that seat's next crossing (T1–T8 = 5+12.50+25+50+125+250+500+1250 = 2,217.50 exactly). **Automation reserve** = `TierRouter.reservedFor()`, EARNINGS withheld so auto-upgrade / auto re-entry can pay their own fee. Both are now separate tappable rows in the modal (owner: "the member should click to get the information"). **The real bug was in the frontend's model of `reservedFor`**: TierRouter:1494 is **ADDITIVE** — `if(reentry) +=curFee; if(autoUpgrade) +=nextFee; if(double) +=curFee` — but the frontend modelled it as seat-based either/or ("seat 1 upgrades, seat 2 re-enters"), which drops the standalone re-entry fee and gives $7,500 where the chain holds $10,000 at T8. **The dashboard then overrode the total with the on-chain value, so the TOTAL looked right while the itemised list the member reads was wrong** — a silent correction masking a wrong model, same shape as the empty-catch trap above. **Rule: when the frontend recomputes a contract figure, mirror the Solidity line-for-line and never let an on-chain override paper over the components.** |
| **Diagnostic scripts (NEW, masters in CryptoNite-MT5-Bots)** | `pair_entries.js` (per-pair entries vs threshold + which pair each threshold selects) · `check_reporters.js` (where every bug reporter's wallet sits) · `set_threshold.js` / `set_route.js` (owner-guarded, simulate-first, log the revert command) · `integrity_check.js` (BFS guard, run after every deploy). |
| Live contract version | **V8.45 (deployed 2026-07-26 ~02:45 UTC)** — emergency fix of a V8.44 bug that corrupted a matrix's seat map (nested entry during rotation → phantom seat 128, occupancy drift +44, position 1 emptied → `F8V8: no root` wedge → 42 members could not self-rescue). Fix: seat resolved after rotation, never out of range, self-healing root scan. 402 tests green incl. new N1/N2 regressions. Frontend updated (115 replacements, commit 7e44268→e3176f6 on all 3 branches); gates preview 11:45 PM / main 12:00 AM EDT. Keepers on V8.45, **stress keeper OFF pending owner green light**. Integrity gate: `node /root/keeper/integrity_check.js` = INTEGRITY OK. Addresses: TierRouter 0xC44c1A51…, PairFactory 0x71020540…, MatrixKeeper 0x603db2d9… |
| PREVIOUS (dead) | V8.44 (deployed 2026-07-25, killed within hours by the nested-entry BFS corruption — see V8.45 above). V8.43 and earlier archived in BUGS_PRE_V8_44_ARCHIVE.md. |
| Addresses file | **`deployed_addresses_v8_45.json`** — every keeper/diagnostic now genuinely defaults to this. **Fixed 2026-07-27:** 12 local scripts and 14 on the VPS still defaulted to v8_33–v8_44 (`direct_keeper` was 12 versions behind). Cron passes `ADDRESSES_FILE` so nothing was broken, but a MANUAL run without the env var read dead contracts and reported the results as fact — same failure shape as a silent catch, sourced from a default. All bumped; VPS backup at `/root/keeper/bak_2026-07-27/`. The old `diag_member_rescue.js` warning is retired. **Rule: when a version ships, grep both trees for stale `deployed_addresses_v8_*` defaults — the env var hides them.** |
| **Master-copy gaps (found 2026-07-27)** | `channel_pulse.js`, `diag_overflow.js` and `organic_drip.js` existed ONLY on the VPS with no copy in CryptoNite-MT5-Bots — invisible to review and lost with the box. Now pulled down and committed. NOTE: `diag_overflow.js` hardcodes `/root/keeper/...` absolute paths, so it runs on the VPS only. **Check for VPS-only scripts before assuming the repo is the full picture.** |
| **V8.46 — THE REAL FIX (next build)** | Root bug found 2026-07-26, **two sites, same mistake**: a capacity concept implemented with a CUMULATIVE lifetime counter. (1) `TierRouter._sameTierTarget:1247` — re-entry goes to own MatB when `pairs[i].totalRegistered >= pairExpansionThreshold`, but the doc at TierRouter:230 says "combined occupancy" (max 254); live T2.1 was at 3064. (2) `PairManagerV8` oldest-first scan `:475-506` — picks the oldest pair with `totalRegistered < routeEntryThreshold`, doc says "whose MatA still has available seats". Both exclude old pairs FOREVER. **Fix: compare live occupancy as both comments already describe.** Test `test/V8_46_MatAStarvation.test.js`: S1 reproduces the freeze (PASSES), S3 proves a cascade does NOT steal the entrant's seat (PASSES), S2 cannot be proven in-harness — a passive member accrues only 7.436 of a 10.0 fee so re-entry parks before routing is reached. **Still unmeasured: cascade gas at 127 seats.** |
| **CO-PAY RESCUE IS AN EMERGENCY VALVE, NOT NORMAL OPERATION (owner, 2026-07-27)** | Co-pay rescue was **deliberately switched OFF** by design. It was re-enabled only as a workaround because SELF-rescue was broken, so testing could continue. **Do not read the SF loan book as the system's resting state** — $98,918 issued / $65,427 repaid / $33,491 outstanding is the cost of running the ambulance continuously for days, not evidence that the 3% SF split is too small. (Claude drew exactly that wrong conclusion from `sf_topups.log` before the owner corrected it.) **V8.46 success test: self-rescue works reliably → co-pay goes dormant → the SF stops lending → the outstanding book winds down as debts repay at cycle-out.** Co-pay stays in the contract as the emergency tool it was designed to be. |
| **V8.46 SCOPE = A + C ONLY (decided 2026-07-27)** | **A (built+proven):** `TierRouter._sameTierTarget` now returns own MatA unconditionally — re-entry always feeds MatA, which is what keeps a saturated pair self-sustaining. Proven at production size: 3 funded re-entries, all MatA, zero MatB. **C (built+tested):** empty catch now parks + emits `CycleOutFailed`. **B (depth guard) NOT BUILT — and should not be** on current evidence: the 127-seat cascade measures **4,651,492 gas vs the 17.8M cap (3.8x headroom)**, so gas exhaustion is not occurring on the single-pair path. NOTE: `PairManagerV8._findExternalPair` using a cumulative counter is NOT a bug — PairManagerV8:495 documents it as deliberate; my first two V8.46-A specs wrongly included it. |
| **CASCADE GAS — MEASURED AT LAST (V8.44 gate, never run before 2026-07-27)** | `test/V8_46_CascadeGas.test.js` (SIZE=127, both matrices full): plain entry 734,647 · peak entry during rotation 5,127,660 · **worst-case cascade 4,651,492** vs the 17.8M RPC cap. Hardhat caps one tx at 2^24 = 16,777,216, below the real cap, so a pass here is conservative. **STILL UNMEASURED: the multi-tier ladder cascade** (re-entry → upgrade into the next tier → double seat, each with its own rotation) — that is what the old "~15.5M full-matrix cascade" note meant, and it needs a multi-tier fixture. |
| **SILENT GRADUATIONS — CAUSE FOUND 2026-07-27: `require(!isInMatrix)` ON RE-ENTRY** | **SOLVED by fork replay** (`CryptoNova/scripts/replay_graduation.js`, FORK=1 TX=0x...). Replaying graduation tx `0xff488549…` (block 44702114) reproduced live gas to the unit (1,715,594) and traced 3 nested reverts, all **`Error("F8V8: already in matrix")`**, with **178,042 gas still left** — gas was never the cause. Chain: `MatB cycle-out → TierRouter 0xC44c1A51 → PairManager 0xD6df6ec0 → T4.1 MatA 0xfB1ef547 (occupancy 127/127) → require(!isInMatrix) at MatrixLogicLib:255 → REVERT → empty catch at :513 → member vanishes`. **ROOT CAUSE: a member can hold a seat in BOTH halves of the same pair at once.** Proven on `0xdFD9e186…`: 44686494 crossed MatA→MatB (seat in MatB); **44689351 took a SECOND seat in T4.1 MatA**; 44702114 MatB cycled out, re-entry targeted the MatA they already occupied, revert, gone. Note `MatrixKeeper.sol:558` already treats this exact string as expected-and-swallowable on the parked-rescue path — anticipated on one path, unhandled on the other. Confirmed count: **9 events, 6 members, $467.50 stranded**. |
| **V8.46 REWRITTEN AROUND THE REAL CAUSE (2026-07-27) — PREVENT, DON'T ACCOMMODATE** | **The fix is to stop duplicate seats forming, not to cope with them.** First attempt was the opposite — route re-entry to MatB when MatA is occupied — and `V8_46_SeatCollision.test.js` proved it dangerous: with a member in BOTH halves, the next MatA rotation makes them root, `_crossToPartner` tries to seat them in the MatB they occupy, `require(!isInMatrix)` reverts, and **that revert is NOT inside the swallowing try/catch** — it propagates out and **kills an unrelated member's `register()` transaction**. Trading a silent member loss for a pair-wide DoS. **Grim corollary: the silent graduation was MASKING this** — losing the member freed their MatB seat so the later crossing worked (0xdFD9e186 crossed clean at 44711526 only because it was graduated at 44702114). **SHIPPING SCOPE:** (1) **upgrade guard now checks BOTH halves** of the destination pair — `TierRouter._executeAdditive`, the primary fix; (2) `_sameTierTarget` collision check kept as defence in depth (limbo re-entry, co-pay rescue and manual registration can still seat directly); (3) **C** parks + emits `CycleOutFailed`; (4) **B is DEAD** — 178,042 gas left at the deepest frame. **SIZE: 24,433 bytes, 143 headroom** — paid for by deleting the dead `pairExpansionThreshold` + setter + event and converting **all 20** revert strings to existing custom errors (`TRState`/`TRAuth`/`TRBadValue`). **DO NOT dedupe the six `setTierGateThresholdT5..T10` wrappers — measured, it makes the contract BIGGER (24,809 → 25,024).** **FRONTEND MUST SHIP WITH IT:** `friendlyError()` needs `TRState` cases for register ("already registered") and upgrade ("tier not open yet"), plus `TRBadValue` on bulk upgrade — those were readable strings until now. **STILL TO BUILD: a two-tier fixture** driving a real auto-upgrade into a tier where the member already holds a MatB seat, asserting no duplicate forms. The existing test force-seats via an impersonated PairManager, which bypasses the guard, so it can only test survivability of a pre-existing duplicate. |
| **THE 8 SILENT GRADUATIONS — SUPERSEDED, see the row above** | Three hypotheses raised and all three eliminated: (1) fee mismatch between TierRouter and PairManager — ruled out, aligned on all 10 tiers; (2) TierRouter USDC/allowance shortfall — ruled out, all 9 live MatB roots simulate clean (`diag_cycleout_revert.js`); (3) out-of-gas in the try/catch — ruled out by the 3.8x headroom above. Remaining candidate: the multi-tier ladder cascade, which fits the victim profile (all 8 spanned many tiers) but is unproven. **This does not block V8.46** — item C bounds the damage (park + event instead of vanishing) and `graduation_scan.js` detects any recurrence. |
| **V8.46-C — SILENT GRADUATION (fix built + tested, ships with V8.46)** | `MatrixLogicLib:513` wrapped the additive engine in a try/catch with an **EMPTY catch**. The root is removed from the seat map BEFORE the call, so any revert inside `handleCycleOut` was swallowed — no re-entry, no upgrade, no park, **no event**. Members silently vanished. This is the same failure V8.44 was built to eliminate, reintroduced by the catch. **Measured: 5 wallets, 8 events, $267.50 stranded** (W1 lost T1/T2/T3; also the keeper wallet and 2 leader wallets — no community members). Fix: catch now parks the member and emits new `CycleOutFailed(member, tierIndex)`. Tests `V8_46_SilentGraduation.test.js` (G1/G2/G3) + mock `contracts/test/RevertingTierRouter.sol` all green. **Still unknown: WHY it reverted** — replay one of the 8 txs on a fork; if gas, V8.46-B's depth guard is the cure. Detector: `graduation_scan.js`. Per-member: `member_history.js`, `check_member_options.js`. |
| **STABILITY FUND — THREE TRAPS (all found 2026-07-27)** | (1) **`totalBalance` ≠ `balanceOf`.** Every spend guard reads the INTERNAL `totalBalance`; it only rises inside `receiveLayer()` / `receiveDebtRepayment()`. Reading `balanceOf` showed $52,075 while spendable was $75 and every rescue reverted `"SF: below floor"`. (2) **Direct transfers are PERMANENTLY LOST** — `ownerWithdraw` also caps at `totalBalance`, so $52,000 minted straight to the address is unrecoverable. (3) **Layer 1 carves to the CommunityWallet** — a $20,000 layer-1 deposit credited **$0.76**. **ALWAYS top up with `receiveLayer(tier, amount, 5)`** — layer 5 is the no-carve path. Use `topup_sf.js`, which now reports all three and retries through nonce contention. |
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
6. Watch `T1.1/T1.2 MatA parked`: an entry into a FULL MatA rotates the queue (good) but the entrant parks (~1 park per rotation). Single digits is fine; dozens means the round-robin trade isn't worth it.

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

**For the preview and main stages you MUST check the REMOTE ref, not the local one.**
`git push origin admin:preview` updates the remote branch only — your local `preview`
ref never moves, so `git show preview:index.html` reads a stale local copy and will
happily "pass" while showing you a file from days ago. Caught live 2026-07-26: the
local refs were still on the countdown-gate commit and showed a completely different
file ending.

```powershell
git fetch origin
git show origin/preview:index.html | Select-Object -Last 5
git show origin/main:index.html    | Select-Object -Last 5
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
