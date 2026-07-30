import re, os

src  = '/sessions/happy-amazing-curie/mnt/CryptoNova-Testnet-App/index.html.base'
dest = '/sessions/happy-amazing-curie/mnt/CryptoNova-Testnet-App/index.html.new'

with open(src, 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. gasLimit fixes ────────────────────────────────────────────────────────
html = html.replace(
    'const tx = await tr.manualUpgrade(tierIdx, { gasLimit: 5_000_000 });',
    'const tx = await tr.manualUpgrade(tierIdx, { gasLimit: 2_000_000 });'
)
html = html.replace(
    'const tx     = await matrix.selfRescue({ gasLimit: 5_000_000 }); // matrix may need to cycle 127 slots',
    'const tx     = await matrix.selfRescue({ gasLimit: 3_000_000 }); // matrix may need to cycle 127 slots'
)
html = html.replace(
    'const tx        = await matrix.coPayRescue(userAddr, { gasLimit: 5_000_000 }); // matrix may need to cycle 127 slots',
    'const tx        = await matrix.coPayRescue(userAddr, { gasLimit: 3_000_000 }); // matrix may need to cycle 127 slots'
)

# ── 2. TIER_ROUTER_ABI — add V8.35 functions ────────────────────────────────
html = html.replace(
    "  'function registerWithCoupon(address referrer, bytes32 couponCodeHash) external', // V8.31\n];",
    """  'function registerWithCoupon(address referrer, bytes32 couponCodeHash) external', // V8.31
  'function bulkUpgrade(uint8 targetTierIndex) external',                           // V8.35
  'function tierFirstEntries(uint8 tierNum) external view returns (uint256)',        // V8.35
  'function tierGateThreshold(uint8 tierNum) external view returns (uint256)',       // V8.35
  'event BulkUpgrade(address indexed member, uint8 fromTier, uint8 toTier, uint256 totalFee)', // V8.35
];"""
)

# ── 3. Whale gate banner HTML — dynamic V8.35 design ───────────────────────
html = html.replace(
    """          <div id="upgrade-whale-gate" style="display:none;margin-bottom:14px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:12px;font-size:13px;color:var(--yellow)">
            <span data-i18n="reg.whale_gate_pre">🐋 <strong>Whale Gate</strong> — Tiers 5–7 require sequential progression until</span> <span id="upgrade-whale-progress">0</span> / 25 <span data-i18n="reg.whale_gate_suf">SuperNova Genesis members reached.</span> <span id="upgrade-fasttrack-badge"></span>
          </div>""",
    """          <!-- V8.35 Whale Gate banner — shown when member is T1-T4 and gate not yet open -->
          <div id="upgrade-whale-gate" style="display:none;margin-bottom:14px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:12px;font-size:13px;color:var(--yellow)">
            <div style="font-weight:700;margin-bottom:6px">🐋 Whale Gate — Pioneer Milestone</div>
            <div style="margin-bottom:4px">T2–T5 unlock together when <strong id="whale-gate-t5-progress">…</strong> / <strong id="whale-gate-t5-threshold">25</strong> T5 pioneers join.</div>
            <div style="background:rgba(0,0,0,.25);border-radius:4px;height:6px;margin:6px 0 4px">
              <div id="whale-gate-t5-bar" style="background:var(--yellow);height:6px;border-radius:4px;width:0%;transition:width .4s"></div>
            </div>
            <div id="whale-gate-t5-status" style="font-size:12px;opacity:.85">Loading…</div>
            <div id="upgrade-fasttrack-badge" style="margin-top:6px"></div>
          </div>"""
)

# ── 4. Dashboard: bulk-upgrade section after upgrade-section ────────────────
html = html.replace(
    """            <div id="upgrade-status-dash" style="margin-top:10px;font-size:13px;color:var(--text2)"></div>
          </div>
        </div>
      </div>""",
    """            <div id="upgrade-status-dash" style="margin-top:10px;font-size:13px;color:var(--text2)"></div>
          </div>

          <!-- V8.35 Bulk Upgrade — shown when whale gate is open AND member is T1-T4 -->
          <div id="bulk-upgrade-section" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="font-size:14px;font-weight:700;margin-bottom:4px">🔓 Whale Gate Open — Bulk Upgrade</div>
            <div style="font-size:12px;color:var(--text3);margin-bottom:12px" id="bulk-upgrade-desc">The pioneer milestone has been reached. You can jump directly to a higher tier in one transaction.</div>
            <div class="info-row"><span class="info-key">Upgrade To</span><span class="info-val green" id="bulk-upgrade-target">—</span></div>
            <div class="info-row"><span class="info-key">Total Fee</span><span class="info-val" id="bulk-upgrade-fee">—</span></div>
            <div id="bulk-upgrade-breakdown" style="font-size:11px;color:var(--text3);margin:4px 0 12px;padding:6px 8px;background:var(--bg3);border-radius:6px"></div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <button class="btn btn-ghost full-w" id="btn-bulk-approve" onclick="approveBulkUpgrade()" disabled>Step 1: Approve USDC</button>
              <button class="btn btn-ghost full-w" id="btn-bulk-upgrade" onclick="doBulkUpgrade()" disabled>Step 2: Bulk Upgrade All Tiers</button>
            </div>
            <div id="bulk-upgrade-status" style="margin-top:10px;font-size:13px;color:var(--text2)"></div>
          </div>
        </div>
      </div>"""
)

# ── 5. Wire updateWhaleGateUI into loadDashboardData ───────────────────────
html = html.replace(
    '    // ── Parked / Rescue section ──────────────────────────────────────────\n    const rescueSection = document.getElementById(\'rescue-section\');',
    '    // ── V8.35 Whale Gate UI ─────────────────────────────────────────────\n    await updateWhaleGateUI(highestTier, rp).catch(() => {});\n\n    // ── Parked / Rescue section ──────────────────────────────────────────\n    const rescueSection = document.getElementById(\'rescue-section\');'
)

# ── 6. JS: insert whale gate + bulk upgrade functions before approveUSDCForUpgrade ──
NEW_FUNCTIONS = r"""// ── V8.35 Whale Gate helpers ─────────────────────────────────────────────────

// Reads whale gate state and updates both the register-tab banner and the
// dashboard bulk-upgrade section. Called from loadDashboardData().
async function updateWhaleGateUI(highestTier, rp) {
  const tr = new ethers.Contract(ADDRS.tierRouter, TIER_ROUTER_ABI, rp);

  // T2-T5 share T5's gate (tierNum=5). T6-T10 independent (not yet shown in UI).
  let t5First = 0n, t5Thresh = 25n;
  try { t5First  = await tr.tierFirstEntries(5);  } catch(_) {}
  try { t5Thresh = await tr.tierGateThreshold(5); } catch(_) {}

  const t5GateOpen = t5First >= t5Thresh;
  const pct = t5Thresh > 0n ? Math.min(100, Math.round(Number(t5First) * 100 / Number(t5Thresh))) : 0;

  // Register-tab banner (shown when member is T1-T4 and gate is closed or just opened)
  const banner = document.getElementById('upgrade-whale-gate');
  if (banner) {
    const showBanner = highestTier >= 1 && highestTier <= 4;
    banner.style.display = showBanner ? 'block' : 'none';
    if (showBanner) {
      const progEl   = document.getElementById('whale-gate-t5-progress');
      const threshEl = document.getElementById('whale-gate-t5-threshold');
      const barEl    = document.getElementById('whale-gate-t5-bar');
      const statEl   = document.getElementById('whale-gate-t5-status');
      const badgeEl  = document.getElementById('upgrade-fasttrack-badge');
      if (progEl)   progEl.textContent   = t5First.toString();
      if (threshEl) threshEl.textContent = t5Thresh.toString();
      if (barEl)    barEl.style.width    = pct + '%';
      if (statEl) {
        if (t5GateOpen) {
          statEl.innerHTML = '<span style="color:var(--green)">🔓 Gate open — T2–T5 unlocked!</span>';
          if (badgeEl) badgeEl.innerHTML = '<span style="background:var(--green);color:#000;border-radius:4px;padding:2px 6px;font-size:11px;font-weight:700">UNLOCKED</span>';
        } else {
          statEl.textContent = pct + '% — ' + (Number(t5Thresh) - Number(t5First)) + ' more pioneers needed to unlock T2–T5.';
          if (badgeEl) badgeEl.innerHTML = '';
        }
      }
    }
  }

  // Dashboard bulk-upgrade section (shown when gate is open AND member is T1-T4)
  const bulkSection = document.getElementById('bulk-upgrade-section');
  if (bulkSection) {
    const showBulk = t5GateOpen && highestTier >= 1 && highestTier <= 4;
    bulkSection.style.display = showBulk ? 'block' : 'none';
    if (showBulk) {
      const TIER_FEES = [0n,10_000_000n,25_000_000n,50_000_000n,100_000_000n,200_000_000n,
                         500_000_000n,1_000_000_000n,2_000_000_000n,5_000_000_000n,10_000_000_000n];
      let totalFee = 0n;
      const feeLines = [];
      for (let t = highestTier + 1; t <= 5; t++) {
        let fee = TIER_FEES[t] || 0n;
        try { fee = await tr.tierEntryFees(t - 1); } catch(_) {}
        totalFee += fee;
        feeLines.push('T' + t + ': ' + fmt6(fee));
      }
      const targetTierIndex = 4; // T5 is index 4
      window._bulkUpgradeFee       = totalFee;
      window._bulkUpgradeTierIndex = targetTierIndex;
      setText('bulk-upgrade-target', 'T5 — Quantum Horizon');
      setText('bulk-upgrade-fee',    fmt6(totalFee));
      const breakdown = document.getElementById('bulk-upgrade-breakdown');
      if (breakdown) breakdown.textContent = feeLines.join(' + ') + ' = ' + fmt6(totalFee) + ' total';
      const approveBtn = document.getElementById('btn-bulk-approve');
      const upgradeBtn = document.getElementById('btn-bulk-upgrade');
      if (approveBtn) { approveBtn.disabled = false; approveBtn.classList.remove('btn-ghost'); approveBtn.classList.add('btn-green'); }
      if (upgradeBtn) upgradeBtn.disabled = true;
      try {
        const usdc2 = new ethers.Contract(ADDRS.usdc, USDC_ABI, rp);
        const userAddrU = await signer.getAddress();
        const allow = await usdc2.allowance(userAddrU, ADDRS.tierRouter);
        if (allow >= totalFee && upgradeBtn) {
          upgradeBtn.disabled = false;
          upgradeBtn.classList.remove('btn-ghost');
          upgradeBtn.classList.add('btn-green');
          const st = document.getElementById('bulk-upgrade-status');
          if (st && !st.textContent) st.textContent = '✅ USDC approved — click Step 2 to bulk upgrade.';
        }
      } catch(_) {}
    }
  }
}

async function approveBulkUpgrade() {
  if (!signer) { toast('Connect your wallet first.', 'error'); return; }
  const btn    = document.getElementById('btn-bulk-approve');
  const status = document.getElementById('bulk-upgrade-status');
  const fee    = window._bulkUpgradeFee || 0n;
  try {
    if (btn) btn.disabled = true;
    if (status) status.textContent = 'Approving USDC…';
    const usdc = new ethers.Contract(ADDRS.usdc, USDC_ABI, signer);
    const tx   = await usdc.approve(ADDRS.tierRouter, fee);
    if (status) status.textContent = 'Waiting for confirmation…';
    await tx.wait();
    if (status) status.textContent = '✅ Approved. Click Step 2 to bulk upgrade.';
    const upgradeBtn = document.getElementById('btn-bulk-upgrade');
    if (upgradeBtn) { upgradeBtn.disabled = false; upgradeBtn.classList.remove('btn-ghost'); upgradeBtn.classList.add('btn-green'); }
  } catch(e) {
    const msg = (e.message || '').toLowerCase();
    const friendly = (e.code === 'ACTION_REJECTED' || msg.includes('user rejected'))
      ? '✋ Cancelled — nothing was sent.'
      : '❌ ' + (e.reason || e.shortMessage || e.message || 'unknown error');
    if (status) status.textContent = friendly;
    if (btn) btn.disabled = false;
  }
}

async function doBulkUpgrade() {
  if (!signer) { toast('Connect your wallet first.', 'error'); return; }
  const btn       = document.getElementById('btn-bulk-upgrade');
  const status    = document.getElementById('bulk-upgrade-status');
  const tierIndex = window._bulkUpgradeTierIndex ?? 4;
  try {
    if (btn) btn.disabled = true;
    if (status) status.textContent = 'Submitting bulk upgrade…';
    const tr = new ethers.Contract(ADDRS.tierRouter, TIER_ROUTER_ABI, signer);
    const tx = await tr.bulkUpgrade(tierIndex, { gasLimit: 3_000_000 });
    if (status) status.textContent = 'Waiting for confirmation…';
    await tx.wait();
    if (status) status.innerHTML = '<span style="color:var(--green)">🎉 Bulk upgrade complete — you\'re now in T' + (tierIndex + 1) + '! Refreshing…</span>';
    toast('Bulk upgrade successful!', 'success');
    setTimeout(() => loadDashboardData(), 2500);
  } catch(e) {
    const msg = (e.message || '').toLowerCase();
    const friendly = (e.code === 'ACTION_REJECTED' || msg.includes('user rejected'))
      ? '✋ Cancelled — nothing was sent.'
      : '❌ ' + (e.reason || e.shortMessage || e.message || 'unknown error');
    if (status) status.textContent = friendly;
    if (btn) btn.disabled = false;
  }
}

"""

html = html.replace(
    'async function approveUSDCForUpgrade() {\n  if (!signer) { toast(\'Connect your wallet first.\', \'error\'); return; }',
    NEW_FUNCTIONS + 'async function approveUSDCForUpgrade() {\n  if (!signer) { toast(\'Connect your wallet first.\', \'error\'); return; }'
)

# ── Write to new path, strip null bytes ─────────────────────────────────────
data = html.encode('utf-8').rstrip(b'\x00')
with open(dest, 'wb') as f:
    f.write(data)
print(f'Written {len(data)} bytes to {dest}')
