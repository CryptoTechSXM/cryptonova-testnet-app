"""
update_addrs_v8_48.py — Replace all V8.47 contract addresses with V8.48 across the
frontend + the Telegram bot. Run from CryptoNova-Testnet-App AFTER deploy_v8.js has
written deployed_addresses_v8_48.json:  python update_addrs_v8_48.py

MANDATORY (CLAUDE.md rule): api/telegram-qa.js stays in ALL_FILES — the bot's
hardcoded addresses and SYSTEM_PROMPT version label go stale after every deploy.

V8.48 additions over the v8_47 script:
  - compensation.html / faq.html / terms.html added to ALL_FILES — their maintenance
    GATES carry version strings ("V8.43", "V8.31") the address pass never touched;
    the string replacements below now catch every known stale label per the
    2026-08-13 PARITY_AUDIT (section 11).
  - en.json added — three keys still said "V8.11".
  - The bot's header comment said "V8.41" while its label said V8.47 — both patterns
    are included so neither survives.
"""
import os, json
CONTRACTS_DIR = r"C:\CryptoNite-Smart-Contracts\CryptoNova"
BASE          = r"C:\CryptoNova-Testnet-App"
OLD_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_47.json")
NEW_JSON = os.path.join(CONTRACTS_DIR, "scripts", "deployed_addresses_v8_48.json")

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

# ── Version strings ──────────────────────────────────────────────────────────
# ADDRS-block comment line (fill the deploy date in on deploy day):
REPLACEMENTS.append((
    "V8.47 — deployed 2026-08-05 — member-level rescue-debt ledger (SF), upgrade-gate debt fold, split BPS 100/25/25",
    "V8.48 — deployed 2026-08-13 — full locked scope: items 1-48 (see V8_48_SCOPE.md); bulk gate, GhostFloor package, calendar distributions, epochs 1000/180d, proposal fee"
))
REPLACEMENTS.append(("[v8.47]", "[v8.48]"))
REPLACEMENTS.append(("v8.47", "v8.48"))
REPLACEMENTS.append(("V8.47", "V8.48"))
# Telegram bot label + the stale header comment variant (PARITY_AUDIT 11.2):
REPLACEMENTS.append(("## Contracts (Base Sepolia — V8.47)", "## Contracts (Base Sepolia — V8.48)"))
REPLACEMENTS.append(("// V8.41", "// V8.48"))
# Stale maintenance-gate / banner labels never bumped by earlier passes
# (PARITY_AUDIT 11.1 — comp/faq say V8.43, buy/liquidity/terms say V8.31,
#  governance gate says V8.31, en.json says V8.11):
for stale in ("V8.43", "V8.31", "V8.30", "V8.29", "V8.11"):
    REPLACEMENTS.append((stale, "V8.48"))

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
        content = f.read()
    original = content
    changes = 0
    for old, new in REPLACEMENTS:
        if old in content:
            count = content.count(old)
            content = content.replace(old, new)
            changes += count
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
print("\nNEXT STEPS (deploy day — see GO_LIVE_RUNBOOK.md):")
print("  1. tail -5 index.html  (must end </body></html>) — truncation check FIRST, always")
print("  2. Remove index.html's V8.47 fallbacks: the distributeInterval ABI line + call")
print("     (CW countdown), and the item-41 feature-detects — V8.48 getters are now real.")
print("  3. python -c \"import json; json.load(open('locales/en.json',encoding='utf-8'))\"  (locale must stay valid JSON)")
print("  4. npx hardhat run scripts/predeploy_check.js  (from the contracts repo — must PASS)")
print("  5. git add <explicit paths> && git commit -m 'chore(V8.48): address + version cutover'")
print("  6. git push origin admin — verify the Vercel PREVIEW, then promote per the runbook.")
