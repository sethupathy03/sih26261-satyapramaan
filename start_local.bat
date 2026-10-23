@echo off
echo ========================================================
echo   SatyaPramaan AI - SIH26261 Local Production Launcher
echo ========================================================

echo [*] Starting FastAPI Backend on port 8000...
start cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [*] Starting Vite Frontend on port 5173...
start cmd /k "cd frontend && npm run dev"

echo [OK] Both servers launched!
echo      - Frontend UI: http://localhost:5173/
echo      - Backend Docs: http://127.0.0.1:8000/docs
pause
