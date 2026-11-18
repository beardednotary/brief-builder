# Renders the App Store screenshots from raw/<n>.png into out/<size>/<n>.png.
#
#   powershell -ExecutionPolicy Bypass -File store\screenshots\render.ps1
#   powershell -ExecutionPolicy Bypass -File store\screenshots\render.ps1 -Slides "1,3"
#
# Uses headless Microsoft Edge (or Chrome) to draw frame.html at each size,
# then redraws every image onto an opaque 24-bit canvas, because App Store
# Connect rejects screenshots that have an alpha channel.

param(
  # Comma-separated, e.g. "1,3". A string because -File mode would read
  # an unquoted 1,3 as the number 13.
  [string]$Slides = '1,2,3,4,5,6'
)

$ErrorActionPreference = 'Stop'
$slideNumbers = $Slides -split ',' | ForEach-Object { [int]$_.Trim() }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$browser = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'Microsoft Edge or Google Chrome is required.' }

Add-Type -AssemblyName System.Drawing

# Required: iPhone with Dynamic Island, medium display (1206 x 2622).
# Optional: large display (1320 x 2868), sharper on Pro Max phones.
$sizes = @(
  @{ Name = 'iphone-medium-1206x2622'; W = 1206; H = 2622 },
  @{ Name = 'iphone-large-1320x2868'; W = 1320; H = 2868 }
)

$frameUrl = 'file:///' + ((Join-Path $here 'frame.html') -replace '\\', '/')
$browserProfile = Join-Path $env:TEMP 'briefbuilder-screenshots-browser'

foreach ($size in $sizes) {
  $outDir = Join-Path $here ("out\" + $size.Name)
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null

  foreach ($n in $slideNumbers) {
    $tmp = Join-Path $outDir "$n.render.png"
    $final = Join-Path $outDir "$n.png"
    if (Test-Path $tmp) { Remove-Item $tmp }

    $browserArgs = @(
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      "--user-data-dir=$browserProfile",
      '--virtual-time-budget=5000',
      "--window-size=$($size.W),$($size.H)",
      "--screenshot=$tmp",
      "${frameUrl}?n=$n"
    )
    $proc = Start-Process -FilePath $browser -ArgumentList $browserArgs -Wait -PassThru -WindowStyle Hidden
    if (-not (Test-Path $tmp)) { throw "The browser did not write slide $n ($($size.Name)); exit code $($proc.ExitCode)." }

    # Redraw onto an opaque 24-bit RGB bitmap so the PNG has no alpha channel.
    $src = [System.Drawing.Image]::FromFile($tmp)
    try {
      $bmp = New-Object System.Drawing.Bitmap $size.W, $size.H, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.DrawImage($src, 0, 0, $size.W, $size.H)
      $g.Dispose()
    } finally {
      $src.Dispose()
    }
    $bmp.Save($final, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Remove-Item $tmp

    "{0,-26} slide {1} -> {2}" -f $size.Name, $n, $final
  }
}
