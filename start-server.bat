@echo off
cd /d "%~dp0"
title Meme Generator - Local Server

echo Meme Generator - Starting server...
echo.

REM Try 'python' first, then Windows launcher 'py'
where python >nul 2>&1
if %errorlevel% equ 0 (
  set PYTHON_CMD=python
  goto :start
)
where py >nul 2>&1
if %errorlevel% equ 0 (
  set PYTHON_CMD=py -3
  goto :start
)
echo ERROR: Python not found in PATH.
echo Install Python from https://www.python.org/ and make sure "Add to PATH" was checked.
echo Or run this script from a terminal where Python is already available.
pause
exit /b 1

:start
echo Using: %PYTHON_CMD%
%PYTHON_CMD% --version
echo.

REM Try port 8080 first; if it fails (e.g. in use), try 8765
echo Open in your browser: http://localhost:8080
echo.
echo Starting HTTP server... Press Ctrl+C to stop.
echo.
%PYTHON_CMD% -m http.server 8080 --bind 127.0.0.1
if %errorlevel% neq 0 (
  echo.
  echo Port 8080 failed. Trying port 8765...
  echo Open in your browser: http://localhost:8765
  echo.
  %PYTHON_CMD% -m http.server 8765 --bind 127.0.0.1
  if %errorlevel% neq 0 (
    echo.
    echo Server failed. Check that no other program is using the port.
    pause
    exit /b 1
  )
)
pause
