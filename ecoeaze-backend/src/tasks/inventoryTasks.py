# src/tasks/inventoryTasks.py
import os
import json
from datetime import datetime, timedelta
from celery import Celery
from dotenv import load_dotenv
import redis

load_dotenv()

app = Celery(
    "greenharvest_inventory_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
)

# Initialize Redis client for inventory tracking
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=4,  # Use database 4 for inventory
    decode_responses=True
)

@app.task(name="low_stock_alert")
def low_stock_alert(farmerId: str, productId: str, currentStock: int):
    """
    Triggered when product stock is low.
    Node calls enqueueCeleryTask("low_stock_alert", {...})

    Here you can:
      - send email
      - send SMS
      - push notification, etc.
    For now, we'll just log/print.
    """
    print(
        f"[LOW STOCK ALERT] Farmer: {farmerId}, Product: {productId}, Stock: {currentStock}"
    )

    # TODO: integrate with send_email / SMS provider if needed
    return {
        "success": True,
        "farmerId": farmerId,
        "productId": productId,
        "currentStock": currentStock,
    }


@app.task(name="check_low_stock_periodic")
def check_low_stock_periodic():
    """
    Example periodic task (for celery beat):
    You could scan your DB (via Node API) for products with low stock and
    then call low_stock_alert for each.

    This is just a stub for now.
    """
    # TODO: call backend API to get low-stock products and send alerts
    print("[INVENTORY] Running periodic low stock check...")
    return {"success": True}


