import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    farmName: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    certifications: [
      {
        name: { type: String, trim: true }, // e.g. "USDA Organic"
        issuer: { type: String, trim: true }, // e.g. "Government Body"
        validFrom: Date,
        validTo: Date,
        certificateId: { type: String, trim: true },
      },
    ],
    avatarUrl: {
      type: String,
      trim: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Farmer = mongoose.model("Farmer", farmerSchema);
export default Farmer;
