# Build Release Package for SSRN Quick Jump
# This script creates a properly structured zip file for GitHub Releases

$version = "v0.1.0"
$outputName = "ssrn-quick-jump-$version.zip"

Write-Host "Building release package: $outputName" -ForegroundColor Green

# Remove old release zip if exists
if (Test-Path $outputName) {
    Remove-Item $outputName
    Write-Host "Removed old release file" -ForegroundColor Yellow
}

# Files to include in the release
$filesToInclude = @(
    "manifest.json",
    "content.js",
    "ssrn-redirect.js",
    "popup.html",
    "popup.css",
    "popup.js",
    "LICENSE",
    "icons"
)

Write-Host "Creating zip archive..." -ForegroundColor Cyan

# Create zip directly without intermediate folder
$filesToZip = @()
foreach ($item in $filesToInclude) {
    if (Test-Path $item) {
        $filesToZip += Get-Item $item
        Write-Host "  ✓ $item" -ForegroundColor Gray
    }
}

# Compress files directly (no parent folder in zip)
Compress-Archive -Path $filesToZip -DestinationPath $outputName -Force

Write-Host "`n✓ Release package created: $outputName" -ForegroundColor Green
Write-Host "Files are at root level in the zip - no extra folders!" -ForegroundColor Yellow
Write-Host "You can now upload this to GitHub Releases" -ForegroundColor Cyan
