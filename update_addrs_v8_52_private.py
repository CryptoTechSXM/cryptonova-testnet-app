"""
update_addrs_v8_52_private.py — Repoint the ADMIN BRANCH ONLY from community V8.51 to the
PRIVATE V8.52 chain (MATRIX_SIZE 15, tiers 1-3) for the owner's customer-experience test
(V8_50_HANDOFF.md 62.8). Derived 2026-09-03 (session 62) from update_addrs_v8_51.py.

⛔ THIS IS A PRIVATE CHAIN. PUSH `admin` ONLY. NEVER preview, NEVER main.
⚠ TIERS 4-10 ARE NOT ON THE PRIVATE CHAIN and keep their V8.51 addresses in the pages —
   a deliberate mixed view, listed loudly below. If the page misbehaves on T4+, that is a
   finding for the next deploy (deploy all 10 tiers at size 15), not something to patch here.

DIFFERENCES FROM THE V8.51 SCRIPT:
  1. GUARD 1 takes the expected router from the environment: CONFIRM_TIER_ROUTER must be set
     AND equal the new book's tierRouter AND differ from the community V8.51 router.
  2. GUARD 3: the frontend repo must be on branch `admin`.
  3. No launch-gate epoch changes (admin is ungated: index.html "Admin always open").
  4. The residue sweep flags only REPLACED addresses left behind; carried-over T4-T10 keys
     are printed as a warning, not a failure.
--- original header follows ---
update_addrs_v8_51.py — Repoint the frontend + Telegram bot from V8.50 to the V8.51
COMMUNITY chain, and move the launch gate to Tue 1 Sept 2026 1:00 PM / 2:00 PM local.

Run from C:\\CryptoNova-Testnet-App :   set CONFIRM_TIER_ROUTER=0x... then  python update_addrs_v8_52_private.py
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

OLD_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_51.json")
NEW_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_52_private.json")

# The community V8.51 router — the private chain must NOT be this.
COMMUNITY_TIER_ROUTER = "0x73772f4f4acf7dce64a69060878a92fd272c7cd8"
# The private V8.52 router is not known until the deploy finishes, so it is supplied by the
# operator and cross-checked against the book — two independent sources must agree.
EXPECT_TIER_ROUTER = os.environ.get("CONFIRM_TIER_ROUTER", "").strip().lower()
if not EXPECT_TIER_ROUTER.startswith("0x") or len(EXPECT_TIER_ROUTER) != 42:
    print("FATAL: set CONFIRM_TIER_ROUTER=<the private V8.52 tierRouter from the addresses file>. NOTHING WRITTEN.")
    sys.exit(1)
if EXPECT_TIER_ROUTER == COMMUNITY_TIER_ROUTER:
    print("FATAL: CONFIRM_TIER_ROUTER is the COMMUNITY V8.51 router. This script is for the private chain only. NOTHING WRITTEN.")
    sys.exit(1)

# GUARD 3: admin branch only.
import subprocess
try:
    _branch = subprocess.run(["git", "-C", BASE, "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, timeout=20).stdout.strip()
except Exception as e:
    _branch = f"(unreadable: {e})"
if _branch != "admin":
    print(f"FATAL: frontend repo is on branch '{_branch}', not 'admin'. A private chain may only be pointed at admin. NOTHING WRITTEN.")
    sys.exit(1)
print(f"  GUARD OK: branch admin")


def flatten_addrs(obj, prefix=""):
    result = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            result.update(flatten_addrs(v, prefix + k + "."))
    elif isinstance(obj, str) and obj.startswith("0x") and len(obj) == 42:
        result[prefix.rstrip(".")] = obj
    return result

print(f"Reading OLD addresses from: {OLD_JSON}")
with open(OLD_JSON, "r", encoding="utf-8-sig") as f:
    old_data = json.load(f)
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
print(f"  GUARD OK: tierRouter {new_data['tierRouter']} — private V8.52 chain confirmed by two sources")
print(f"  matrixSize {new_data.get('matrixSize')}  network {new_data.get('network')}")

old_flat, new_flat = flatten_addrs(old_data), flatten_addrs(new_data)
REPLACEMENTS = []
for key in old_flat:
    if key in new_flat and old_flat[key].lower() != new_flat[key].lower():
        REPLACEMENTS.append((old_flat[key], new_flat[key]))

# ── GUARD 2: writing nothing is not success ──────────────────────────────────
if not REPLACEMENTS:
    print("\nFATAL: zero address replacements derived. NOTHING WRITTEN.")
    print("  Either the two files are the same book, or the key shapes did not line up.")
    sys.exit(1)
addr_count = len(REPLACEMENTS)

# No launch-gate changes: admin is ungated ("Admin always open", index.html).
# Carried-over keys (present in OLD, absent in NEW) — say so out loud.
_carried = sorted(k for k in old_flat if k not in new_flat)
print(f"\n⚠ {len(_carried)} address key(s) exist in V8.51 but NOT on the private chain and are CARRIED OVER UNCHANGED (tiers 4-10 etc.):")
for k in _carried:
    print(f"    {k}")

# ── Version strings (specific line FIRST, blanket labels after) ──────────────
REPLACEMENTS.append((
    "V8.51 — deployed 2026-09-01 — seating fixes on top of the crossing redesign: graduation routing (item G, MemberGraduated), rescue overflow to a pair with room (item S), MATRIX_SIZE 127, USDC reused from V8.50",
    "V8.52 PRIVATE — deployed 2026-09-03 — front door = least-rotated FULL MatA (REGRESSION_REGISTER R1); MATRIX_SIZE 15, tiers 1-3 only, owner test chain, USDC reused"
))
REPLACEMENTS.append(("## Contracts (Base Sepolia — V8.51)", "## Contracts (Base Sepolia — V8.52 PRIVATE)"))
REPLACEMENTS.append(("[v8.51]", "[v8.52-private]"))
REPLACEMENTS.append(("v8.51", "v8.52-private"))
REPLACEMENTS.append(("V8.51", "V8.52 PRIVATE"))

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

# Read back: the new router must be in index.html and the community router must not.
idx = os.path.join(BASE, "index.html")
if os.path.exists(idx):
    with open(idx, "r", encoding="utf-8") as f:
        c = f.read().lower()
    print("\nROUTER READ BACK FROM index.html:")
    print(f"  private router present   : {EXPECT_TIER_ROUTER in c}  (must be True)")
    print(f"  community router present : {COMMUNITY_TIER_ROUTER in c}  (must be False)")

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
    old_map = _flat_addrs(old_data, {})
    new_map = _flat_addrs(new_data, {})
    # Only addresses that were REPLACED count as stale; keys absent from the private
    # book (tiers 4-10) are carried over on purpose and were listed above.
    replaced_keys = {k for k in old_flat if k in new_flat and old_flat[k].lower() != new_flat[k].lower()}
    stale = {old_flat[k].lower(): k for k in replaced_keys}
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
print("      git push origin admin ONLY -> owner tests at admin.crypto-nova.app. NEVER preview/main.")
