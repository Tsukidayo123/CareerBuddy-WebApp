@echo off
echo Setting up CareerBuddy WebApp...
echo.

echo Creating virtual environment...
cd backend
python -m venv .venv

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Setup complete! 
echo.
echo To start the server, run:
echo   cd backend
echo   .venv\Scripts\activate
echo   uvicorn main:app --reload
echo.
echo Then open frontend/index.html in your browser or use Live Server.
pause
