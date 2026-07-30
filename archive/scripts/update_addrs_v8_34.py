"""
update_addrs_v8_34.py — Replace all V8.33 contract addresses with V8.34 in the frontend HTML files.

Reads addresses dynamically from deployed_addresses_v8_33.json and deployed_addresses_v8_34.json,
so no addresses need to be hardcoded. Run AFTER V8.34 deploy.

Run from: python update_addrs_v8_34.py
"""
import os, json

CONTRACTS_DIR = r"C:\CryptoNite-Smart-Contracts\CryptoNova\scripts"
BASE          = r"C:\CryptoNova-Testnet-App"

OLD_JSON = os.path.join(CONTRACTS_DIR, "deployed_addresses_v8_33_real.json")
NEW_JSON = os.path.join(CONTRACTS_DIR, "deployed_addresses_v8_34.json")

def flatten_addrs(obj, prefix=""):
    """Recursively extract all address strings from nested JSON."""
    result = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            result.update(flatten_addrs(v, prefix + k + "."))
    elif isinstance(obj, str) and obj.startswith("0x") and len(obj) == 42:
        result[prefix.rstrip(".")] = obj
    return result

print(f"Reading OLD addresses from: {OLD_JSON}")
with open(OLD_JSON, "r") as f:
    old_data = json.load(f)

print(f"Reading NEW addresses from: {NEW_JSON}")
with open(NEW_JSON, "r") as f:
    new_data = json.load(f)

old_flat = flatten_addrs(old_data)
new_flat = flatten_addrs(new_data)

# Build old->new replacement pairs (only where both exist and differ)
REPLACEMENTS = []
for key in old_flat:
    if key in new_flat and old_flat[key].lower() != new_flat[key].lower():
        REPLACEMENTS.append((old_flat[key], new_flat[key]))

# Add version comment replacement
REPLACEMENTS.append((
    "V8.33 — deployed 2026-07-08 — slot overflow fix, softParkIdle, extended idle timeouts, cancelCoupon, lastActivityTime on earnings",
    "V8.34 — deployed 2026-07-09 — reentrancy fix in enterFor(), RESCUE_REPAY_BPS=100%, referrer indexed, proposal fee 100 CNOVA"
))

print(f"\nFound {len(REPLACEMENTS)} address replacement(s):")
for old, new in REPLACEMENTS[:5]:
    print(f"  {old[:12]}... -> {new[:12]}...")
if len(REPLACEMENTS) > 5:
    print(f"  ... and {len(REPLACEMENTS)-5} more")

HTML_FILES = [
    "index.html",
    "status.html",
    "buy.html",
    "governance.html",
    "liquidity.html",
    "early.html",
]

total_changes = 0
for fname in HTML_FILES:
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        print(f"  SKIP (not found): {fname}")
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    changes = 0
    for old, new in REPLACEMENTS:
        # Case-insensitive address replacement
        lo = old.lower()
        if lo in content.lower():
            count = content.lower().count(lo)
            # Replace exact case and checksummed variations
            content = content.replace(old, new)
            content = content.replace(old.lower(), new.lower())
            content = content.replace(old.upper(), new.upper())
            changes += count
    if content != original:
        tmp = fpath + ".new"
        with open(tmp, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        os.replace(tmp, fpath)
        print(f"  UPDATED {fname}: {changes} replacement(s)")
        total_changes += changes
    else:
        print(f"  NO CHANGES: {fname}")

print(f"\nDone. Total replacements: {total_changes}")
print("\nNext: run truncation check on index.html, then commit and push admin branch.")
