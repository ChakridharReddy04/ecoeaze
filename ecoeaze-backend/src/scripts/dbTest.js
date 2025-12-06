// src/scripts/dbTest.js
// Script to test MongoDB connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGO_URI:', process.env.MONGO_URI);
    
    // Test connection
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ MongoDB Connected successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    
    // Test basic operations
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    // Create a test document
    const testDoc = new TestModel({ test: 'Connection test' });
    await testDoc.save();
    console.log('✅ Write operation successful');
    
    // Read the test document
    const foundDoc = await TestModel.findOne({ test: 'Connection test' });
    console.log('✅ Read operation successful:', foundDoc.test);
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Cleanup successful');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Test Failed:', error.message);
    process.exit(1);
  }
};

testConnection();