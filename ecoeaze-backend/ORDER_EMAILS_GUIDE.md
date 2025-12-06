# Order Confirmation & Delivery Emails

## Overview
When customers place an order, they automatically receive a beautiful email confirmation with:
- Order details and items
- Total amount
- Expected delivery date (2 days from order)
- Order status updates

## ✅ Features Implemented

### 1. Order Confirmation Email
**Triggers:** When order is created

**Contents:**
- ✅ Order ID
- ✅ All items with quantities, prices, and totals
- ✅ Total order amount
- ✅ Order date
- ✅ Expected delivery date (+2 days)
- ✅ Current status (Processing)
- ✅ Track order link
- ✅ Next steps information

**Template:** Beautiful gradient header, professional layout, mobile-responsive

### 2. Delivery Status Update Emails
**Triggers:** When order status changes

**Status Emails:**
- 📦 **Shipped** - Order is being prepared and shipped
- 🚚 **Out for Delivery** - Order is on the way today
- ✅ **Delivered** - Order has arrived!

**Features:**
- Status-specific colors and icons
- Order ID for reference
- Clear next steps
- Professional branding

## How It Works

### Frontend Flow
1. User adds items to cart
2. User clicks "Place Order"
3. Order is created in database
4. Confirmation email is sent immediately

### Backend Flow

#### Creating an Order
```javascript
POST /api/orders
Body: {
  items: [
    { productId: "id", quantity: 2 }
  ],
  phone: "+919876543210"
}
```

**Process:**
1. Validate items and calculate total
2. Deduct stock from products
3. Create order in database
4. Send confirmation email directly
5. Queue backup notifications via Celery
6. Track analytics in Redis

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "_id": "order_id",
    "status": "pending",
    "totalAmount": 450,
    "items": [...],
    "createdAt": "2024-12-06T10:30:00Z"
  }
}
```

#### Updating Order Status
```javascript
PATCH /api/orders/:id/status
Body: { status: "shipped" }
```

**Status Transitions:**
```
pending → confirmed, cancelled
confirmed → shipped, delivered, cancelled
shipped → delivered, returned
delivered → returned
```

**Auto-sends email:**
- When status changes to: shipped, out_for_delivery, or delivered
- Email contains order ID and new status

## Email Templates

### Order Confirmation
```
Subject: Order Confirmed - EcoEaze #orderId
```

Features:
- Green gradient header
- Order summary table
- Delivery date calculation (+2 days)
- Item-wise breakdown
- Total calculation
- Delivery badge
- CTA button to track order

### Delivery Updates
```
Subject: [Icon] Order Update - EcoEaze #orderId
```

Features:
- Status-specific colors:
  - Blue for Shipped
  - Orange for Out for Delivery
  - Green for Delivered
- Simple, clear message
- Order ID reference
- Status badge

## API Endpoints

### Create Order
```
POST /api/orders
Headers: Authorization: Bearer token
Body: {
  items: [{ productId, quantity }],
  phone: "+919876543210"
}
```

### Update Order Status
```
PATCH /api/orders/:id/status
Headers: Authorization: Bearer token
Body: { status: "shipped" | "delivered" | "out_for_delivery" }
```

### Get My Orders
```
GET /api/orders/my
Headers: Authorization: Bearer token
```

### Get Farmer's Orders
```
GET /api/farmers/orders
Headers: Authorization: Bearer token (Farmer only)
```

## Email Service Functions

### sendOrderConfirmationEmail()
```javascript
import { sendOrderConfirmationEmail } from '@/services/emailService';

await sendOrderConfirmationEmail(
  email,           // customer email
  customerName,    // customer name
  orderId,         // order ID
  items,           // array of { name, quantity, price }
  totalAmount      // total order amount
);
```

### sendDeliveryUpdateEmail()
```javascript
import { sendDeliveryUpdateEmail } from '@/services/emailService';

await sendDeliveryUpdateEmail(
  email,        // customer email
  customerName, // customer name
  orderId,      // order ID
  status        // "shipped" | "out_for_delivery" | "delivered"
);
```

## Order Model Schema

```javascript
{
  user: ObjectId,           // Reference to User
  items: [
    {
      product: ObjectId,    // Reference to Product
      name: String,
      price: Number,
      quantity: Number,
      farmer: ObjectId      // Reference to Farmer
    }
  ],
  totalAmount: Number,
  phone: String,
  status: String,           // pending, confirmed, shipped, delivered, etc.
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

### Test Order Creation
1. Open `http://localhost:8081/shop`
2. Add items to cart
3. Go to checkout
4. Enter phone number
5. Click "Place Order"
6. Check email for confirmation

### Test Status Updates
1. Go to admin/farmer portal
2. View orders
3. Click "Update Status"
4. Change to "shipped" or "delivered"
5. Check customer email for update

## Email Configuration

**Required .env variables:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Notes:**
- Uses Gmail SMTP with App Password (not regular Gmail password)
- Requires 2-Step Verification enabled on Gmail account
- Supports HTML email templates
- Automatic retry on failure via Celery fallback

## Features

✅ Beautiful HTML email templates
✅ Mobile-responsive design
✅ Green theme (EcoEaze branding)
✅ Order details with pricing
✅ Automatic delivery date calculation (+2 days)
✅ Status tracking updates
✅ Professional footer with company info
✅ Error handling and logging
✅ Celery fallback for reliability
✅ Direct SMTP for fast delivery

## File Locations

- **Email Service**: `src/services/emailService.js`
- **Order Controller**: `src/controllers/orderController.js`
- **Email Config**: `src/config/email.js`
- **Routes**: `src/routes/orderRoutes.js`

## Next Steps

The order email system is ready! When orders are placed:
1. ✅ Confirmation email sent immediately
2. ✅ Delivery date shown (+2 days)
3. ✅ Status updates sent as order progresses
4. ✅ All emails have professional branding

All done! 🎉
