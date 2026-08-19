// check_chain_scope.mjs - IS THE FAULT BASE SEPOLIA, OR IS IT THIS MACHINE'S NETWORK?
//
// Written 2026-08-19 (session 9), during a live incident on the V8.48 community site.
//
// WHAT IS ALREADY MEASURED, and it is not in doubt:
//   15:20  node check_matrix_calls.mjs  -> occupancy() = 127 on all six endpoints
//   15:38  browser, live site           -> eth_call fails: {"code":-32004,"message":
//                                          "failed to serve request"}, HTTP 503 unbatched
//   15:54  node check_matrix_calls.mjs  -> eth_getCode AND eth_call ERR on all six
//                                          endpoints, while eth_blockNumber still returns
//                                          a fresh, ADVANCING head on every one
//
// So: header reads work, STATE reads do not, across 5 QuickNode endpoints plus Coinbase's
// sepolia.base.org - independent operators. And it began partway through the session.
//
// ⚠ THE CONFOUND THIS SCRIPT EXISTS TO KILL. Every one of those observations was taken
// from the SAME machine on the SAME network. PowerShell, node and the browser share an
// ISP, a DNS resolver, and whatever security software sits in front of them. A middlebox
// that inspects POST bodies could plausibly pass eth_blockNumber and fail eth_call, and it
// would look EXACTLY like an upstream outage from here. Concluding "Base Sepolia is down"
// from six endpoints that all share one network path is the same error as reading six
// numbers off one contaminated instrument and calling it replication.
//
// THE DISCRIMINATOR: ask OTHER CHAINS the same kind of question from this same machine.
//   - if eth_call works on Base MAINNET and Ethereum Sepolia but fails on Base Sepolia,
//     the network path is fine and the fault is Base Sepolia. Nothing to fix in our code;
//     it is an upstream incident and the response is comms + a support ticket.
//   - if eth_call fails on EVERY chain, the fault is local to this machine or network,
//     our contracts and endpoints are innocent, and the fix is here, not upstream.
//   - if results are mixed in some other way, that is a third answer and it should be
//     read off the table rather than forced into one of the two above.
//
// Read-only. No keys, no wallet, no writes. Public endpoints only for the control chains.
//
//   cd C:\CryptoNova-Testnet-App
//   node check_chain_scope.mjs

const TARGETS = [
  // --- the chain under suspicion, via two independent operators ---
  { chain: 'Base Sepolia', via: 'QuickNode EP1',
    url: 'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/',
    // T1 MatA, our own contract. 14,709-byte PairManager and this both failed at 15:54.
    addr: '0x7154485C8b630d13902CdAeAe80429734f0ac79c', data: '0x3f728455' },       // occupancy()
  { chain: 'Base Sepolia', via: 'Coinbase public',
    url: 'https://sepolia.base.org',
    addr: '0x7154485C8b630d13902CdAeAe80429734f0ac79c', data: '0x3f728455' },
  // --- CONTROL CHAINS: different networks, same machine, same kind of request ---
  { chain: 'Base MAINNET', via: 'Coinbase public',
    url: 'https://mainnet.base.org',
    // USDC on Base mainnet; decimals() is the cheapest possible state read.
    addr: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', data: '0x313ce567' },        // decimals()
  { chain: 'Ethereum Sepolia', via: 'public',
    url: 'https://ethereum-sepolia-rpc.publicnode.com',
    // WETH on Ethereum Sepolia.
    addr: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', data: '0x313ce567' },        // decimals()
];

const post = async (url, body, ms = 15000) => {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: ac.signal,
    });
    const txt = await r.text();
    return { http: r.status, ms: Date.now() - t0, txt };
  } catch (e) {
    return { http: 'NETERR', ms: Date.now() - t0, txt: (e.message || String(e)).slice(0, 90) };
  } finally { clearTimeout(t); }
};

const parse = (res) => {
  if (res.http !== 200) return `HTTP ${res.http}`;
  try {
    const j = JSON.parse(res.txt);
    if (j.error) return `RPCERR ${j.error.code} ${String(j.error.message).slice(0, 34)}`;
    if (typeof j.result === 'string') return j.result.length > 24 ? `ok (${(j.result.length - 2) / 2}B)` : `ok ${j.result}`;
    return 'ok';
  } catch { return 'NON-JSON'; }
};

const pad = (s, n) => String(s).padEnd(n);

(async () => {
  console.log('');
  console.log('CHAIN SCOPE PROBE - ' + new Date().toISOString());
  console.log('Question: is the state-read failure specific to Base Sepolia, or to this network path?');
  console.log('='.repeat(112));
  console.log(pad('chain', 18) + pad('via', 18) + pad('eth_blockNumber', 20) + pad('eth_getCode', 22) + 'eth_call');
  console.log('-'.repeat(112));

  const rows = [];
  for (const t of TARGETS) {
    const bn = await post(t.url, { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] });
    const gc = await post(t.url, { jsonrpc: '2.0', id: 2, method: 'eth_getCode', params: [t.addr, 'latest'] });
    const ec = await post(t.url, { jsonrpc: '2.0', id: 3, method: 'eth_call', params: [{ to: t.addr, data: t.data }, 'latest'] });
    const row = { chain: t.chain, via: t.via, blockNumber: parse(bn), getCode: parse(gc), call: parse(ec),
                  ms: { bn: bn.ms, gc: gc.ms, ec: ec.ms } };
    rows.push(row);
    console.log(pad(row.chain, 18) + pad(row.via, 18) + pad(row.blockNumber, 20) + pad(row.getCode, 22) + row.call);
  }

  const baseSep  = rows.filter(r => r.chain === 'Base Sepolia');
  const controls = rows.filter(r => r.chain !== 'Base Sepolia');
  const okCall = (r) => r.call.startsWith('ok');

  console.log('');
  console.log('VERDICT');
  const sepBad  = baseSep.every(r => !okCall(r));
  const ctrlOk  = controls.every(okCall);
  const ctrlBad = controls.every(r => !okCall(r));

  if (sepBad && ctrlOk) {
    console.log('  Base Sepolia state reads FAIL while other chains SUCCEED from this same machine.');
    console.log('  -> The network path is fine. This is an UPSTREAM BASE SEPOLIA fault.');
    console.log('  -> Nothing to fix in our contracts or our endpoint list. Post a member notice,');
    console.log('     open a QuickNode ticket, and wait it out. Do NOT change code during it.');
  } else if (sepBad && ctrlBad) {
    console.log('  eth_call fails on EVERY chain tested from this machine, including public ones.');
    console.log('  -> The fault is LOCAL to this machine or network, not Base Sepolia and not our code.');
    console.log('  -> Suspects: security software or a proxy inspecting POST bodies, DNS, VPN.');
    console.log('  -> Re-test from a phone on mobile data before touching anything else.');
  } else if (!sepBad) {
    console.log('  Base Sepolia state reads are WORKING again right now.');
    console.log('  -> The fault is INTERMITTENT. That matches the owner report of "getting worse".');
    console.log('  -> Do not close this: an intermittent upstream fault needs a repeated sampler,');
    console.log('     not a single green result. One sample is not a measurement.');
  } else {
    console.log('  Mixed result - read the table above directly rather than trusting this summary.');
  }
  console.log('');
})();
