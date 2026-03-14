@echo off
TITLE Kalahandi Real Estate Setup

echo ====================================================
echo   KALAHANDI REAL ESTATE - STARTUP SCRIPT (Windows)
echo ====================================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org
    echo Choose the LTS version (18 or 20)
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version

:: Install backend dependencies
echo.
echo [1/3] Installing Backend dependencies...
cd backend
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend npm install failed!
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed.

:: Install frontend dependencies
echo.
echo [2/3] Installing Frontend dependencies...
cd ../frontend
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend npm install failed!
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed.

:: Start both servers
echo.
echo [3/3] Starting servers...
echo.
echo ====================================================
echo  BACKEND:  http://localhost:5000
echo  FRONTEND: http://localhost:3000
echo ====================================================
echo.
echo Press Ctrl+C in each window to stop the servers.
echo.

cd ..

:: Open backend in new window
start "Kalahandi RE - Backend (Port 5000)" cmd /k "cd backend && npm run dev"

:: Wait a moment
timeout /t 3 /nobreak >nul

:: Open frontend in new window
start "Kalahandi RE - Frontend (Port 3000)" cmd /k "cd frontend && npm start"

echo Both servers starting in separate windows...
echo.
echo Once the frontend starts, it will automatically open in your browser.
echo If it doesn't open, visit: http://localhost:3000
echo.
pause
