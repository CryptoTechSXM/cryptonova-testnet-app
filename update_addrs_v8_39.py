"""
update_addrs_v8_39.py — Replace all V8.38 contract addresses with V8.39 in frontend HTML files.
Run from CryptoNova-Testnet-App: python update_addrs_v8_39.py
"""
import os, json

CONTRACTS_DIR = r"C:\CryptoNite-Smart-Contracts\CryptoNova"
BASE          = r"C:\CryptoNova-Testnet-App"

OLD_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_38_real.json")
NEW_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_39.json")

def flatten_addrs(obj, prefix=""):
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

# Version comment update (matches the line inside the ADDRS block)
REPLACEMENTS.append((
    "V8.38 — deployed 2026-07-17 — manualUpgrade() scans ALL MatBs across all pairs (TierRouter multi-pair fix), selfRescue-at-rotationCount=0 latent bug fixed",
    "V8.39 — deployed 2026-07-18 — keeperForceRotateRoot(), SF try/catch x2 (cycleOut+crossToPartner), deployAndWire try/catch, dust fix, MatrixPairFactory pairAdmin decoupled"
))

# Version tag used in console logs / comments
REPLACEMENTS.append(("[v8.38]", "[v8.39]"))
REPLACEMENTS.append(("v8.38", "v8.39"))

print(f"\nFound {len(REPLACEMENTS)} replacement(s):")
for old, new in REPLACEMENTS[:10]:
    print(f"  {old[:42]} -> {new[:42]}")
if len(REPLACEMENTS) > 10:
    print(f"  ... and {len(REPLACEMENTS)-10} more")

HTML_FILES = ["index.html", "status.html", "buy.html", "governance.html", "liquidity.html", "early.html"]

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
        if old in content:
            count = content.count(old)
            content = content.replace(old, new)
            changes += count
        # Also try lowercase hex addresses (some files use lowercase)
        if old.startswith("0x") and old.lower() in content:
            count = content.lower().count(old.lower())
            content = content.replace(old.lower(), new.lower())
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
print("\nNEXT STEPS:")
print("  1. tail -5 index.html  (must end </body></html>)")
print("  2. git add -A")
print("  3. git commit -m 'chore(V8.39): update all contract addresses'")
print("  4. git push origin admin")
print("  5. git show admin:index.html | Select-Object -Last 5  (truncation check)")
