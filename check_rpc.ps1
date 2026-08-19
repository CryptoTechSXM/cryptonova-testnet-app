# check_rpc.ps1 - RPC HEALTH CHECK for the live V8.48 site (Base Sepolia).
#
# Written 2026-08-19 (session 9) for an owner-reported "RPC errors" incident on the
# LIVE community site. Read-only: it sends eth_chainId / eth_blockNumber / eth_call
# to each endpoint and prints what came back. It writes nothing to any chain.
#
# WHY IT EXISTS: the site has TWO separate RPC layers and a report of "RPC errors"
# does not say which one is failing.
#   READ POOL  - 5 QuickNode endpoints + sepolia.base.org last resort, in a shuffled
#                ethers FallbackProvider (quorum 1). This is what every PAGE reads
#                through. If these fail, members see stale/zero/blank dashboards.
#   WALLET RPC - WALLET_RPC_URLS in index.html, currently ONLY sepolia.base.org. This
#                is what wallet_addEthereumChain hands the member's wallet, and it
#                governs every transaction they SEND. If this fails, members see
#                "Transaction failed" - the most common class in BUGS.md, and V8.49
#                item 2, still open.
# This script measures BOTH, so the answer is read off a table instead of guessed.
#
# Run it from PowerShell on the machine, or on the VPS, or both - the difference
# between the two locations is itself a finding (network path vs endpoint health).
#
#   cd C:\CryptoNova-Testnet-App
#   powershell -ExecutionPolicy Bypass -File .\check_rpc.ps1
#
# ASCII only, on purpose: Select-String with a non-ASCII pattern silently matches
# nothing against a console that mangles UTF-8 (recorded trap, contracts repo).

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$endpoints = @(
  @{ name = 'EP1 cnova-site   (read pool)'; url = 'https://frequent-misty-meme.base-sepolia.quiknode.pro/a71b4ace5a4da7005c54110096de8e422669824f/' },
  @{ name = 'EP5 cnova-site-2 (read pool)'; url = 'https://wiser-proportionate-forest.base-sepolia.quiknode.pro/8383659a7c5f035faa091659780d5ba26c50fcf8/' },
  @{ name = 'EP2              (read pool)'; url = 'https://cosmopolitan-still-fire.base-sepolia.quiknode.pro/3835d77b733a07e6109ec27774ab3231fbb86c6a/' },
  @{ name = 'EP3              (read pool)'; url = 'https://newest-cold-isle.base-sepolia.quiknode.pro/d1082ae239ca62f4fc938014273539074f377e02/' },
  @{ name = 'EP4              (read pool)'; url = 'https://side-silent-sheet.base-sepolia.quiknode.pro/4ce4b5665baf27920cda0759814efef5c3172510/' },
  @{ name = 'sepolia.base.org (WALLET + last resort)'; url = 'https://sepolia.base.org' }
)

function Invoke-Rpc {
  param($Url, $Method, $Params)
  $body = @{ jsonrpc = '2.0'; id = 1; method = $Method; params = $Params } | ConvertTo-Json -Depth 6 -Compress
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $r = Invoke-WebRequest -Uri $Url -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 20 -UseBasicParsing
    $sw.Stop()
    $j = $null
    try { $j = $r.Content | ConvertFrom-Json } catch { }
    return [pscustomobject]@{
      http = $r.StatusCode; ms = $sw.ElapsedMilliseconds; json = $j
      note = $(if ($null -eq $j) { 'NON-JSON BODY: ' + $r.Content.Substring(0, [Math]::Min(140, $r.Content.Length)) } else { '' })
    }
  } catch {
    $sw.Stop()
    $code = $null
    if ($_.Exception.Response) { try { $code = [int]$_.Exception.Response.StatusCode } catch { } }
    return [pscustomobject]@{ http = $code; ms = $sw.ElapsedMilliseconds; json = $null; note = ($_.Exception.Message -replace '\s+', ' ') }
  }
}

Write-Host ''
Write-Host ('RPC HEALTH CHECK  ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz') + '   host: ' + $env:COMPUTERNAME)
Write-Host ('chain 84532 = 0x14a34 expected on every row')
Write-Host ('-' * 118)
Write-Host ('{0,-40} {1,6} {2,8} {3,10} {4,12}  {5}' -f 'endpoint', 'HTTP', 'ms', 'chainId', 'block', 'note')
Write-Host ('-' * 118)

$rows = @()
foreach ($e in $endpoints) {
  $a = Invoke-Rpc $e.url 'eth_chainId'     @()
  $b = Invoke-Rpc $e.url 'eth_blockNumber' @()

  $cid = if ($a.json -and $a.json.result) { $a.json.result } else { '-' }
  $blk = '-'
  if ($b.json -and $b.json.result) { try { $blk = [Convert]::ToInt64($b.json.result, 16) } catch { $blk = $b.json.result } }

  $note = @($a.note, $b.note) | Where-Object { $_ } | Select-Object -First 1
  if ($a.json -and $a.json.error) { $note = 'RPC error: ' + ($a.json.error | ConvertTo-Json -Compress) }
  if ($b.json -and $b.json.error) { $note = 'RPC error: ' + ($b.json.error | ConvertTo-Json -Compress) }
  if (-not $note) { $note = '' }

  Write-Host ('{0,-40} {1,6} {2,8} {3,10} {4,12}  {5}' -f $e.name, $(if ($null -ne $b.http) { $b.http } else { 'ERR' }), $b.ms, $cid, $blk, $note.Substring(0, [Math]::Min(58, $note.Length)))
  $rows += [pscustomobject]@{ endpoint = $e.name; url = $e.url; http = $b.http; ms = $b.ms; chainId = $cid; block = $blk; note = $note }
}

# ---- Do the endpoints AGREE on the head? A pool whose members disagree by a lot is
#      a stale-node problem, which reads to a member as "my balance is wrong", not as
#      an error at all. Worth seeing on the same table.
$heads = $rows | Where-Object { $_.block -is [long] -or $_.block -is [int] } | ForEach-Object { [int64]$_.block }
Write-Host ''
if ($heads.Count -ge 2) {
  $spread = ($heads | Measure-Object -Maximum).Maximum - ($heads | Measure-Object -Minimum).Minimum
  Write-Host ("head spread across responding endpoints: $spread blocks  (a few is normal at ~2s blocks; tens means a STALE node in the pool)")
} else {
  Write-Host ("head spread: not computable - fewer than 2 endpoints responded")
}
$dead = ($rows | Where-Object { $_.chainId -eq '-' }).Count
Write-Host ("endpoints NOT answering: $dead of " + $rows.Count)
Write-Host ''
Write-Host 'READ IT THIS WAY:'
Write-Host '  401 / 403        -> QuickNode key rejected: plan expired, credits exhausted, or referrer/IP allowlist.'
Write-Host '  429              -> rate limited. The pool exists for this; several at once means real traffic growth.'
Write-Host '  502 / NON-JSON   -> Cloudflare in front of sepolia.base.org returning HTML. This is the V8.49 item-2 suspect.'
Write-Host '  all six fine     -> the fault is NOT endpoint health. Next place to look is the browser console on a'
Write-Host '                      failing member page, and the keeper logs on the VPS.'
Write-Host ''

$out = Join-Path (Get-Location) ('rpc_health_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.json')
$rows | ConvertTo-Json -Depth 5 | Out-File -FilePath $out -Encoding utf8
Write-Host ("full result written to: $out")
Write-Host ''
