// src/models/Product.js
import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },

    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "kg" }, // kg, dozen, bunch, etc.

    category: { type: String },
    tags: [{ type: String }],

    isOrganic: { type: Boolean, default: true },
    certification: { type: String }, // e.g. "NPOP Certified", "FPO Verified"

    isSeasonal: { type: Boolean, default: false },
    harvestDate: { type: Date },

    farmLocation: { type: String },

    // ✅ main image URL (what we store from Cloudinary)
    imageUrl: { type: String },

    // ✅ array used by older UI / shop
    images: [imageSchema],

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ optional visibility flag
    isActive: { type: Boolean, default: true },

    // ✅ slug for SEO-friendly URLs
    slug: { type: String, unique: true, sparse: true },

    averageRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
