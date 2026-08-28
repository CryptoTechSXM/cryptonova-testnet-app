#!/usr/bin/env python3
# rpc_scan_frontend.py — READ-ONLY. Which RPC endpoints does the SERVED SITE use?
#
# The frontend half of the endpoint register; the keeper half is
# rpc_assignment_report.py in CryptoNova-Keepers. Built 2026-08-28 (session 45).
#
# ⛔ PRINTS HOSTS, NEVER PATHS. On QuickNode the API key IS the path. Note that on
#    the frontend these keys are ALREADY PUBLIC — index.html is served to anyone —
#    which is a known and accepted position, not a discovery. That is not a reason
#    to copy them into a repo file as well.
#
# Fingerprint = first 10 hex of sha256(url with any trailing slash stripped). The
# stripping matters: without it the same endpoint written two ways fingerprints
# twice and the two registers cannot be compared.
#
# Run from the repo root:  python3 rpc_scan_frontend.py

import re, os, hashlib, collections

URL = re.compile(
    r"https?://[A-Za-z0-9._~%-]+\."
    r"(?:quiknode\.pro|g\.alchemy\.com|infura\.io|base\.org|publicnode\.com|drpc\.org|blastapi\.io)"
    r"[^\s\"'`,)\]<]*")
SKIP_DIRS = {"node_modules", ".git", "_to_delete", ".vercel", "dist"}
EXTS      = (".html", ".js", ".json", ".mjs")

def main():
    hits = collections.defaultdict(list)
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if not f.endswith(EXTS):
                continue
            p = os.path.join(root, f)
            try:
                txt = open(p, encoding="utf-8", errors="ignore").read()
            except OSError:
                print(f"! could not read {p} — NOT counted as clean")
                continue
            for i, line in enumerate(txt.split("\n"), 1):
                for u in URL.findall(line):
                    host = re.match(r"https?://([^/]+)", u).group(1)
                    fp   = hashlib.sha256(u.rstrip("/").encode()).hexdigest()[:10]
                    hits[host].append((p.lstrip("./\\"), i, fp))

    print(f"DISTINCT FRONTEND RPC HOSTS: {len(hits)}\n")
    for host, uses in sorted(hits.items()):
        fps  = sorted({fp for _, _, fp in uses})
        prod = sorted({p for p, _, _ in uses if not p.endswith(".mjs") and "rpc_health" not in p})
        diag = sorted({p for p, _, _ in uses if p.endswith(".mjs") or "rpc_health" in p})
        print(host)
        print(f"   fingerprint(s): {', '.join(fps)}   occurrences: {len(uses)}")
        if prod: print(f"   SERVED TO MEMBERS: {', '.join(prod)}")
        if diag: print(f"   diagnostics only : {', '.join(diag)}")
        print()
    print("Join this against the keeper register on HOST — each QuickNode endpoint has")
    print("a unique subdomain, so the host is the identity and the path is the secret.")

main()
