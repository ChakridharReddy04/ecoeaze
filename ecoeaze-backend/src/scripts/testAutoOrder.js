// Test script for automatic order confirmation based on stock
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

dotenv.config();

// Connect to database
connectDB();

// Test function
async function testAutoOrder() {
  try {
    console.log('Testing automatic order confirmation...');
    
    // Get a product to test with
    const product = await Product.findOne({ stock: { $gt: 0 } });
    if (!product) {
      console.log('No product with stock found');
      return;
    }
    
    console.log(`Found product: ${product.name} with stock: ${product.stock}`);
    
    // Create test order data
    const testOrder = {
      user: '692d800ce5d162bce37892a1', // Test user ID
      items: [{
        product: product._id,
        farmer: product.farmer,
        name: product.name,
        price: product.price,
        quantity: 1
      }],
      totalAmount: product.price,
      status: 'pending'
    };
    
    console.log('Creating order with sufficient stock...');
    const order = await Order.create(testOrder);
    console.log('Order created with ID:', order._id);
    console.log('Initial status:', order.status);
    
    // Update order status based on stock (simulating our new logic)
    const stockAvailable = product.stock >= 1;
    const newStatus = stockAvailable ? 'confirmed' : 'cancelled';
    
    order.status = newStatus;
    await order.save();
    
    console.log('Updated status:', order.status);
    console.log(stockAvailable 
      ? 'Order confirmed automatically due to sufficient stock' 
      : 'Order cancelled automatically due to insufficient stock');
    
    // Clean up - delete test order
    await Order.findByIdAndDelete(order._id);
    console.log('Test order cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run test
testAutoOrder();