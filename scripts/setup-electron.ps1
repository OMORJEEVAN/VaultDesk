$distPath = "d:\Credentials\VaultDesk\node_modules\electron\dist"
$pathFile = "d:\Credentials\VaultDesk\node_modules\electron\path.txt"
$cachePath = "$env:LOCALAPPDATA\electron\Cache\electron-v28.3.3-win32-x64.zip"
$zipPath = "d:\Credentials\VaultDesk\electron.zip"

$sourceZip = if (Test-Path $cachePath) { $cachePath } elseif (Test-Path $zipPath) { $zipPath } else { $null }

if ($sourceZip) {
    if (-not (Test-Path "$distPath\electron.exe")) {
        Write-Host "Extracting Electron binary from $sourceZip to $distPath..."
        New-Item -ItemType Directory -Force -Path $distPath | Out-Null
        Expand-Archive -Path $sourceZip -DestinationPath $distPath -Force
        [System.IO.File]::WriteAllText($pathFile, "electron.exe", [System.Text.Encoding]::ASCII)
        Write-Host "Electron extraction complete."
    } else {
        Write-Host "Electron binary already present at $distPath\electron.exe."
    }
} else {
    Write-Host "No cached electron zip found."
}
