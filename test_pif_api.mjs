// test_pif_api.mjs — session 44. Exercises the REAL api/pif-request.js handler with
// GitHub stubbed out, so the 43.10 GET path is measured rather than asserted.
//   node test_pif_api.mjs
process.env.GITHUB_TOKEN = 'stub-token';

const LIST = [
  '# PIF Waitlist',
  '- [WAITING] 2026-08-27 · 0x1111111111111111111111111111111111111111 · testing PIF',
  '- [RESERVED by 0xabc @1756330000] 2026-08-27 · 0x2222222222222222222222222222222222222222 · someone',
  '',
].join('\n');

let ghCalls = [];
let ghStatus = 200;
globalThis.fetch = async (url, opts) => {
  ghCalls.push({ url: String(url), method: (opts && opts.method) || 'GET' });
  if (String(url).includes('api.telegram.org')) return { status: 200, text: async () => '{}' };
  if (ghStatus !== 200) return { status: ghStatus, text: async () => '{"message":"Not Found"}' };
  return { status: 200, text: async () => JSON.stringify({
    content: Buffer.from(LIST, 'utf-8').toString('base64'), sha: 'deadbeef' }) };
};

const TARGET = process.argv[2] || './api/pif-request.js';   // pass a pre-fix copy to prove this test has teeth
const { default: handler } = await import(TARGET);

function mkRes() {
  const r = { headers: {}, code: null, payload: null, ended: false };
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (o) => { r.payload = o; return r; };
  r.end = () => { r.ended = true; return r; };
  return r;
}

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(' OK   ' + name); }
  else { fail++; console.log('FAIL  ' + name + (detail ? '\n        ' + detail : '')); }
}

// T1 — GET returns the list read from the WRITE branch
{ ghStatus = 200; ghCalls = [];
  const res = mkRes();
  await handler({ method: 'GET', query: {}, body: {} }, res);
  check('GET returns 200', res.code === 200, 'got ' + res.code);
  check('GET payload carries the list verbatim', res.payload && res.payload.content === LIST);
  check('GET reports which branch it read', res.payload && res.payload.branch === 'admin', JSON.stringify(res.payload && res.payload.branch));
  check('GET read the ADMIN branch, not the deployment', ghCalls[0] && ghCalls[0].url.includes('ref=admin'), ghCalls[0] && ghCalls[0].url);
  check('GET is a read only — no PUT issued', !ghCalls.some(c => c.method === 'PUT'));
  check('GET is shared-cached for 30s', /s-maxage=30/.test(res.headers['cache-control'] || ''), res.headers['cache-control']);
}

// T2 — ?fresh=1 bypasses the cache, for the refresh right after a change
{ const res = mkRes();
  await handler({ method: 'GET', query: { fresh: '1' }, body: {} }, res);
  check('GET ?fresh=1 is uncached', res.headers['cache-control'] === 'no-store', res.headers['cache-control']); }

// T3 — an unreadable list must NOT come back as an empty list
{ ghStatus = 404;
  const res = mkRes();
  await handler({ method: 'GET', query: {}, body: {} }, res);
  check('GitHub failure surfaces as an error, not an empty list',
        res.code === 502 && !(res.payload && res.payload.ok), JSON.stringify({ code: res.code, payload: res.payload }));
  ghStatus = 200; }

// T4 — POST still works, and other verbs are still refused
{ ghCalls = [];
  const res = mkRes();
  await handler({ method: 'POST', query: {}, body: { action: 'request', wallet: '0x3333333333333333333333333333333333333333', name: 'harness' } }, res);
  check('POST request still commits (PUT issued)', ghCalls.some(c => c.method === 'PUT'), JSON.stringify(ghCalls.map(c => c.method)));
  check('POST request returns ok', res.code === 200 && res.payload && res.payload.ok === true, JSON.stringify(res.payload)); }
{ const res = mkRes();
  await handler({ method: 'PUT', query: {}, body: {} }, res);
  check('PUT is still refused 405', res.code === 405, 'got ' + res.code); }
{ const res = mkRes();
  await handler({ method: 'OPTIONS', query: {}, body: {} }, res);
  check('OPTIONS preflight still answered', res.code === 200 && res.ended); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
