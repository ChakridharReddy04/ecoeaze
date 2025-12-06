# Thunder Client API Testing Instructions

This document provides instructions on how to use the Thunder Client collection for testing the GreenHarvest API.

## Prerequisites

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Install the [Thunder Client extension](https://marketplace.visualstudio.com/items?itemName=rangaVadhineni.vscode-thunder-client) for VS Code
3. Ensure the GreenHarvest backend is running on `http://localhost:5001`

## Setup Instructions

### 1. Import the Collection

1. Open VS Code
2. Open the Thunder Client extension (sidebar icon)
3. Click on the "Collections" tab
4. Click the "Import" button
5. Select the `GreenHarvest_API_Collection.json` file from this directory

### 2. Configure Environment Variables

1. In Thunder Client, go to the "Environment" tab
2. Select the "Development" environment
3. Update the variables as needed:
   - `base_url`: API base URL (default: `http://localhost:5001/api`)
   - `access_token`: JWT token obtained after login
   - `product_id`: Product ID for testing product operations
   - `order_id`: Order ID for testing order operations

## Testing Workflow

### 1. Authentication Flow

1. **Register Users**: 
   - Run "Register Customer" and "Register Farmer" requests
   - Note: Use different email addresses for each

2. **Login**:
   - Run "Login Customer" or "Login Farmer"
   - Copy the `accessToken` from the response
   - Update the `access_token` environment variable with this value

### 2. Product Management (Farmer)

1. **Create Product**:
   - Ensure you're logged in as a farmer
   - Run "Farmer - Create Product"
   - Copy the `_id` from the response
   - Update the `product_id` environment variable

2. **View Products**:
   - Run "Farmer - Get My Products" to see all your products
   - Run "Get Product by ID" to view a specific product

3. **Update/Delete Product**:
   - Run "Farmer - Update Product" to modify product details
   - Run "Farmer - Delete Product" to remove a product

### 3. Order Management

1. **Place Order** (as Customer):
   - Ensure you're logged in as a customer
   - Run "Customer - Create Order"
   - Copy the `_id` from the response
   - Update the `order_id` environment variable

2. **View Orders**:
   - Run "Customer - Get My Orders" to see customer's orders
   - Run "Farmer - Get My Orders" to see orders containing farmer's products

3. **Update Order Status** (as Farmer):
   - Run "Farmer - Update Order Status" to change order status

## Common Test Scenarios

### Scenario 1: Complete Customer Journey
1. Register as customer
2. Login as customer
3. Browse products
4. Add products to cart
5. Place order
6. View order history

### Scenario 2: Complete Farmer Journey
1. Register as farmer
2. Login as farmer
3. Add products
4. View incoming orders
5. Update order status
6. View sales reports

## Troubleshooting

### "Failed to fetch" Errors
- Ensure the backend server is running
- Check if the `base_url` is correct
- Verify MongoDB is running and connected

### Authentication Errors
- Make sure you've logged in and updated the `access_token`
- Check if the token has expired (tokens last 15 minutes)
- Re-login to get a fresh token

### "Product not found" Errors
- Ensure the `product_id` variable is set correctly
- Verify the product exists in the database
- Check if you have permission to access the product

## Environment Variables Reference

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `base_url` | API base URL | `http://localhost:5001/api` |
| `access_token` | JWT authentication token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `product_id` | Product identifier | `60f1b2b3c4d5e6f7a8b9c0d1` |
| `order_id` | Order identifier | `60f1b2b3c4d5e6f7a8b9c0d2` |

## API Endpoints Overview

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `GET /farmers/products` - Get farmer's products
- `POST /farmers/products` - Create product
- `PUT /farmers/products/:id` - Update product
- `DELETE /farmers/products/:id` - Delete product

### Orders
- `POST /orders` - Create order
- `GET /orders/my` - Get customer's orders
- `GET /farmers/orders` - Get farmer's orders
- `PATCH /orders/:id/status` - Update order status

### Health
- `GET /health` - Health check endpoint

## Notes

- All requests requiring authentication need the `Authorization: Bearer {{access_token}}` header
- File uploads (for product images) use form-data
- Phone numbers should be 10 digits for Indian numbers
- Product prices are in Indian Rupees (₹)