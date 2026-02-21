@echo off
SET NODE_PATH=C:\Users\loges\Downloads\node-portable\node-v22.13.1-win-x64
SET PATH=%NODE_PATH%;%PATH%

echo Starting Justexa Frontend...
cd /d "%~dp0client"
"%NODE_PATH%\npm.cmd" start
