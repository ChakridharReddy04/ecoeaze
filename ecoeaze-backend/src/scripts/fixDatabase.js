// src/scripts/fixDatabase.js
// Script to fix database issues with products collection
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const fixDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ MongoDB Connected successfully!');
    
    // Check if there's a slug index
    const indexes = await Product.collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Look for slug index
    const slugIndex = indexes.find(index => index.name === 'slug_1');
    if (slugIndex) {
      console.log('Found slug index, dropping it...');
      await Product.collection.dropIndex('slug_1');
      console.log('✅ Slug index dropped successfully');
    } else {
      console.log('No slug index found');
    }
    
    // Update all products to have unique slugs
    console.log('Generating slugs for all products...');
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);
    
    for (const product of products) {
      // If product doesn't have a slug or has a null slug, generate one
      if (!product.slug) {
        // Generate a slug based on name and ID to ensure uniqueness
        const baseSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const slug = `${baseSlug}-${product._id.toString().slice(-6)}`;
        product.slug = slug;
        await product.save();
        console.log(`✅ Updated product ${product._id} with slug: ${slug}`);
      }
    }
    
    console.log('✅ Database fix completed successfully!');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    process.exit(1);
  }
};

fixDatabase();