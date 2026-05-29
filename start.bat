@echo off
title CoachOS – Fitness Coaching Platform
color 0B
echo.
echo  ============================================
echo   CoachOS – Fitness Coaching Platform
echo  ============================================
echo.
echo  Starte Server auf http://localhost:3002 ...
echo.

cd /d "%~dp0"

:: Pruefe ob Node installiert ist
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  FEHLER: Node.js ist nicht installiert.
    echo  Bitte installieren unter https://nodejs.org
    pause
    exit /b 1
)

:: Oeffne Browser nach 4 Sekunden im Hintergrund
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3002/login"

:: Starte Next.js Dev Server
npx next dev -p 3002

pause
