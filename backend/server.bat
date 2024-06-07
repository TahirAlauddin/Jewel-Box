@echo off
title JewelBox

:: Path to your virtual environment
set VENV_PATH=venv

:: Activate the virtual environment
call %VENV_PATH%\Scripts\activate.bat

:loop
echo Starting server...

:: Ask the user if they want to install dependencies
set /p install_dependencies="Do you want to install the dependencies? (yes/no): "

if /I "%install_dependencies%" == "yes" (
    pip install -r requirements.txt
) else (
    echo Skipping installation...
)

:: Run database migrations
python manage.py migrate

:: Ask the user if they want to run the collectstatic command
set /p run_collect_static="Do you want to run the collectstatic command? (yes/no): "

if /I "%run_collect_static%" == "yes" (
    python manage.py collectstatic
) else (
    echo Skipping collectstatic command...
)

python manage.py runserver 0.0.0.0:8000

echo.
echo Server stopped.
echo Press Ctrl+C to exit or wait 5 seconds to restart...
timeout /t 5 /nobreak
goto loop
