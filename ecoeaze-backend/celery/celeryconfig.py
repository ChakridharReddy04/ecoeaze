# celery/celeryconfig.py
import os
from dotenv import load_dotenv
from celery.schedules import crontab

load_dotenv()

broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# Serialization
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]

# Timezone / UTC
timezone = "UTC"
enable_utc = True

# Example beat schedule (if you use celery beat)
beat_schedule = {
    "update-analytics-cache-every-30-minutes": {
        "task": "update_analytics_cache",
        "schedule": crontab(minute="*/30"),
    },
    "check-low-stock-every-hour": {
        "task": "check_low_stock_periodic",
        "schedule": crontab(minute=0, hour="*"),
    },
    "cleanup-old-images-daily": {
        "task": "cleanup_old_images",
        "schedule": crontab(hour=2, minute=0),  # Run at 2 AM daily
    },
    "generate-user-engagement-report-weekly": {
        "task": "generate_user_engagement_report",
        "schedule": crontab(day_of_week=1, hour=3, minute=0),  # Run every Monday at 3 AM
    },
}