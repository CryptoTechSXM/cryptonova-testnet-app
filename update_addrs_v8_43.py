"""
update_addrs_v8_43.py — Replace all V8.42 contract addresses with V8.43 in frontend HTML files.
Run from CryptoNova-Testnet-App: python update_addrs_v8_43.py
"""
import os, json
CONTRACTS_DIR = r"C:\CryptoNite-Smart-Contracts\CryptoNova"
BASE          = r"C:\CryptoNova-Testnet-App"
OLD_JSON = os.path.join(CONTRACTS_DIR, "deployed_addresses_v8_42.json")            # scp'd from VPS (utf-8)
NEW_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_43.json") # written by deploy_v8.js
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
# Build old->new replacement pairs (only where both exist and differ)
REPLACEMENTS = []
for key in old_flat:
    if key in new_flat and old_flat[key].lower() != new_flat[key].lower():
        REPLACEMENTS.append((old_flat[key], new_flat[key]))
# Version comment update (matches the line inside the ADDRS block)
REPLACEMENTS.append((
    "V8.42 — deployed 2026-07-20 — Hybrid self-sustaining + expansion routing (pairExpansionThreshold=381)",
    "V8.43 — deployed 2026-07-23 — additive toggles + two-threshold pair opening + upgrade-at-cross + overflow rescue"
))
# Version tag used in console logs / comments
REPLACEMENTS.append(("[v8.42]", "[v8.43]"))
REPLACEMENTS.append(("v8.42", "v8.43"))
# Telegram bot system prompt version label (MANDATORY — bot goes stale without this)
REPLACEMENTS.append((
    "## Contracts (Base Sepolia — V8.42)",
    "## Contracts (Base Sepolia — V8.43)"
))
print(f"\nFound {len(REPLACEMENTS)} replacement(s):")
for old, new in REPLACEMENTS[:10]:
    print(f"  {old[:42]} -> {new[:42]}")
if len(REPLACEMENTS) > 10:
    print(f"  ... and {len(REPLACEMENTS)-10} more")
# MANDATORY: api/telegram-qa.js must always be in this list — bot goes stale after every deploy.
ALL_FILES = [
    "index.html", "status.html", "buy.html", "governance.html", "liquidity.html", "early.html",
    "api/telegram-qa.js",
]
total_changes = 0
for fname in ALL_FILES:
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
print("  2. git add -A && git commit -m 'chore(V8.43): update all contract addresses'")
print("  3. git push origin admin   (preview/main stay on V8.42 until cutover)")
