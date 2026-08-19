# INCIDENT — 2026-08-19 — Base Sepolia stopped serving state reads

**Status: RECURRING (upstream).** ⚠ IT CAME BACK THE SAME DAY. First outage ~15:54-16:39
UTC; a SECOND one began during the 17:0x bigfill run and was confirmed by the owner. Treat
Base Sepolia as UNRELIABLE for the rest of this week, not as "an incident that happened".

**What that changes:**
- **Any measurement taken across an outage is a FLOOR, not a result.** The bigfill run of
  2026-08-19 17:0x logged `HH110: Invalid JSON-RPC response received` on eight consecutive
  wallets and two `top-up DID NOT LAND - send reported success but balance did not change`
  lines. Those wallets were NOT skipped for a real reason; the node did not answer. Do not
  read that run's self-rescue or fund totals.
- **`watch_base_sepolia.mjs` before and after every run whose numbers you intend to trust.**
- **It affects the V8.50 private-deploy plan.** A deploy or a measured bigfill wave on a
  flapping network produces data nobody can defend. Sequence around a clean window.

⛔ **AND THE ONSET WAS DATED TOO NARROWLY — MEMBER REPORTS PREDATE IT.** Found after this
doc was first written, in BUGS.md via the automated intake:
- **[2026-08-18] Maximum_71** — *"The RPC node didn't respond after several retries"*
- **[2026-08-19 13:50 UTC] @bevmawire** — *"Couldn't find your status"*, frequency **Consistent**

The outage measured in this document began at **15:54 UTC on 2026-08-19**. BOTH reports are
earlier. So the SYMPTOM CLASS is older than the outage that was diagnosed, which corroborates
the owner's "ongoing for a while, getting worse" and means this document's timeline describes
ONE EPISODE, not the whole problem.

⚠ **TWO READINGS, NOT YET SEPARATED — do not collapse them:**
1. Base Sepolia has been intermittently degrading for days, and 15:54 was simply the worst
   episode and the first one measured.
2. The earlier reports are the SLOW-SCAN path, not the 503 path. "The RPC node didn't respond
   after several retries" is the dashboard's own text for `loadUserData` failing, and it
   fires on the 8-second `rpc()` timeout exactly as readily as on an error. Before the
   LOGS_DEPLOY_FLOOR fix a lifetime scan was 95 sequential windows at ~103 ms — comfortably
   enough to blow that budget on a slow day with nothing upstream wrong at all.

**IF (2) IS RIGHT, THE BLOCK-FLOOR FIX IS THE FIX FOR THE EARLIER CLASS** even though it was
not the fix for the 15:54 outage. That is testable: ship it to admin, then watch whether
"didn't respond after several retries" reports stop arriving on days with no 503s. Until
then it is PLAUSIBLE, NOT PROVEN, and must not be written up as the cause.

**SEPARATE DEFECT IN THE SAME REPORT — bug-report.html.** @bevmawire: *"Additional notes
(optional) tab does not seem to be giving access to 'Steps to reproduce, screenshot filename,
error message'... it does not seem to have facility for uploading screenshots either."* A
reporter who cannot attach a screenshot or reach the reproduce fields gives us less to work
with on every future report. Not triaged; logged here so it is not lost.

**Original status: RESOLVED (upstream).** Not a CryptoNova defect. No code change was required and
none was made in response to it. Written for the next session of Claude and the owner.

---

## What members saw

- Dashboard: **"Couldn't load your status — The RPC node didn't respond after several
  retries"**
- Home / Live Stats: every card `—`
- Matrix Tree View: `Error: missing revert data (action="call", data=null, reason=null,
  transaction={ "data": "0x3f728455", "to": "0x7154485C8b630d1…`
- Status page: `T1 FILL 0/127 · MatA 0% · 0 active tiers` **while simultaneously** showing
  109 parked and a $87.50 Stability Fund
- Keeper card: "Checking… Could not read keeper this poll"

The internally inconsistent Status page is the tell: some reads succeeded and some did not,
in the same page load.

## What it actually was

**Base Sepolia stopped serving STATE READS while continuing to produce blocks.**

| method | Base Sepolia | Base mainnet | Ethereum Sepolia |
|---|---|---|---|
| `eth_blockNumber` | ok, head advancing | ok | ok |
| `eth_getCode` | **HTTP 503** | ok | ok |
| `eth_call` | **HTTP 503** | ok | ok |

Failed identically on **five QuickNode endpoints and on Coinbase's `sepolia.base.org`** —
independent operators. The two control chains answered from the **same machine in the same
minute**, which is what rules out the local network.

Batched `eth_call` returned HTTP 200 carrying
`{"code":-32004,"message":"failed to serve request"}`; the same call sent unbatched returned
HTTP 503 with an empty body. Same underlying failure, two surfaces.

