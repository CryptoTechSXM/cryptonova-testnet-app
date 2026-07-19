"""open_gate.py — Set EARLY_MS and MAIN_MS to 1000 (past) so gate opens immediately."""
import re, os

fpath = r"C:\CryptoNova-Testnet-App\index.html"

with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()

original = content

# Replace timestamps with 1000 (far in the past = gate opens immediately)
content, n1 = re.subn(r'var EARLY_MS\s*=\s*\d+;[^\n]*', 'var EARLY_MS = 1000; // gate open', content)
content, n2 = re.subn(r'var MAIN_MS\s*=\s*\d+;[^\n]*',  'var MAIN_MS  = 1000; // gate open', content)

# Update any pill labels referencing times
for old_label, new_label in [
    ('Opens 9:25 PM EDT', 'Now Open'),
    ('Opens 9:30 PM EDT', 'Now Open'),
    ('Opens 9:25 AM EDT', 'Now Open'),
    ('Opens 9:30 AM EDT', 'Now Open'),
    ('Opens 9:20 AM EDT', 'Now Open'),
    ('Opens 9:40 PM EDT', 'Now Open'),
    ('Opens 9:45 PM EDT', 'Now Open'),
]:
    content = content.replace(old_label, new_label)

if content == original:
    print("ERROR: No replacements found — check EARLY_MS/MAIN_MS variable names in index.html")
else:
    tmp = fpath + ".new"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    os.replace(tmp, fpath)
    print(f"Done! EARLY_MS swaps: {n1}  MAIN_MS swaps: {n2}")

# Truncation check
with open(fpath, "rb") as f:
    f.seek(max(0, os.path.getsize(fpath) - 200))
    tail = f.read().decode("utf-8", errors="replace")
print("\nTail of index.html:")
print(tail)
