# src/tasks/notificationTasks.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from celery import Celery
from dotenv import load_dotenv
import redis
import json

load_dotenv()

app = Celery(
    "greenharvest_notification_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
)

# Initialize Redis client for real-time notifications
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=2,  # Use database 2 for notifications
    decode_responses=True
)

def _send_email_smtp(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """
    Basic SMTP email sender.
    Config via env:
      SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
    """
    # Support either SMTP_* or EMAIL_* env var names
    host = os.getenv("SMTP_HOST") or os.getenv("EMAIL_HOST")
    port = int(os.getenv("SMTP_PORT") or os.getenv("EMAIL_PORT") or "587")
    username = os.getenv("SMTP_USER") or os.getenv("EMAIL_USER")
    password = os.getenv("SMTP_PASS") or os.getenv("EMAIL_PASS")
    from_email = os.getenv("SMTP_FROM") or os.getenv("EMAIL_FROM") or username

    if not host or not username or not password:
        # Fallback: just print to console
        print("SMTP not configured. Printing email to console instead:")
        print("TO:", to_email)
        print("SUBJECT:", subject)
        print("BODY:", body)
        return False

    # Create message
    if html_body:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email
        
        # Create plain and HTML versions
        part1 = MIMEText(body, "plain")
        part2 = MIMEText(html_body, "html")
        
        msg.attach(part1)
        msg.attach(part2)
    else:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email

    try:
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


@app.task(name="send_email")
def send_email(to: str, subject: str, body: str, html_body: str = None):
    """
    Celery task to send an email.
    Matches enqueueEmailTask() from Node.
    """
    success = _send_email_smtp(to, subject, body, html_body)
    return {"success": success, "to": to, "subject": subject}


@app.task(name="send_sms")
def send_sms(phone_number: str, message: str):
    """
    Stub for SMS sending. In real life you'd integrate with Twilio, etc.
    """
    # TODO: integrate with SMS provider
    print(f"[SMS] To: {phone_number} | Message: {message}")
    return {"success": True, "phone": phone_number}


@app.task(name="send_push_notification")
def send_push_notification(user_id: str, title: str, message: str, data: dict = None):
    """
    Send push notification to user via Redis pub/sub for real-time delivery.
    """
    notification = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "data": data or {},
        "timestamp": __import__('datetime').datetime.utcnow().isoformat()
    }
    
    # Publish to Redis channel
    channel = f"user_notifications:{user_id}"
    redis_client.publish(channel, json.dumps(notification))
    
    # Also store in user's notification list in Redis
    user_notifications_key = f"user:{user_id}:notifications"
    redis_client.lpush(user_notifications_key, json.dumps(notification))
    # Keep only last 100 notifications
    redis_client.ltrim(user_notifications_key, 0, 99)
    # Expire after 30 days
    redis_client.expire(user_notifications_key, 30 * 24 * 60 * 60)
    
    return {"success": True, "user_id": user_id, "title": title}


@app.task(name="send_bulk_notification")
def send_bulk_notification(user_ids: list, title: str, message: str, data: dict = None):
    """
    Send notification to multiple users.
    """
    results = []
    for user_id in user_ids:
        result = send_push_notification.delay(user_id, title, message, data)
        results.append(str(result))
    
    return {"success": True, "results": results}


@app.task(name="send_welcome_email")
def send_welcome_email(user_email: str, user_name: str):
    """
    Send welcome email to new users.
    """
    subject = "Welcome to EcoEaze!"
    
    body = f"""
    Hi {user_name},
    
    Welcome to EcoEaze! We're excited to have you join our community of sustainable shoppers and farmers.
    
    As a {('farmer' if 'farmer' in user_email else 'customer')}, you'll enjoy:
    - Fresh, organic produce directly from local farms
    - Competitive pricing with no middlemen
    - Real-time updates on your orders
    
    Start exploring our marketplace today!
    
    Best regards,
    The EcoEaze Team
    """
    
    html_body = f"""
    <html>
    <body>
        <h2>Welcome to EcoEaze!</h2>
        <p>Hi {user_name},</p>
        
        <p>Welcome to EcoEaze! We're excited to have you join our community of sustainable shoppers and farmers.</p>
        
        <p>As a {('farmer' if 'farmer' in user_email else 'customer')}, you'll enjoy:</p>
        <ul>
            <li>Fresh, organic produce directly from local farms</li>
            <li>Competitive pricing with no middlemen</li>
            <li>Real-time updates on your orders</li>
        </ul>
        
        <p>Start exploring our marketplace today!</p>
        
        <p>Best regards,<br/>
        The EcoEaze Team</p>
    </body>
    </html>
    """
    
    return send_email.delay(user_email, subject, body, html_body)


@app.task(name="send_order_confirmation")
def send_order_confirmation(user_email: str, user_name: str, order_id: str, items: list, total_amount: float):
    """
    Send order confirmation email.
    """
    subject = f"Order Confirmation - #{order_id}"
    
    items_list = "\n".join([f"- {item['name']} x {item['quantity']} @ ₹{item['price']}" for item in items])
    
    body = f"""
    Hi {user_name},
    
    Thank you for your order! Here are the details:
    
    Order ID: {order_id}
    
    Items:
    {items_list}
    
    Total Amount: ₹{total_amount:.2f}
    
    Your order is being processed and will be shipped soon. We'll notify you when it's on its way.
    
    Best regards,
    The EcoEaze Team
    """
    
    html_body = f"""
    <html>
    <body>
        <h2>Order Confirmation</h2>
        <p>Hi {user_name},</p>
        
        <p>Thank you for your order! Here are the details:</p>
        
        <p><strong>Order ID:</strong> {order_id}</p>
        
        <h3>Items:</h3>
        <ul>
        {''.join([f"<li>{item['name']} x {item['quantity']} @ ₹{item['price']}</li>" for item in items])}
        </ul>
        
        <p><strong>Total Amount:</strong> ₹{total_amount:.2f}</p>
        
        <p>Your order is being processed and will be shipped soon. We'll notify you when it's on its way.</p>
        
        <p>Best regards,<br/>
        The EcoEaze Team</p>
    </body>
    </html>
    """
    
    return send_email.delay(user_email, subject, body, html_body)


@app.task(name="send_otp_email")
def send_otp_email(user_email: str, code: str, expires_minutes: int = 5):
        """
        Send an OTP email to the user. This task wraps `send_email`.
        Arguments:
            user_email: recipient email
            code: OTP code (string)
            expires_minutes: expiry in minutes (default 5)
        """
        subject = "Your EcoEaze verification code"
        body = f"""
Hi,

Your EcoEaze verification code is: {code}

This code will expire in {expires_minutes} minutes. If you did not request this, please ignore this email.

Best,
EcoEaze Team
"""
        html_body = f"""
<html>
<body>
    <p>Hi,</p>
    <p>Your EcoEaze verification code is: <strong>{code}</strong></p>
    <p>This code will expire in {expires_minutes} minutes. If you did not request this, please ignore this email.</p>
    <p>Best,<br/>EcoEaze Team</p>
</body>
</html>
"""

        return send_email.delay(user_email, subject, body, html_body)