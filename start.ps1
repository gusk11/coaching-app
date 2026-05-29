# CoachOS Starter
$Host.UI.RawUI.WindowTitle = "CoachOS – Fitness Coaching Platform"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host " ============================================" -ForegroundColor Cyan
Write-Host "  CoachOS – Fitness Coaching Platform" -ForegroundColor Cyan
Write-Host " ============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Server startet auf http://localhost:3002 ..." -ForegroundColor Yellow
Write-Host " Browser oeffnet automatisch in 4 Sekunden." -ForegroundColor Gray
Write-Host ""
Write-Host " Zum Beenden: Strg+C druecken" -ForegroundColor Gray
Write-Host ""

# Browser nach 4 Sekunden oeffnen (im Hintergrund)
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 4
    Start-Process "http://localhost:3002/login"
} | Out-Null

# Next.js starten
npx next dev -p 3002
