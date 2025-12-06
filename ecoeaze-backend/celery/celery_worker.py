# celery/celery_worker.py
import os
import sys
from celery import Celery
from dotenv import load_dotenv

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

load_dotenv()

BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

celery_app = Celery(
    "greenharvest",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
)

# Tell Celery where to find tasks
celery_app.autodiscover_tasks(
    [
        "src.tasks.imageTasks",
        "src.tasks.notificationTasks",
        "src.tasks.analyticsTasks",
        "src.tasks.inventoryTasks",
    ]
)


if __name__ == "__main__":
    # Run worker with: python celery_worker.py
    celery_app.worker_main(["worker", "-l", "info"])