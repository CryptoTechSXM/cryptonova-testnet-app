#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# INSTRUMENT for vercel-ignore-build.sh (session 44, 2026-08-28).
#
# Run:  bash test_vercel_ignore.sh          (from C:\CryptoNova-Testnet-App)
#
# It does two things:
#   1. FIXTURES — a fixed table of commit subjects with the answer we expect,
#      including the traps: "bugs: close 8 resolved reports" (a HUMAN commit
#      that the handoff's proposed `bugs(` pattern would have skipped) and
#      "bug-report screenshot (...)" (an API commit that a naive
#      `bug-report(` pattern would MISS).
#   2. THE REAL CORPUS — every commit subject on origin/admin. It asserts that
#      the script's verdict matches a second, independently written classifier
#      (a grep over the same four literals). Two ways of asking, one answer.
#
# Exits non-zero and prints the offending line if anything disagrees, so a
# future edit to the patterns cannot quietly start skipping real deploys.
# ─────────────────────────────────────────────────────────────────────────────
set -u
SCRIPT="$(dirname "$0")/vercel-ignore-build.sh"
fail=0

verdict() {  # echoes SKIP or BUILD for the message in $1
  if VERCEL_GIT_COMMIT_MESSAGE="$1" bash "$SCRIPT" >/dev/null 2>&1; then
    echo SKIP
  else
    echo BUILD
  fi
}

check() {  # check <expected> <message>
  got="$(verdict "$2")"
  if [ "$got" != "$1" ]; then
    echo "  ✗ expected $1 got $got  ::  $2"
    fail=1
  else
    echo "  ✓ $1  ::  $2"
  fi
}

echo "── 1. FIXTURES ──────────────────────────────────────────────"
check SKIP  "pif(2026-08-28): gifted 0x43924713…"
check SKIP  "pif(2026-08-28): request 0x43924713…"
check SKIP  "bug-report(2026-08-22): dashboard — new report"
check SKIP  "bug-report screenshot (2026-08-22)"
check SKIP  "fund-list(2026-08-22): add 0x43924713… — reported a bug"
check BUILD "bugs: close 8 resolved reports (V8.46 + frontend batch)"
check BUILD "fix: withdrawal history is per-wallet"
check BUILD "merge: PIF waitlist commits written by the API during testing"
check BUILD "PIF: standard page chrome + professional wording"
check BUILD "pif: remove Mers test row (registered-wallet test case)"
check BUILD "chore: force a fresh Vercel build (s44)"
check BUILD ""

echo
echo "── 2. REAL CORPUS (origin/admin) ────────────────────────────"
skipn=0; buildn=0; mismatch=0; total=0
while IFS= read -r subj; do
  total=$((total+1))
  got="$(verdict "$subj")"
  # Independent classifier: the four literal prefixes, written separately.
  case "$subj" in
    pif\(*)                    want=SKIP ;;
    bug-report\(*)             want=SKIP ;;
    "bug-report screenshot ("*) want=SKIP ;;
    fund-list\(*)              want=SKIP ;;
    *)                         want=BUILD ;;
  esac
  if [ "$got" != "$want" ]; then
    echo "  ✗ MISMATCH expected $want got $got :: $subj"
    mismatch=$((mismatch+1)); fail=1
  fi
  [ "$got" = SKIP ] && skipn=$((skipn+1)) || buildn=$((buildn+1))
done < <(git log --pretty=%s -300 origin/admin)

echo "  commits examined : $total"
echo "  would SKIP       : $skipn   (API-written data commits)"
echo "  would BUILD      : $buildn  (real commits)"
echo "  mismatches       : $mismatch"

echo
if [ "$fail" -eq 0 ]; then echo "ALL CHECKS PASS"; else echo "FAILURES ABOVE"; fi
exit $fail