**Timeline (UTC).** Healthy 15:20 (`occupancy()` = 127). Hard down by 15:54. Intermittent
16:14–16:38 — QuickNode recovered before Coinbase and flickered. Stable from **16:39**.
Timestamped record: `base_sepolia_watch.csv`.

**status.base.org said "All Systems Operational · 100% uptime" throughout.** It was wrong.

## Why one upstream fault produced four different symptoms

Everything downstream is a consequence of `eth_call` failing:

1. `occupancy()` fails → ethers has a call result with no data → reports **`missing revert
   data`**. That is why the Matrix view showed what looks like a contract revert.
2. `rpc()` (`index.html:3009`) races every read against an **8-second timeout**, and the call
   sites end in `.catch(() => null)`. A failed read is therefore **discarded, not reported** —
   the card paints `—` or 0. There is a comment directly above the occupancy reads that
   predicted this exact rendering: *"a rate-limited occupancy call renders a LIVE tier as
   0/127 - 0% with an empty bar"*.
3. The keeper reads state the same way → "could not read keeper this poll".
4. **Parked rescues stall for the duration.** Expect a backlog after any future outage.

## If it happens again

```powershell
cd C:\CryptoNova-Testnet-App
node check_chain_scope.mjs      # is it Base Sepolia, or this network path?
node watch_base_sepolia.mjs     # has it recovered? logs to CSV
```

`watch_base_sepolia.mjs` declares recovery only after **three consecutive clean samples on
both operators**. That is not caution for its own sake — during this incident a single clean
read appeared at 16:14, twenty-five minutes before the service actually stabilised.

Member comms: say it is upstream and affects every project on Base Sepolia, that **accounts
and funds are unaffected**, that rescues resume automatically, and that there is nothing for
members to do. Do not promise a time.

---

## The one real defect found while chasing this — FIXED, **NOT YET PUSHED**

It is **not** the cause of the incident and must never be quoted as one. It is a genuine
finding on its own measured merits.

`index.html` floored every lifetime log scan at block **44,840,000** — a V8.46-era value —
and walked back to it in 9,000-block windows. Measured with `measure_page_rpc.mjs`:

| | block | windows per lifetime scan |
|---|---|---|
| chain head (2026-08-19) | 45,691,990 | — |
| old floor | 44,840,000 | **95** |
| cnova created | 45,428,148 | 30 |
| tierRouter created | 45,428,223 | 30 |
| communityWallet created | 45,430,266 | 30 |

**65 of every 95 windows — 68% of all lifetime history reading the site does — scanned blocks
that provably contain nothing**, because they predate the creation of every contract queried.
Six call sites do a floor-bound scan. Measured 103 ms/window with **0 failed windows and 0
retries**: the endpoints were never refusing us, the page was simply asking ~3.2x more than
it needed to.

**Changed to 45,428,000** — 148 blocks below the earliest creation block as slack against an
off-by-one in the search. The safety argument is a property, not an estimate: *a contract
cannot emit an event before the block it was created in.* All five inline script blocks pass
`node --check`. Backup: `index.html.bak_session9`.

⚠ **THE REAL DEFECT IS THAT THIS CONSTANT GOES STALE BY DESIGN.** The head moves ~43,200
blocks/day and the floor does not, so every scan grows ~4.8 windows/day — about 29 more
requests per dashboard load per day, forever. Raising the constant buys ~4 months and then
the same curve resumes. The old comment claimed a stale-low floor "only scans a few extra
EMPTY windows"; that sentence is why this sat for 19.7 days, and it has been replaced with
the measurement. Structural fixes, in order of value:

1. `safeGetLogs` already accepts `opts.fromBlock` so a deep history could be paid **once per
   wallet** and cached. **No call site passes it.** That is the real fix.
2. Per-contract floors instead of one global one (the three differ by ~2,000 blocks).

**On redeploy:** re-run `measure_page_rpc.mjs` and set the floor just under the earliest
creation block it reports. Do not lower it "to be safe" — that is what cost 68%.

---

## Method notes worth keeping

**`check_rpc.ps1` reported "all six endpoints healthy" during a total outage.** It only sent
`eth_chainId` and `eth_blockNumber` — the two methods that never broke. It never sent an
`eth_call`. That reading sent the investigation down a load-and-latency detour before the
browser console produced the real error. **An instrument must not report the absence of
something it cannot observe.** Extend that script before trusting it again.

**Six endpoints on one network path are not six independent observations.** Every reading
came from the owner's machine — same ISP, same resolver, same security software. A middlebox
inspecting POST bodies would pass `eth_blockNumber` and fail `eth_call` and look exactly like
an upstream outage. `check_chain_scope.mjs` exists to close that confound and should be run
before blaming any upstream.

**The browser was the instrument that mattered.** Node could not reproduce the failure —
no CORS, different connection limits. Reading the page's own `fetch` calls (patched to log
method, batch size and status) is what produced the `-32004` message and the batched-vs-single
distinction.
