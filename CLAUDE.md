# CryptoNova Testnet App — CLAUDE.md

Read this file at the start of every session before touching any frontend code.

---

## Active state (update after each session)

| Item | Value |
|------|-------|
| Live contract version | V8.37 |
| Addresses file | `deployed_addresses_v8_37.json` |
| Working branch | `admin` |
| Admin frontend | https://admin.crypto-nova.app |

## Branch → Domain map

| Branch | Domain | Who reviews | Rule |
|--------|--------|-------------|------|
| `admin` | admin.crypto-nova.app | Owner (personal assessment) | All work goes here first |
| `preview` | early.crypto-nova.app | QA team (quality assessment) | Push ONLY after admin is verified |
| `main` | crypto-nova.app / v8.crypto-nova.app | Community / world | Push ONLY after QA + leader sign-off |

## 3-stage deploy order — MANDATORY

```
Stage 1: git push origin admin
Stage 2: git push origin admin:preview --force   ← STOP, wait for QA
Stage 3: git push origin admin:main --force      ← STOP, wait for leader sign-off
```

**NEVER push to `main` before `preview`. NEVER skip stages.**  
**NEVER push to `preview` or `main` without explicit approval.**

---

## CRITICAL: Post-push checklist — run EVERY TIME after git push

### Step 1 — Truncation check (ALWAYS FIRST, before anything else)

```powershell
# In the repo directory:
git show admin:index.html | Select-Object -Last 5
```

Or in bash:
```bash
tail -5 index.html
```

File **must** end with `</body></html>`. If it does not — it is truncated. Fix before checking RPC, wallet, or cache.

**DO NOT assume frozen spinners = wallet not connected or RPC slow. Check truncation first, every time.**

Correct index.html ending:
```
  console.log('[v8.8] ADDRS updated from deployed JSON');
}
</script>
<script src="/i18n.js" defer></script>
    <!-- Bug Report Footer -->
    <div style="text-align:center;...">🐛 Found a bug? Report it here</a></div>
</body></html>
```

### Step 2 — Hard refresh browser

`Ctrl + Shift + R` on each page. Vercel CDN caches aggressively; new builds take 1–3 min.

### Step 3 — Connect wallet

Live Stats on index.html require wallet connection. Spinners without a connected wallet are normal — not a bug.

---

## File editing rules (mount sync lag)

The bash sandbox may serve stale/truncated content from the Windows mount for files it has already seen.

**Safe write procedure:**
1. Write content to a **new path** (e.g., `index.html.new`) using Python or the Write tool
2. `os.replace(new_path, original_path)` from Python, or `mv` from bash
3. Strip trailing null bytes afterward:

```python
data = open(path, 'rb').read().rstrip(b'\x00')
open(path, 'wb').write(data)
```

**Never** use `sed -i` on large HTML files — it reads stale cached content and writes it back truncated.

**CRLF:** Python writes use LF (`newline=''` or leave default). Git on Windows converts to CRLF on checkout — the LF warnings on `git add` are normal and harmless.

---

## Truncation fix procedure

If index.html is truncated after a push:

1. Get the full correct content from the last known-good git commit:
   ```bash
   git show <good-commit-sha>:index.html
   ```
2. Apply current address replacements via Python (do not re-use the truncated version)
3. Strip null bytes
4. Write to `index.html.new`, then `os.replace()` over `index.html`
5. Verify: `tail -5 index.html` → must show `</body></html>`
6. `git add index.html && git commit -m "fix: restore truncated index.html"`
7. `git push origin admin`

---

## Vercel rules

- **NEVER delete a Vercel project.** Wipes all env vars, domains, and settings permanently. There is no undo.
- After a force-push that Vercel ignores, use the "empty commit trick": `git commit --allow-empty -m "trigger deploy"` then push again.

---

## PowerShell rules

- **NEVER put keys or credentials in PowerShell commands.** All secrets live in `.env`.
- **PowerShell does not support `&&`.** Always give one command at a time. Wait for output + no-error confirmation before the next step.
- Runtime params only go on the command line: `HDR_OFFSET`, `COUNT`, `TIER`, etc.

---

## Common address variables in this repo

All contract addresses live in the `const ADDRS = {...}` block near the top of each HTML file. When a new version deploys, run the `update_addrs.py` script (in the Cowork outputs folder) to replace all addresses across all HTML files in one pass. Always verify with truncation check afterward.
