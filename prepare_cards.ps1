$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cardsFile = Join-Path $root 'data/cards.js'
$imagesDir = Join-Path $root 'images'
New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null

if (-not (Test-Path $cardsFile)) {
  Write-Host 'ERROR: data/cards.js was not found.'
  exit 1
}

# cards.js is JavaScript containing a JSON array:
#   window.CARD_POOL_DATA = [ ... ];
# Do not use a simple regex for card names because names such as
# Maxx "C" contain escaped quotes (\"), which would be parsed incorrectly.
$content = Get-Content -Raw -Encoding UTF8 $cardsFile
$jsonText = $content -replace '^\s*window\.CARD_POOL_DATA\s*=\s*', ''
$jsonText = $jsonText.Trim()
if ($jsonText.EndsWith(';')) {
  $jsonText = $jsonText.Substring(0, $jsonText.Length - 1).Trim()
}

try {
  $cards = $jsonText | ConvertFrom-Json
} catch {
  Write-Host ("ERROR: Could not parse data/cards.js as JSON: {0}" -f $_.Exception.Message)
  exit 1
}

if ($null -eq $cards -or @($cards).Count -eq 0) {
  Write-Host 'ERROR: No card data was found in data/cards.js.'
  exit 1
}

$cards = @($cards)
$headers = @{
  'User-Agent' = 'CardWolf-v105-image-downloader'
  'Accept'     = 'application/json'
}
$count = 0
$failed = @()

foreach ($card in $cards) {
  $count++
  $name = [string]$card.name

  if ([string]::IsNullOrWhiteSpace($name)) {
    Write-Host ("[{0}/{1}] FAILED: Card has no name." -f $count, $cards.Count)
    $failed += '<unnamed card>'
    continue
  }

  # Keep the same filenames expected by the game.
  # The game must always reference the local image generated from the card name.
  # This is especially important for cards.js entries that may contain legacy
  # YGOPRODeck URLs (including placeholder/custom IDs).
  $safe = ($name -replace '[^a-zA-Z0-9._-]', '_')
  $localImage = 'images/' + $safe + '.jpg'
  $out = Join-Path $imagesDir ($safe + '.jpg')
  $card.image = $localImage

  if (Test-Path $out) {
    Write-Host ("[{0}/{1}] Exists: {2}" -f $count, $cards.Count, $name)
    continue
  }

  Write-Host ("[{0}/{1}] Downloading: {2}" -f $count, $cards.Count, $name)

  try {
    $encoded = [uri]::EscapeDataString($name)
    $api = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?name=' + $encoded

    # A short retry loop makes the downloader more tolerant of transient
    # HTTP/network errors without hammering the API.
    $result = $null
    $lastError = $null
    for ($attempt = 1; $attempt -le 3; $attempt++) {
      try {
        $result = Invoke-RestMethod -Uri $api -Headers $headers -Method Get -ErrorAction Stop
        break
      } catch {
        $lastError = $_
        if ($attempt -lt 3) {
          Start-Sleep -Seconds (2 * $attempt)
        }
      }
    }

    if ($null -eq $result) {
      throw ("Card API request failed after 3 attempts: {0}" -f $lastError.Exception.Message)
    }

    if ($null -eq $result.data -or @($result.data).Count -eq 0) {
      throw 'Card was not found by the YGOPRODeck API.'
    }

    $cardData = @($result.data)[0]
    if ($null -eq $cardData.card_images -or @($cardData.card_images).Count -eq 0) {
      throw 'Image information was not returned by the API.'
    }

    $url = [string]@($cardData.card_images)[0].image_url
    if ([string]::IsNullOrWhiteSpace($url)) {
      throw 'Image URL not returned by API.'
    }

    Invoke-WebRequest -Uri $url -OutFile $out -Headers @{ 'User-Agent' = $headers['User-Agent'] } -UseBasicParsing -ErrorAction Stop

    if (-not (Test-Path $out) -or (Get-Item $out).Length -lt 1000) {
      throw 'Downloaded image file is unexpectedly small.'
    }
  }
  catch {
    Write-Host ("FAILED: {0} :: {1}" -f $name, $_.Exception.Message)
    $failed += $name
    if (Test-Path $out) { Remove-Item $out -Force }
  }
}

# Persist local image references so the game never falls back to legacy remote URLs.
if ($failed.Count -eq 0) {
  try {
    $jsonOut = $cards | ConvertTo-Json -Depth 10
    Set-Content -Path $cardsFile -Value ("window.CARD_POOL_DATA = " + $jsonOut + ";") -Encoding UTF8
  } catch {
    Write-Host ("ERROR: Could not update data/cards.js with local image paths: {0}" -f $_.Exception.Message)
    exit 1
  }
}

if ($failed.Count -gt 0) {
  Write-Host ''
  Write-Host 'Failed cards:'
  $failed | ForEach-Object { Write-Host (' - ' + $_) }
  exit 1
}

Write-Host ''
Write-Host ("Done. All {0} card images were prepared." -f $cards.Count)

$failedPaths=@()
foreach($card in @($cards)){ $safe=([string]$card.name -replace '[^a-zA-Z0-9._-]','_'); $out=Join-Path $imagesDir ($safe+'.jpg'); if(-not(Test-Path $out)){$failedPaths += [string]$card.name} }
if($failedPaths.Count -gt 0){Write-Host ("ERROR: Missing image files: {0}" -f ($failedPaths -join ', ')); exit 1}
$normalized=$cards|ConvertTo-Json -Depth 20
Set-Content -Path $cardsFile -Value ("window.CARD_POOL_DATA = "+$normalized+";") -Encoding UTF8
Write-Host ("PASS: downloaded and verified {0} card images." -f $cards.Count)
