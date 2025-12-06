import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Add connection options for better reliability
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log(`\n✅ MongoDB Connected: ${conn.connection.host}\n`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error && error.message ? error.message : error}`);
    // Log full error for debugging (stack, name, code)
    try {
      console.error(error);
      if (error && error.stack) console.error(error.stack);
    } catch (e) {
      console.error('Failed to print error object:', e);
    }
    // Don't exit immediately, allow for retry
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

export default connectDB;
