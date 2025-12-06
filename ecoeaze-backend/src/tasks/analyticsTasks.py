# src/tasks/analyticsTasks.py
import os
import json
import csv
from datetime import datetime, timedelta
from celery import Celery
from dotenv import load_dotenv
import requests
import redis

load_dotenv()

app = Celery(
    "greenharvest_analytics_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
)

ANALYTICS_API_BASE = os.getenv("ANALYTICS_API_BASE", "http://localhost:5008/api")

# Initialize Redis client for caching analytics data
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=3,  # Use database 3 for analytics
    decode_responses=True
)

@app.task(name="generate_sales_report")
def generate_sales_report(farmerId: str, range: str = "7d"):
    """
    Generate a simple sales report for a farmer.
    This can call your Node backend's admin/analytics endpoints.

    :param farmerId: Farmer's user id (string)
    :param range: e.g. "7d", "30d"
    """
    # Example: call your backend analytics API (you can change the URL)
    try:
        url = f"{ANALYTICS_API_BASE}/admin/stats"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        stats = response.json()
    except Exception as e:
        return {"success": False, "message": f"Failed to fetch stats: {e}"}

    # Save a JSON report to disk (simple example)
    reports_dir = os.getenv("REPORTS_DIR", "reports")
    os.makedirs(reports_dir, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"sales_report_farmer_{farmerId}_{range}_{timestamp}.json"
    path = os.path.join(reports_dir, filename)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(
          {
            "farmerId": farmerId,
            "range": range,
            "generatedAt": datetime.utcnow().isoformat(),
            "stats": stats,
          },
          f,
          indent=2,
        )

    return {
        "success": True,
        "reportPath": path,
    }


@app.task(name="track_user_behavior")
def track_user_behavior(user_id: str, action: str, metadata: dict = None):
    """
    Track user behavior for analytics and personalization.
    """
    behavior_data = {
        "user_id": user_id,
        "action": action,
        "metadata": metadata or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Store in Redis sorted set for quick access
    key = f"user:{user_id}:behaviors"
    score = datetime.utcnow().timestamp()
    redis_client.zadd(key, {json.dumps(behavior_data): score})
    
    # Keep only last 1000 behaviors
    redis_client.zremrangebyrank(key, 0, -1001)
    # Expire after 90 days
    redis_client.expire(key, 90 * 24 * 60 * 60)
    
    return {"success": True, "user_id": user_id, "action": action}


@app.task(name="generate_profit_loss_report")
def generate_profit_loss_report(farmer_id: str, period: str = "monthly"):
    """
    Generate profit/loss report for a farmer.
    """
    try:
        # Call backend API to get farmer's orders
        url = f"{ANALYTICS_API_BASE}/farmers/orders"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        orders = response.json().get("data", [])
        
        # Filter orders for this farmer
        farmer_orders = [order for order in orders if order.get("farmerId") == farmer_id]
        
        # Calculate profit/loss
        total_revenue = 0
        total_cost = 0
        
        for order in farmer_orders:
            for item in order.get("items", []):
                total_revenue += item.get("price", 0) * item.get("quantity", 0)
                # Assuming 30% cost of goods sold
                total_cost += item.get("price", 0) * item.get("quantity", 0) * 0.3
        
        profit = total_revenue - total_cost
        profit_margin = (profit / total_revenue * 100) if total_revenue > 0 else 0
        
        report_data = {
            "farmer_id": farmer_id,
            "period": period,
            "generated_at": datetime.utcnow().isoformat(),
            "total_revenue": total_revenue,
            "total_cost": total_cost,
            "profit": profit,
            "profit_margin": profit_margin,
            "order_count": len(farmer_orders)
        }
        
        # Cache in Redis for quick dashboard access
        cache_key = f"profit_loss:{farmer_id}:{period}"
        redis_client.setex(cache_key, 3600, json.dumps(report_data))  # Cache for 1 hour
        
        # Save to reports directory
        reports_dir = os.getenv("REPORTS_DIR", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"profit_loss_report_{farmer_id}_{period}_{timestamp}.json"
        path = os.path.join(reports_dir, filename)
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
            
        return {
            "success": True,
            "report_path": path,
            "data": report_data
        }
        
    except Exception as e:
        return {"success": False, "message": f"Failed to generate profit/loss report: {e}"}


@app.task(name="generate_user_engagement_report")
def generate_user_engagement_report(period: str = "weekly"):
    """
    Generate user engagement report for admins.
    """
    try:
        # Get user behavior data from Redis
        # This is a simplified example - in practice you'd aggregate from multiple sources
        active_users_key = "active_users:weekly"  # This would be populated by other processes
        new_users_key = "new_users:weekly"  # This would be populated by other processes
        
        active_users_count = int(redis_client.get(active_users_key) or 0)
        new_users_count = int(redis_client.get(new_users_key) or 0)
        
        report_data = {
            "period": period,
            "generated_at": datetime.utcnow().isoformat(),
            "active_users": active_users_count,
            "new_users": new_users_count,
            "engagement_rate": (active_users_count / max(new_users_count, 1)) * 100
        }
        
        # Cache in Redis
        cache_key = f"user_engagement:{period}"
        redis_client.setex(cache_key, 7200, json.dumps(report_data))  # Cache for 2 hours
        
        # Save to reports directory
        reports_dir = os.getenv("REPORTS_DIR", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"user_engagement_report_{period}_{timestamp}.json"
        path = os.path.join(reports_dir, filename)
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
            
        return {
            "success": True,
            "report_path": path,
            "data": report_data
        }
        
    except Exception as e:
        return {"success": False, "message": f"Failed to generate user engagement report: {e}"}


@app.task(name="update_analytics_cache")
def update_analytics_cache():
    """
    Periodically update cached analytics data for dashboards.
    """
    try:
        # Fetch platform stats
        url = f"{ANALYTICS_API_BASE}/admin/stats"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        stats = response.json()
        
        # Cache in Redis
        redis_client.setex("platform_stats", 1800, json.dumps(stats))  # Cache for 30 minutes
        
        # Also update individual stat caches
        data = stats.get("data", {})
        for key, value in data.items():
            redis_client.setex(f"stat:{key}", 1800, str(value))
            
        return {"success": True, "cached_keys": list(data.keys())}
        
    except Exception as e:
        return {"success": False, "message": f"Failed to update analytics cache: {e}"}