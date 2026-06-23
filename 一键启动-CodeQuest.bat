@echo off
setlocal

set "ROOT=%~dp0"

echo Starting CodeQuest server...
start "CodeQuest Server" powershell -NoExit -Command "Set-Location -LiteralPath '%ROOT%server'; npm run dev"

echo Starting CodeQuest client...
start "CodeQuest Client" powershell -NoExit -Command "Set-Location -LiteralPath '%ROOT%client'; npm run dev"

echo Opening browser...
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000/"

echo CodeQuest startup complete.
endlocal
