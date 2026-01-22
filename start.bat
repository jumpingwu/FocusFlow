@echo off
echo Starting FocusFlow...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the server
echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop
echo.
node server.js

pause