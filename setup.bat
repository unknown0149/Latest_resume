@echo off
echo ========================================
echo Resume Genie - Complete Setup
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
cd backend
if exist node_modules (
    echo Backend dependencies already installed, skipping...
) else (
    call npm install
)
echo.

echo [2/4] Installing Frontend Dependencies...
cd ../frontend
if exist node_modules (
    echo Frontend dependencies already installed, skipping...
) else (
    call npm install
)
echo.

echo [3/4] Checking MongoDB...
echo Please make sure MongoDB is installed and running.
echo Run "mongod" in a separate terminal if not already running.
echo.

echo [4/4] Setup Complete!
echo.
echo ========================================
echo HOW TO RUN:
echo ========================================
echo.
echo 1. Start MongoDB (in Terminal 1):
echo    mongod
echo.
echo 2. Start Backend (in Terminal 2):
echo    cd backend
echo    npm run dev
echo.
echo 3. Start Frontend (in Terminal 3):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open browser: http://localhost:3000
echo.
echo ========================================
echo FIRST TIME SETUP:
echo ========================================
echo 1. Click "Get Started" or "Register"
echo 2. Create an account
echo 3. Upload your resume
echo 4. View your personalized dashboard!
echo.
echo ========================================
pause
