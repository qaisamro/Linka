$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

$md = Join-Path $root "PROJECT_PROPOSAL_CyberAI_Conference_AR.md"
$css = Join-Path $PSScriptRoot "proposal.css"
$html = Join-Path $PSScriptRoot "Palestine_CyberAI_Proposal.html"
$pdf = Join-Path $PSScriptRoot "Palestine_CyberAI_Proposal.pdf"

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) {
  throw "Chrome not found at: $chrome"
}

Write-Host "1) Generating HTML via pandoc..."
pandoc $md `
  --standalone `
  --embed-resources `
  --css $css `
  -o $html

Write-Host "2) Printing PDF via headless Chrome..."
New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot "chrome-profile") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot "chrome-crash") | Out-Null

& $chrome `
  --headless `
  --disable-gpu `
  --print-to-pdf-no-header `
  --no-first-run `
  --no-default-browser-check `
  --disable-extensions `
  --disable-crash-reporter `
  ("--user-data-dir=" + (Join-Path $PSScriptRoot "chrome-profile")) `
  ("--crash-dumps-dir=" + (Join-Path $PSScriptRoot "chrome-crash")) `
  "--print-to-pdf=$pdf" `
  $html | Out-Null

Write-Host "Done:"
Write-Host " - HTML: $html"
Write-Host " - PDF : $pdf"
