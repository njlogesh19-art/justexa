@echo off
echo ============================================
echo    JUSTEXA - Backend Server Startup
echo ============================================
echo.

SET NODE_PATH=C:\Users\loges\Downloads\node-portable\node-v22.13.1-win-x64
SET PATH=%NODE_PATH%;%PATH%

echo [1/2] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found at %NODE_PATH%
    pause
    exit /b 1
)

echo [2/2] Starting Justexa Backend...
echo.
echo If you see "MongoDB connection failed", you need to:
echo   1. Go to https://cloud.mongodb.com
echo   2. Create a FREE account and M0 cluster
echo   3. Click Connect - Drivers - Copy the URI
echo   4. Open .env and replace MONGODB_URI with your Atlas URI
echo.

cd /d "%~dp0server"
node index.js

pause
