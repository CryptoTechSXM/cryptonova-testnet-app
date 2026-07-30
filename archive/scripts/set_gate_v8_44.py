"""
set_gate_v8_44.py - set the V8.44 go-live gate.

  early.crypto-nova.app  -> EARLY_MS (preview / leaders)
  crypto-nova.app        -> MAIN_MS  (community go-live)
  admin.crypto-nova.app  -> never gated

EDIT THE TWO LINES BELOW, then run:  python set_gate_v8_44.py
Epoch values are milliseconds UTC. Handy conversions (EDT = UTC-4):
  3:00 PM EDT Sat 2026-07-25 = 1785006000000
  4:00 PM EDT Sat 2026-07-25 = 1785009600000
  5:00 PM EDT Sat 2026-07-25 = 1785013200000
  6:00 PM EDT Sat 2026-07-25 = 1785016800000
  1000  = "already open" (gate removed immediately)
"""
import os, re

EARLY_MS_NEW  = 1785006000000   # preview (early.) opens 3:00 PM EDT
MAIN_MS_NEW   = 1785007800000   # main opens 3:30 PM EDT
EARLY_LABEL   = "V8.44 Early Access - Opening 3:00 PM EDT"
MAIN_LABEL    = "V8.44 Testnet - Opening 3:30 PM EDT"

fpath = r"C:\CryptoNova-Testnet-App\index.html"
with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()
original = content

content, n1 = re.subn(r'var EARLY_MS\s*=\s*\d+;[^\n]*',
                      f'var EARLY_MS = {EARLY_MS_NEW}; // V8.44 preview open', content)
content, n2 = re.subn(r'var MAIN_MS\s*=\s*\d+;[^\n]*',
                      f'var MAIN_MS  = {MAIN_MS_NEW}; // V8.44 go-live', content)

# Pill labels (the small text on the gate screen)
content, n3 = re.subn(r"pl\.textContent = '[^']*'",
                      f"pl.textContent = '{EARLY_LABEL}'", content)
content, n4 = re.subn(r"pl2\.textContent = '[^']*'",
                      f"pl2.textContent = '{MAIN_LABEL}'", content)

print(f"EARLY_MS replaced: {n1}")
print(f"MAIN_MS  replaced: {n2}")
print(f"early label:       {n3}")
print(f"main label:        {n4}")

if content == original:
    print("ERROR: nothing changed - check the variable names in index.html")
    raise SystemExit(1)

tmp = fpath + ".new"
with open(tmp, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
os.replace(tmp, fpath)

# strip any trailing null bytes (mount-sync safety)
data = open(fpath, "rb").read().rstrip(b"\x00")
open(fpath, "wb").write(data)

# MANDATORY truncation check
with open(fpath, "rb") as f:
    f.seek(max(0, os.path.getsize(fpath) - 60))
    tail = f.read().decode("utf-8", errors="replace").strip()
print("\nTail of index.html:", tail[-30:])
print("TRUNCATION CHECK:", "PASS" if tail.endswith("</body></html>") else "*** FAIL - DO NOT PUSH ***")
