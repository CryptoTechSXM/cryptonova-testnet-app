"""
update_addrs_v8_52.py — Repoint the frontend + Telegram bot to the COMMUNITY V8.52b chain
(2026-09-04 cutover: dark 2:00 PM / early 3:00 PM / main 4:00 PM local, UTC-4). Derived from
update_addrs_v8_51.py on 2026-09-04 (session 62, handoff 62.19).

WHAT IS DIFFERENT FROM THE V8.51 TOOL
  1. TWO OLD BOOKS. The admin branch was repointed at the PRIVATE b-chain (tiers 1-3 +
     core) while tiers 4-10 in the pages still carry V8.51 addresses. So replacements are
     derived from BOTH deployed_addresses_v8_52b_private.json AND deployed_addresses_v8_51.json,
     and the residue sweep checks both.
  2. GUARD: CONFIRM_TIER_ROUTER (env) must equal the NEW book's tierRouter, and the NEW book
     must be matrixSize 127 with all ten tiers — a 15-seat private book is refused.
  3. Gate epochs move to Fri 2026-09-04: EARLY 19:00Z / MAIN 20:00Z.
  4. Private-chain labels (V8.52b PRIVATE / v8.52b-private) are replaced by the community ones.
--- original header follows ---
update_addrs_v8_51.py — Repoint the frontend + Telegram bot from V8.50 to the V8.51
COMMUNITY chain, and move the launch gate to Tue 1 Sept 2026 1:00 PM / 2:00 PM local.

Run from C:\\CryptoNova-Testnet-App :   set CONFIRM_TIER_ROUTER=0x... then  python update_addrs_v8_52.py
Preview without writing:                set DRY_RUN=1 first.

MANDATORY (CLAUDE.md rule): api/telegram-qa.js stays in ALL_FILES — the bot's hardcoded
addresses and SYSTEM_PROMPT version label go stale after every deploy.

WHAT IS NEW OVER update_addrs_v8_50.py
  1. GUARD: refuses to run unless the NEW address book is the COMMUNITY V8.51 chain,
     checked by tierRouter == 0x73772F4f4ACF7DcE64a69060878A92fD272c7CD8.
     ⛔ Why: deployed_addresses_v8_51.json, _v8_51_private.json and _v8_51_gate2.json all
     exist and are one character apart. Session 49.1d lost a whole session to exactly that
     confusion, and pointing the LIVE frontend at a 15-seat private gate chain would send
     members to a chain that is not theirs. Naming a file is not the same as checking it.
  2. GUARD: refuses to run if it finds no address replacements at all (means the two JSON
     files were misread, or OLD is already NEW — writing nothing silently is how a cutover
     "succeeds" without cutting over).
  3. Moves the launch gate epochs in index.html (EARLY_MS / MAIN_MS) to today's times.
     ⚠ admin.* is UNGATED ("Admin always open", index.html:505), so leaders can register
     on admin.crypto-nova.app the moment this is pushed — the gate only holds early./
     preview./main back until 1:00 PM / 2:00 PM.
  4. DRY_RUN=1 prints the plan and writes nothing.
"""
import os, json, sys

CONTRACTS_DIR = os.environ.get("CONTRACTS_DIR", r"C:\CryptoNite-Smart-Contracts\CryptoNova")
BASE          = os.environ.get("FRONTEND_DIR",  r"C:\CryptoNova-Testnet-App")
DRY_RUN       = os.environ.get("DRY_RUN", "") == "1"

