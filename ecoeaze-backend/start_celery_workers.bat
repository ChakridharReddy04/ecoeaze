@echo off
echo Starting Celery Workers for EcoEaze Backend
echo ==========================================

REM Start the main Celery worker
echo Starting main Celery worker...
start "Celery Worker" cmd /k "cd /d %~dp0 && python celery/celery_worker.py"

REM Start Celery Beat for periodic tasks (optional)
echo Starting Celery Beat scheduler...
start "Celery Beat" cmd /k "cd /d %~dp0 && celery -A celery.celery_worker.celery_app beat -l info"

echo.
echo Celery workers started successfully!
echo.
echo To stop the workers, close the command prompt windows or press Ctrl+C in each window.
pause