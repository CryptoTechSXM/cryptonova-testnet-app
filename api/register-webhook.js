/**
 * /api/register-webhook.js — one-shot Telegram webhook registration
 *
 * GET /api/register-webhook?secret=SETUP
 *
 * Reads TELEGRAM_QA_BOT_TOKEN from Vercel env and calls Telegram's
 * setWebhook API to point at https://admin.crypto-nova.app/api/telegram-qa
 *
 * Delete this file after webhook is confirmed set.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  // Simple guard — not a real secret, just prevents accidental calls
  if (req.query.secret !== 'SETUP') {
    return res.status(403).json({ error: 'Missing ?secret=SETUP' });
  }

  const token = process.env.TELEGRAM_QA_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: 'TELEGRAM_QA_BOT_TOKEN not set' });

  const webhookUrl = 'https://crypto-nova.app/api/telegram-qa';

  // 1. Check current webhook
  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const info = await infoRes.json();

  // 2. Set webhook
  const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    }),
  });
  const setResult = await setRes.json();

  return res.status(200).json({
    previous_webhook: info.result?.url || '(none)',
    set_result: setResult,
    new_webhook: webhookUrl,
  });
}
