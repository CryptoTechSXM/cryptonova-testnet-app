# 🛠️ System Update — July 19, 2026

Hey CryptoNova community,

We want to give you a quick update on the issues some of you experienced this morning and confirm that everything is now fully resolved.

---

## What Happened

Early this morning, a number of members reported:

- Registration transactions failing or timing out
- Self-rescue attempts not going through
- Dashboard spinners not loading

We heard you — Maximum_71, @Lavern_Gay, @Koach100, Sherwyn — thank you for reporting quickly.

## What Caused It

The T1 matrix reached a fully-filled state for the first time since our latest update (V8.39). At that point, the system is designed to automatically expand — creating a second T1 slot so new members can keep registering and existing members can continue cycling. That expansion didn't trigger as fast as it should have, which temporarily blocked registrations and rescue transactions.

## What We Did

We identified the blockage within the morning, manually unblocked the matrix, and the expansion kicked in automatically from there. A second T1 slot is now live and the system is running normally. We also updated the automation that monitors for this situation so it handles it faster on its own going forward — no manual intervention needed in future.

## Current Status ✅

- Registrations: **working**
- Self-rescues: **working**
- Upgrades: **working**
- Matrix expansion: **live** (T1 is now on its second slot)

All affected wallets have been processed. If you were parked or stuck this morning, your position has been resolved automatically.

## What To Do

**Do a hard refresh** (`Ctrl + Shift + R`) to make sure you're on the latest version, then reconnect your wallet. Your dashboard should show your current status correctly.

If anything still looks off, drop a bug report using the form on the dashboard and we'll look into it right away.

---

Thank you for your patience and for being part of this testing phase — this is exactly what testnet is for. Every issue you report makes the mainnet launch stronger.

— The CryptoNova Team
