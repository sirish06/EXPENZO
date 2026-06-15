@echo off
echo ========================================
echo   SplitWise - Expense Splitter Setup
echo ========================================
echo.

echo [1/2] Installing backend dependencies...
cd backend
call npm install
echo Backend dependencies installed!
echo.

echo [2/2] Installing frontend dependencies...
cd ..\frontend
call npm install
echo Frontend dependencies installed!
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To run the app, open TWO terminals:
echo.
echo   Terminal 1 (Backend):
echo     cd backend
echo     npm run dev
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend
echo     npm run dev
echo.
echo Then open: http://localhost:5173
echo ========================================
pause
