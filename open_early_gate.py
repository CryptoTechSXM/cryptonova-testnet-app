"""open_early_gate.py — Make early.crypto-nova.app auto-open (skip coupon form)."""
import os

fpath = r"C:\CryptoNova-Testnet-App\index.html"

with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()

OLD = "        if (EARLY_MS - Date.now() <= 0) { openEarlyCoupon(); } else { earlyTick(); }"
NEW = "        if (EARLY_MS - Date.now() <= 0) { document.getElementById('maintenance-gate').remove(); } else { earlyTick(); }"

if OLD not in content:
    print("ERROR: target line not found — check index.html manually")
else:
    content = content.replace(OLD, NEW)
    tmp = fpath + ".new"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    os.replace(tmp, fpath)
    print("Done! Early gate now auto-opens when timestamp is past.")

# Truncation check
with open(fpath, "rb") as f:
    f.seek(max(0, os.path.getsize(fpath) - 80))
    tail = f.read().decode("utf-8", errors="replace").strip()
print(f"Tail: ...{tail[-50:]!r}")
