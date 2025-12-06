import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantityReserved: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdateReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
