@echo off
REM Startup script for Windows

echo Starting Budget Manager AI Service...

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Start the service
python main.py

pause