OLD_JSONS = [os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_52b_private.json"),
             os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_51.json")]
NEW_JSON  = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_52.json")

EXPECT_TIER_ROUTER = os.environ.get("CONFIRM_TIER_ROUTER", "").strip().lower()
if not EXPECT_TIER_ROUTER.startswith("0x") or len(EXPECT_TIER_ROUTER) != 42:
    print("FATAL: set CONFIRM_TIER_ROUTER=<the community V8.52 tierRouter from deployed_addresses_v8_52.json>. NOTHING WRITTEN.")
    sys.exit(1)
for _old in ("0x73772f4f4acf7dce64a69060878a92fd272c7cd8", "0x72daf5647dff8e71d0c4ecb768b19e77dcbcba63", "0xfc95cb575d2728f7db0eec1e9a6b13385553d3c9"):
    if EXPECT_TIER_ROUTER == _old:
        print("FATAL: CONFIRM_TIER_ROUTER is an OLD router (V8.51 community or a V8.52 private chain). NOTHING WRITTEN.")
        sys.exit(1)
import subprocess
try:
    _branch = subprocess.run(["git", "-C", BASE, "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, timeout=20).stdout.strip()
except Exception as e:
    _branch = f"(unreadable: {e})"
if _branch != "admin":
    print(f"FATAL: frontend repo is on branch '{_branch}', not 'admin'. The ladder starts at admin. NOTHING WRITTEN.")
    sys.exit(1)
print("  GUARD OK: branch admin")

# Launch gate — Fri 4 Sept 2026, local (UTC-4): dark 2:00 PM, early 3:00 PM, main 4:00 PM
# (owner moved it forward from Sat 09-05 on the morning of 09-04)
OLD_EARLY_MS, NEW_EARLY_MS = "1788282000000", "1788548400000"   # 3:00 PM -> 19:00 UTC
OLD_MAIN_MS,  NEW_MAIN_MS  = "1788285600000", "1788552000000"   # 4:00 PM -> 20:00 UTC

def flatten_addrs(obj, prefix=""):
    result = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            result.update(flatten_addrs(v, prefix + k + "."))
    elif isinstance(obj, str) and obj.startswith("0x") and len(obj) == 42:
        result[prefix.rstrip(".")] = obj
    return result

old_datas = []
for oj in OLD_JSONS:
    print(f"Reading OLD addresses from: {oj}")
    with open(oj, "r", encoding="utf-8-sig") as f:
        old_datas.append(json.load(f))
old_data = old_datas[0]   # kept for the residue sweep's signature; both books are swept below
print(f"Reading NEW addresses from: {NEW_JSON}")
with open(NEW_JSON, "r", encoding="utf-8-sig") as f:
    new_data = json.load(f)

# ── GUARD 1: is NEW really the community chain? ──────────────────────────────
got = str(new_data.get("tierRouter", "")).lower()
if got != EXPECT_TIER_ROUTER:
    print("\n" + "=" * 78)
    print("FATAL: the NEW book's tierRouter does not match CONFIRM_TIER_ROUTER. NOTHING WRITTEN.")
    print(f"  CONFIRM_TIER_ROUTER : {EXPECT_TIER_ROUTER}")
    print(f"  book tierRouter     : {got or '(missing)'}")
    print("=" * 78)
    sys.exit(1)
if int(new_data.get("matrixSize", 0)) != 127 or len(new_data.get("tiers", {})) != 10:
    print(f"FATAL: NEW book is matrixSize {new_data.get('matrixSize')} with {len(new_data.get('tiers', {}))} tiers — the COMMUNITY chain is 127 / 10. A private book must never reach members. NOTHING WRITTEN.")
    sys.exit(1)
print(f"  GUARD OK: tierRouter {new_data['tierRouter']} — community V8.52 chain confirmed by two sources")
print(f"  matrixSize {new_data.get('matrixSize')}  tiers {len(new_data.get('tiers', {}))}  network {new_data.get('network')}")

new_flat = flatten_addrs(new_data)
old_flat = {}
for od in old_datas:               # first book wins on a key; both contribute
    for k, v in flatten_addrs(od).items():
        old_flat.setdefault(k, v)
# union of every old VALUE per key (a key may carry a different address in each old book)
# Keep the ORIGINAL (checksum) case of each old value: the replace loop below matches the
# exact-case string first and the lowercase form second, so a lowercased entry would leave
# every checksummed occurrence in the pages untouched (the residue sweep caught exactly that
# on the first run of this tool, 2026-09-04).
old_values = {}
for od in old_datas:
    for k, v in flatten_addrs(od).items():
        old_values.setdefault(k, {})[v.lower()] = v
REPLACEMENTS = []
for key, vals in old_values.items():
    if key in new_flat:
        for ov_l, ov in vals.items():
            if ov_l != new_flat[key].lower():
                REPLACEMENTS.append((ov, new_flat[key]))

# ── GUARD 2: writing nothing is not success ──────────────────────────────────
if not REPLACEMENTS:
    print("\nFATAL: zero address replacements derived. NOTHING WRITTEN.")
    print("  Either the two files are the same book, or the key shapes did not line up.")
    sys.exit(1)
addr_count = len(REPLACEMENTS)

# ── Launch gate (specific numbers BEFORE any blanket label swaps) ────────────
REPLACEMENTS.append((OLD_EARLY_MS, NEW_EARLY_MS))
REPLACEMENTS.append((OLD_MAIN_MS,  NEW_MAIN_MS))
REPLACEMENTS.append(("Tue Sep 1 2026 1:00 PM local (17:00 UTC)", "Fri Sep 4 2026 3:00 PM local (19:00 UTC)"))
REPLACEMENTS.append(("Tue Sep 1 2026 2:00 PM local (18:00 UTC)", "Fri Sep 4 2026 4:00 PM local (20:00 UTC)"))

# ── Version strings (specific line FIRST, blanket labels after) ──────────────
REPLACEMENTS.append((
    "V8.52b PRIVATE — deployed 2026-09-04 — ONE DOOR; the circulation enters the full pair that waited longest (R1, owner design); MATRIX_SIZE 15, tiers 1-3 only, owner test chain, USDC reused",
    "V8.52 — deployed 2026-09-04 — the later-pair freeze fixed: one door, and members cycling out now enter a full later pair and turn it (REGRESSION_REGISTER R1); MATRIX_SIZE 127, USDC reused"
))
REPLACEMENTS.append(("## Contracts (Base Sepolia — V8.52b PRIVATE)", "## Contracts (Base Sepolia — V8.52)"))
REPLACEMENTS.append(("## Contracts (Base Sepolia — V8.51)", "## Contracts (Base Sepolia — V8.52)"))
REPLACEMENTS.append(("[v8.52b-private]", "[v8.52]"))
REPLACEMENTS.append(("v8.52b-private", "v8.52"))
REPLACEMENTS.append(("V8.52b PRIVATE", "V8.52"))
REPLACEMENTS.append(("[v8.51]", "[v8.52]"))
REPLACEMENTS.append(("v8.51", "v8.52"))
REPLACEMENTS.append(("V8.51", "V8.52"))

print(f"\n{addr_count} address change(s) + {len(REPLACEMENTS)-addr_count} label/gate change(s):")
for old, new in REPLACEMENTS[:8]:
    print(f"  {old[:44]} -> {new[:44]}")
if len(REPLACEMENTS) > 8:
    print(f"  ... and {len(REPLACEMENTS)-8} more")

# MANDATORY: api/telegram-qa.js must always be in this list.
ALL_FILES = [
    "index.html", "status.html", "buy.html", "governance.html", "liquidity.html", "early.html",
    "compensation.html", "faq.html", "terms.html",
    # pif.html ADDED 2026-09-02 (session 57). It was NOT on this list at the V8.51
    # cutover, so it kept V8.50's tierRouter + couponRegistry and told a member
    # "already a registered CryptoNova member" (true on V8.50) while the dashboard,
    # reading V8.51, said "Not Yet Registered". Same wallet, same app, opposite
    # answers. The RESIDUE_SWEEP below exists so a hand-kept list can never again
    # fail silently -- see it before adding any file here.
    "pif.html",
    "locales/en.json",
    "api/telegram-qa.js",
]

if DRY_RUN:
    print("\nDRY_RUN=1 — nothing written. Unset it and re-run to apply.")
    sys.exit(0)

total_changes, touched = 0, []
for fname in ALL_FILES:
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        print(f"  SKIP (not found): {fname}")
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()
    original, changes = c, 0
    for old, new in REPLACEMENTS:
        if old in c:
            n = c.count(old); c = c.replace(old, new); changes += n
        if old.startswith("0x") and old.lower() in c:
            n = c.lower().count(old.lower()); c = c.replace(old.lower(), new.lower()); changes += n
    if c != original:
        tmp = fpath + ".new"
        with open(tmp, "w", encoding="utf-8", newline="\n") as f:
            f.write(c)
        os.replace(tmp, fpath)
        print(f"  UPDATED {fname}: {changes} replacement(s)")
        total_changes += changes
        touched.append(fname)
    else:
        print(f"  NO CHANGES: {fname}")

print(f"\nDone. Total replacements: {total_changes}")

# ── Post-run gate check, read back from disk rather than assumed ─────────────
idx = os.path.join(BASE, "index.html")
if os.path.exists(idx):
    with open(idx, "r", encoding="utf-8") as f:
        c = f.read()
    print("\nGATE READ BACK FROM index.html:")
    print(f"  EARLY_MS {NEW_EARLY_MS} present : {NEW_EARLY_MS in c}")
    print(f"  MAIN_MS  {NEW_MAIN_MS} present : {NEW_MAIN_MS in c}")
    print(f"  old V8.51 epochs still present : {OLD_EARLY_MS in c or OLD_MAIN_MS in c}  (must be False)")
    print(f"  private label still present    : {'V8.52b PRIVATE' in c or 'v8.52b-private' in c}  (must be False)")

print("\n" + "=" * 78)
print("⛔ DO NOT `git add -A` OR `git commit -a` IN THIS REPO.")
print("   1,171 files show as modified and EVERY ONE is line-endings only")
print("   (`git diff --ignore-cr-at-eol` is empty). Committing them would bury the real")
print("   address change in 238,000 lines of CRLF churn. Add ONLY the files listed below.")
print("=" * 78)
if touched:
    print("\ngit add " + " ".join(touched))
# ---------------------------------------------------------------------------
# RESIDUE SWEEP (added 2026-09-02, session 57).
# ALL_FILES is hand-maintained, so anything not on it is stale BY DEFAULT and
# nothing says so. pif.html sat on V8.50 addresses through the whole V8.51
# cutover for exactly that reason: it told a member "already a registered
# CryptoNova member" (true on V8.50) while the dashboard, reading V8.51, said
# "Not Yet Registered". This sweep reads every .html and api/*.js in the repo --
# not a list -- and FAILS if any still carries an address that exists in the OLD
# book but not the NEW one. A list that cannot detect its own omissions is not a
# safeguard.
def _flat_addrs(obj, out):
    """Addresses live at the top level AND nested under tiers/libraries."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str) and v.startswith("0x") and len(v) == 42:
                out[v.lower()] = k
            else:
                _flat_addrs(v, out)
    elif isinstance(obj, list):
        for v in obj:
            _flat_addrs(v, out)
    return out

def residue_sweep():
    import glob
    old_map = {}
    for od in old_datas:
        _flat_addrs(od, old_map)
    new_map = _flat_addrs(new_data, {})
    stale = {a: k for a, k in old_map.items() if a not in new_map}
    scanned, bad = 0, []
    for path in sorted(glob.glob(os.path.join(BASE, "*.html"))
                       + glob.glob(os.path.join(BASE, "api", "*.js"))):
        try:
            body = open(path, encoding="utf-8", errors="replace").read().lower()
        except OSError:
            continue
        scanned += 1
        for addr, key in stale.items():
            if addr in body:
                bad.append((os.path.relpath(path, BASE), key))
    print("\nRESIDUE SWEEP: %d files scanned against %d superseded addresses."
          % (scanned, len(stale)))
    if bad:
        for f, k in sorted(set(bad)):
            print("  STALE  %-24s still carries the OLD %s" % (f, k))
        print("  -> add it to ALL_FILES (or fix by hand) and re-run. NOT committing.")
        sys.exit(1)
    print("  clean - no file outside ALL_FILES carries a superseded address.")

residue_sweep()

print("\nNEXT: audit_frontend_abi.js (0 MISSING / 0 SHAPE DRIFT) -> commit those files ->")
print("      git push origin admin -> owner tests -> Fri 09-04: preview (early 3:00 PM) -> main (4:00 PM).")
