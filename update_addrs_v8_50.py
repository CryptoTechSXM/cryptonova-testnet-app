"""
update_addrs_v8_50.py — Replace all V8.48 contract addresses with V8.50 across the
frontend + the Telegram bot. Run from CryptoNova-Testnet-App AFTER deploy_v8.js has
written deployed_addresses_v8_50.json:  python update_addrs_v8_50.py

MANDATORY (CLAUDE.md rule): api/telegram-qa.js stays in ALL_FILES — the bot's
hardcoded addresses and SYSTEM_PROMPT version label go stale after every deploy.

V8.50 notes over the v8_48 script:
  - Paths are env-overridable (CONTRACTS_DIR / FRONTEND_DIR) so the same script runs
    from Claude's session shell as well as PowerShell. Defaults unchanged.
  - The distributeInterval waiver (G.8's one accepted MISSING row) was removed by hand
    at this cutover, BEFORE this pass — audit_frontend_abi.js pass is now 0 MISSING /
    0 SHAPE DRIFT. If G.8 reports anything, it is NEW and must be triaged.
  - Stale-label list carries V8.47/V8.43/V8.31/V8.30/V8.29/V8.11 forward to V8.50.
"""
import os, json
CONTRACTS_DIR = os.environ.get("CONTRACTS_DIR", r"C:\CryptoNite-Smart-Contracts\CryptoNova")
BASE          = os.environ.get("FRONTEND_DIR", r"C:\CryptoNova-Testnet-App")
OLD_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_48.json")
NEW_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_50.json")

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
old_flat = flatten_addrs(old_data)
new_flat = flatten_addrs(new_data)

REPLACEMENTS = []
for key in old_flat:
    if key in new_flat and old_flat[key].lower() != new_flat[key].lower():
        REPLACEMENTS.append((old_flat[key], new_flat[key]))

# ── Version strings (specific lines FIRST, blanket labels after) ─────────────
REPLACEMENTS.append((
    "V8.48 — deployed 2026-08-13 — full locked scope: items 1-48 (see V8_48_SCOPE.md); bulk gate, GhostFloor package, calendar distributions, epochs 1000/180d, proposal fee",
    "V8.50 — deployed 2026-08-26 — the crossing redesign (see V8_50_SCOPE.md): pre-funded crossings (item A), no mid-cycle eviction (B), member-level carry (E1), CW work-order fix, cap-1 keeper, PARAM 59 = 5000"
))
REPLACEMENTS.append(("## Contracts (Base Sepolia — V8.48)", "## Contracts (Base Sepolia — V8.50)"))
REPLACEMENTS.append(("[v8.48]", "[v8.50]"))
REPLACEMENTS.append(("v8.48", "v8.50"))
REPLACEMENTS.append(("V8.48", "V8.50"))
for stale in ("V8.47", "V8.43", "V8.31", "V8.30", "V8.29", "V8.11"):
    REPLACEMENTS.append((stale, "V8.50"))

print(f"\nFound {len(REPLACEMENTS)} replacement(s):")
for old, new in REPLACEMENTS[:10]:
    print(f"  {old[:42]} -> {new[:42]}")
if len(REPLACEMENTS) > 10:
    print(f"  ... and {len(REPLACEMENTS)-10} more")

# MANDATORY: api/telegram-qa.js must always be in this list.
ALL_FILES = [
    "index.html", "status.html", "buy.html", "governance.html", "liquidity.html", "early.html",
    "compensation.html", "faq.html", "terms.html",
    "locales/en.json",
    "api/telegram-qa.js",
]
total_changes = 0
for fname in ALL_FILES:
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        print(f"  SKIP (not found): {fname}")
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()
    original = c
    changes = 0
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
    else:
        print(f"  NO CHANGES: {fname}")
print(f"\nDone. Total replacements: {total_changes}")
print("\nNEXT (see GO_LIVE_RUNBOOK.md PHASE 3): tail -5 index.html · en.json JSON-valid ·")
print("audit_frontend_abi.js must report 0 MISSING / 0 SHAPE DRIFT · git push origin admin.")
