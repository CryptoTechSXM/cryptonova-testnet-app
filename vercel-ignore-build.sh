#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# VERCEL IGNORED BUILD STEP — CryptoNova
#
# WHY THIS EXISTS (session 45, 2026-08-28) — AND WHAT IT DOES *NOT* FIX:
#   api/pif-request.js and api/submit-bug.js use a git branch as their DATABASE —
#   every PIF request/reserve/unreserve/gifted and every member bug report is a
#   real git commit, and every commit on a deployable branch is a Vercel
#   deployment. The account is on the Hobby plan: 100 deployments/day. Measured
#   on the last 300 commits of origin/admin, 121 (~40%) were written by those two
#   APIs. On 2026-08-28 the cap was exhausted and NOTHING deployed: pushes
#   succeeded in git and silently produced no deployment, so branch refs and the
#   live sites drifted apart with no error anywhere.
#
#   ⛔⛔ THIS SCRIPT DOES NOT SAVE THE DAILY QUOTA. Vercel's own docs, verbatim:
#   "Canceled builds are counted as full deployments as they execute a build
#   command in the build step. This means that any canceled builds initiated
#   using the ignore build step will still count towards your deployment quotas
#   and concurrent build slots." Session 44's handoff proposed this as THE fix
#   for the cap; it is not one. What actually removes the member-action
#   deployments is that the APIs now write to the `data` branch, which
#   vercel.json marks git.deploymentEnabled:false — no deployment is created at
#   all. THAT is the fix; this script is a SECOND LINE OF DEFENCE that still
#   saves build minutes and concurrent build slots, and that catches the case
#   where someone points GH_BRANCH back at a deployable branch.
#
# WHAT IT DOES:
#   Exit 0  -> Vercel SKIPS the build (Vercel's convention, verified in its docs:
#              "When the command exits with code 1, the build will continue.
#              When the command exits with 0, the build is ignored.")
#   Exit 1  -> Vercel BUILDS.
#   We exit 0 ONLY for commit messages we know an API wrote. Everything else,
#   including anything unexpected or unreadable, exits 1 and BUILDS. Failing
#   towards "build" is deliberate: a skipped real deploy is invisible and
#   dangerous, a wasted deploy is merely one of a hundred.
#
# SAFE TO SKIP THESE BUILDS BECAUSE nothing serves this data from the
#   deployment's own files any more:
#     - pif.html reads the waitlist through api/pif-request.js (GET), which
#       fetches PIF_WAITLIST.md from GH_BRANCH via the GitHub API (fix 43.10).
#     - reports.html reads bug reports through api/get-reports.js, which fetches
#       BUGS.md from GH_BRANCH via the GitHub API.
#     - bug screenshots are referenced by path inside BUGS.md only; no page
#       renders them from the deployment.
#   ⛔ IF A FUTURE CHANGE MAKES A PAGE READ PIF_WAITLIST.md / BUGS.md FROM ITS
#   OWN DEPLOYMENT AGAIN, BOTH THIS SCRIPT AND THE `data` BRANCH MUST GO — the
#   data would freeze at the last real deploy and the page would show stale rows
#   with no error.
#
# THE PATTERNS ARE THE REAL ONES, MEASURED FROM THE SOURCE — do not guess them:
#     api/pif-request.js:143  `pif(${today}): ...`
#     api/submit-bug.js:298   `bug-report(${date}): ...`
#     api/submit-bug.js:239   `bug-report screenshot (${date})`
#     api/submit-bug.js:90    `fund-list(${date}): ...`
#   ⚠ Session 44's handoff proposed matching `bugs(` — WRONG in both directions:
#   it matches no API commit at all, and it DOES match two human commits
#   ("bugs: close 8 resolved reports"), which would have silently skipped real
#   code deploys. If either API's commit message ever changes, change it here in
#   the SAME edit.
# ─────────────────────────────────────────────────────────────────────────────

set -u

# Vercel always sets VERCEL_GIT_COMMIT_MESSAGE for git-triggered deployments.
# The git fallback covers a CLI deploy; if both are empty we build.
MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"
if [ -z "$MSG" ]; then
  MSG="$(git log -1 --pretty=%B 2>/dev/null || true)"
fi

if [ -z "$MSG" ]; then
  echo "ignore-build: no commit message available -> BUILD (fail safe)"
  exit 1
fi

# First line only: the prefixes are always at the start of the subject.
SUBJECT="$(printf '%s\n' "$MSG" | head -n 1)"

case "$SUBJECT" in
  "pif("*|"bug-report("*|"bug-report screenshot ("*|"fund-list("*)
    echo "ignore-build: API-written data commit -> SKIP: $SUBJECT"
    exit 0
    ;;
esac

echo "ignore-build: real commit -> BUILD: $SUBJECT"
exit 1
