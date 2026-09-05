@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0prepare_cards.ps1"
set "code=%ERRORLEVEL%"
echo.
if not "%CARDWOLF_NO_PAUSE%"=="1" pause
exit /b %code%