@app.task(name="auto_reorder_stock")
def auto_reorder_stock(product_id: str, farmer_id: str, current_stock: int, min_stock: int = 10):
    """
    Automatically reorder stock when it falls below minimum level.
    """
    # Check if we've already triggered a reorder for this product recently
    reorder_key = f"reorder_triggered:{product_id}"
    if redis_client.exists(reorder_key):
        return {"success": False, "message": "Reorder already triggered recently"}
    
    # Set a flag to prevent duplicate reorders (expires in 24 hours)
    redis_client.setex(reorder_key, 24 * 60 * 60, "true")
    
    # Log the reorder event
    reorder_event = {
        "product_id": product_id,
        "farmer_id": farmer_id,
        "current_stock": current_stock,
        "min_stock": min_stock,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Store in Redis list for audit trail
    redis_client.lpush("reorder_events", json.dumps(reorder_event))
    
    # In a real implementation, you would:
    # 1. Notify the farmer via email/SMS
    # 2. Create a purchase order in the system
    # 3. Integrate with supplier systems
    
    print(f"[AUTO REORDER] Product {product_id} stock ({current_stock}) below minimum ({min_stock})")
    
    return {
        "success": True,
        "product_id": product_id,
        "farmer_id": farmer_id,
        "reordered_quantity": min_stock * 2  # Reorder twice the minimum
    }


@app.task(name="update_inventory_cache")
def update_inventory_cache(product_id: str, new_quantity: int):
    """
    Update inventory cache in Redis when stock levels change.
    """
    # Update the main inventory cache
    cache_key = f"product_stock:{product_id}"
    redis_client.setex(cache_key, 300, str(new_quantity))  # Cache for 5 minutes
    
    # Publish to Redis pub/sub for real-time updates
    update_message = {
        "product_id": product_id,
        "new_quantity": new_quantity,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    redis_client.publish("inventory_updates", json.dumps(update_message))
    
    # Track inventory movement
    movement_record = {
        "product_id": product_id,
        "quantity": new_quantity,
        "timestamp": datetime.utcnow().timestamp()
    }
    
    # Store in sorted set for time-series analysis
    movement_key = f"inventory_movement:{product_id}"
    redis_client.zadd(movement_key, {json.dumps(movement_record): datetime.utcnow().timestamp()})
    
    # Keep only last 1000 movements
    redis_client.zremrangebyrank(movement_key, 0, -1001)
    
    return {
        "success": True,
        "product_id": product_id,
        "new_quantity": new_quantity
    }


@app.task(name="generate_inventory_report")
def generate_inventory_report(farmer_id: str = None):
    """
    Generate inventory report for a farmer or all farmers.
    """
    try:
        # In a real implementation, you would fetch this data from your database
        # For now, we'll simulate with Redis data
        
        # Get all product stock levels from cache
        pattern = "product_stock:*"
        keys = redis_client.keys(pattern)
        
        inventory_data = []
        for key in keys:
            product_id = key.split(":")[1]
            stock_level = int(redis_client.get(key) or 0)
            
            # Get product details from another cache (simulated)
            product_info_key = f"product_info:{product_id}"
            product_info = redis_client.get(product_info_key)
            
            inventory_data.append({
                "product_id": product_id,
                "stock_level": stock_level,
                "product_info": json.loads(product_info) if product_info else {},
                "status": "Low Stock" if stock_level < 10 else "Adequate" if stock_level < 50 else "High Stock"
            })
        
        # Filter by farmer if specified
        if farmer_id:
            inventory_data = [item for item in inventory_data if item.get("product_info", {}).get("farmer_id") == farmer_id]
        
        # Generate report
        report_data = {
            "generated_at": datetime.utcnow().isoformat(),
            "farmer_id": farmer_id,
            "total_products": len(inventory_data),
            "low_stock_items": len([item for item in inventory_data if item["status"] == "Low Stock"]),
            "adequate_stock_items": len([item for item in inventory_data if item["status"] == "Adequate"]),
            "high_stock_items": len([item for item in inventory_data if item["status"] == "High Stock"]),
            "inventory_details": inventory_data
        }
        
        # Save report
        reports_dir = os.getenv("REPORTS_DIR", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"inventory_report_{farmer_id or 'all'}_{timestamp}.json"
        path = os.path.join(reports_dir, filename)
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
        
        # Cache in Redis for quick access
        cache_key = f"inventory_report:{farmer_id or 'all'}"
        redis_client.setex(cache_key, 3600, json.dumps(report_data))  # Cache for 1 hour
        
        return {
            "success": True,
            "report_path": path,
            "summary": {
                "total_products": report_data["total_products"],
                "low_stock_items": report_data["low_stock_items"]
            }
        }
        
    except Exception as e:
        return {"success": False, "message": f"Failed to generate inventory report: {e}"}


@app.task(name="predict_demand")
def predict_demand(product_id: str, days_ahead: int = 7):
    """
    Predict future demand based on historical sales data.
    """
    try:
        # Get historical sales data from Redis
        sales_key = f"sales_history:{product_id}"
        sales_data = redis_client.lrange(sales_key, 0, -1)
        
        if not sales_data:
            return {"success": False, "message": "No historical sales data available"}
        
        # Parse sales data
        daily_sales = {}
        for sale_str in sales_data:
            sale = json.loads(sale_str)
            date = sale.get("date")
            quantity = sale.get("quantity", 0)
            
            if date in daily_sales:
                daily_sales[date] += quantity
            else:
                daily_sales[date] = quantity
        
        # Simple prediction: average of last 7 days
        recent_sales = list(daily_sales.values())[-7:] if len(daily_sales) >= 7 else list(daily_sales.values())
        avg_daily_sales = sum(recent_sales) / len(recent_sales) if recent_sales else 0
        
        predicted_demand = avg_daily_sales * days_ahead
        
        prediction_data = {
            "product_id": product_id,
            "days_ahead": days_ahead,
            "predicted_demand": predicted_demand,
            "avg_daily_sales": avg_daily_sales,
            "historical_days": len(daily_sales),
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Cache prediction
        cache_key = f"demand_prediction:{product_id}:{days_ahead}"
        redis_client.setex(cache_key, 86400, json.dumps(prediction_data))  # Cache for 24 hours
        
        return {
            "success": True,
            "prediction": prediction_data
        }
        
    except Exception as e:
        return {"success": False, "message": f"Failed to predict demand: {e}"}