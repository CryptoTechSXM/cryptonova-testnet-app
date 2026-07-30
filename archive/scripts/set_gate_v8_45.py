"""
set_gate_v8_45.py - V8.45 emergency redeploy gate.

  early.crypto-nova.app  -> EARLY_MS (preview / leaders)
  crypto-nova.app        -> MAIN_MS  (community)
  admin.crypto-nova.app  -> NEVER gated (you keep working through the window)

Run:  python set_gate_v8_45.py

Epoch values are milliseconds UTC. EDT = UTC-4. Handy values for tonight:
  11:00 PM EDT Sat 2026-07-25 = 1785034800000
  11:30 PM EDT Sat 2026-07-25 = 1785036600000
  12:00 AM EDT Sun 2026-07-26 = 1785038400000
  12:30 AM EDT Sun 2026-07-26 = 1785040200000
   1:00 AM EDT Sun 2026-07-26 = 1785042000000
   1:30 AM EDT Sun 2026-07-26 = 1785043800000
  1000 = "open immediately"
SLIPPING? Just edit the two lines below and re-run + re-push. Moving the
countdown is cheap; missing your own stated time is not.
"""
import os, re

EARLY_MS_NEW  = 1785037500000   # preview opens 11:45 PM EDT
MAIN_MS_NEW   = 1785038400000   # main opens    12:00 AM EDT (midnight)
EARLY_LABEL   = "V8.45 Early Access - Opening 11:45 PM EDT"
MAIN_LABEL    = "V8.45 Testnet - Opening 12:00 AM EDT"

fpath = r"C:\CryptoNova-Testnet-App\index.html"
with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()
original = content

content, n1 = re.subn(r'var EARLY_MS\s*=\s*\d+;[^\n]*',
                      f'var EARLY_MS = {EARLY_MS_NEW}; // V8.45 preview', content)
content, n2 = re.subn(r'var MAIN_MS\s*=\s*\d+;[^\n]*',
                      f'var MAIN_MS  = {MAIN_MS_NEW}; // V8.45 go-live', content)
content, n3 = re.subn(r"pl\.textContent = '[^']*'",
                      f"pl.textContent = '{EARLY_LABEL}'", content)
content, n4 = re.subn(r"pl2\.textContent = '[^']*'",
                      f"pl2.textContent = '{MAIN_LABEL}'", content)

# Reword the maintenance screen for an emergency fix rather than a planned reset
content = content.replace(
    "V8.44 &mdash; Fresh Reset in Progress",
    "V8.45 &mdash; Emergency Fix in Progress")
content = content.replace(
    "V8.44 — Fresh Reset in Progress",
    "V8.45 — Emergency Fix in Progress")

print(f"EARLY_MS replaced: {n1}")
print(f"MAIN_MS  replaced: {n2}")
print(f"early label:       {n3}")
print(f"main label:        {n4}")

if content == original:
    print("ERROR: nothing changed - check variable names in index.html")
    raise SystemExit(1)

tmp = fpath + ".new"
with open(tmp, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
os.replace(tmp, fpath)

data = open(fpath, "rb").read().rstrip(b"\x00")
open(fpath, "wb").write(data)

with open(fpath, "rb") as f:
    f.seek(max(0, os.path.getsize(fpath) - 60))
    tail = f.read().decode("utf-8", errors="replace").strip()
print("\nTail:", tail[-30:])
print("TRUNCATION CHECK:", "PASS" if tail.endswith("</body></html>") else "*** FAIL - DO NOT PUSH ***")
