$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cardsFile = Join-Path $root 'data/cards.js'
$imagesDir = Join-Path $root 'images'
New-Item -ItemType Directory -Force -Path (Join-Path $root 'data') | Out-Null
New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null

if (-not (Test-Path -LiteralPath $cardsFile)) {
  Write-Host 'ERROR: data/cards.js was not found.'
  exit 1
}

$content = Get-Content -Raw -Encoding UTF8 -LiteralPath $cardsFile
$jsonText = $content -replace '^\s*window\.CARD_POOL_DATA\s*=\s*', ''
$jsonText = $jsonText.Trim()
if ($jsonText.EndsWith(';')) { $jsonText = $jsonText.Substring(0, $jsonText.Length - 1).Trim() }

try { $cards = @($jsonText | ConvertFrom-Json) }
catch { Write-Host ("ERROR: Could not parse data/cards.js as JSON: {0}" -f $_.Exception.Message); exit 1 }

if ($cards.Count -ne 100) {
  Write-Host ("ERROR: Expected 100 cards, found {0}." -f $cards.Count)
  exit 1
}

$headers = @{ 'User-Agent'='CardWolf-card-image-preparer'; 'Accept'='application/json' }
$failed = @()

for ($i=0; $i -lt $cards.Count; $i++) {
  $card=$cards[$i]
  $name=[string]$card.name
  $safe=($name -replace '[^a-zA-Z0-9._-]','_')
  $localImage='images/'+$safe+'.jpg'
  $out=Join-Path $imagesDir ($safe+'.jpg')
  $card.image=$localImage
  Write-Host ("[{0}/{1}] {2}" -f ($i+1),$cards.Count,$name)

  if (Test-Path -LiteralPath $out) { continue }

  try {
    $encoded=[uri]::EscapeDataString($name)
    $api='https://db.ygoprodeck.com/api/v7/cardinfo.php?name='+$encoded
    $result=$null; $lastError=$null
    for ($attempt=1; $attempt -le 3; $attempt++) {
      try {
        $result=Invoke-RestMethod -Uri $api -Headers $headers -Method Get -ErrorAction Stop
        break
      } catch {
        $lastError=$_
        if ($attempt -lt 3) { Start-Sleep -Seconds (2*$attempt) }
      }
    }
    if ($null -eq $result) { throw ("Card API request failed after 3 attempts: {0}" -f $lastError.Exception.Message) }
    if ($null -eq $result.data -or @($result.data).Count -eq 0) { throw 'Card was not found by the YGOPRODeck API.' }
    $cardData=@($result.data)[0]
    if ($null -eq $cardData.card_images -or @($cardData.card_images).Count -eq 0) { throw 'Image information was not returned by the API.' }
    $url=[string]@($cardData.card_images)[0].image_url
    if ([string]::IsNullOrWhiteSpace($url)) { throw 'Image URL not returned by API.' }
    Invoke-WebRequest -Uri $url -OutFile $out -Headers @{ 'User-Agent'=$headers['User-Agent'] } -UseBasicParsing -ErrorAction Stop
    if (-not (Test-Path -LiteralPath $out) -or (Get-Item -LiteralPath $out).Length -lt 1000) { throw 'Downloaded image file is unexpectedly small.' }
  } catch {
    Write-Host ("FAILED: {0} :: {1}" -f $name,$_.Exception.Message)
    $failed += $name
    if (Test-Path -LiteralPath $out) { Remove-Item -LiteralPath $out -Force }
  }
}

if ($failed.Count -gt 0) {
  Write-Host ''
  Write-Host 'Failed cards:'
  $failed | ForEach-Object { Write-Host (' - '+$_) }
  Write-Host 'No partial data update was written.'
  exit 1
}

$jsonOut=$cards | ConvertTo-Json -Depth 20
Set-Content -LiteralPath $cardsFile -Value ("window.CARD_POOL_DATA = "+$jsonOut+";") -Encoding UTF8

$missing=@()
foreach($card in $cards){
  $safe=([string]$card.name -replace '[^a-zA-Z0-9._-]','_')
  $out=Join-Path $imagesDir ($safe+'.jpg')
  if(-not(Test-Path -LiteralPath $out)){$missing += $card.name}
}
if($missing.Count -gt 0){
  Write-Host ("ERROR: Missing image files: {0}" -f ($missing -join ', '))
  exit 1
}
Write-Host ("PASS: downloaded and verified {0} card images." -f $cards.Count)
exit 0
