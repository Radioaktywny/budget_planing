@echo off
echo Running AI Service Tests...
echo.

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Warning: Virtual environment not found. Please run setup first.
    echo.
)

REM Run pytest
pytest -v

echo.
echo Tests completed!
pause
