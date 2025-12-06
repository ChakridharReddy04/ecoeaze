// src/controllers/userController.js
import User from "../models/User.js";

/**
 * GET /api/users/profile
 * Requires auth
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/profile
 * Body: { name?, email?, password? }
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const { name, email } = req.body;

    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated",
      user,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getProfile,
  updateProfile,
};
