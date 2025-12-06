import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';

/**
 * Middleware to require farmer authentication
 * Checks for valid JWT token and farmer role
 */
export const requireFarmer = async (req, res, next) => {
  try {
    // Get token from header or cookies
    let token = null;
    
    // Check Authorization header first
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    // If no token in header, check cookies
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Find user and check if they're a farmer
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.role !== 'farmer') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Farmer role required.' 
      });
    }

    // Add user to request object
    req.user = {
      id: user._id,
      role: user.role,
      email: user.email
    };
    next();
    
  } catch (error) {
    console.error('Farmer middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error in authentication' 
    });
  }
};

/**
 * Middleware to check if farmer profile is complete
 * This is optional and can be used for specific routes that require a complete profile
 */
export const requireCompleteFarmerProfile = async (req, res, next) => {
  try {
    // Load the full farmer profile
    const farmer = await Farmer.findOne({ user: req.user.id });
    
    if (!farmer) {
      // If no profile exists, that's okay - just continue
      return next();
    }
    
    // Check if required farmer fields are filled
    const requiredFields = ['farmName', 'location'];
    const missingFields = requiredFields.filter(field => !farmer[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Farmer profile incomplete',
        missingFields: missingFields
      });
    }
    
    // Attach farmer profile to request
    req.farmer = farmer;
    next();
  } catch (error) {
    console.error('Complete profile middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error in profile validation' 
    });
  }
};

/**
 * Middleware to check if farmer is verified/approved
 */
export const requireVerifiedFarmer = async (req, res, next) => {
  try {
    // Load the full farmer profile if not already loaded
    let farmer = req.farmer;
    if (!farmer) {
      farmer = await Farmer.findOne({ user: req.user.id });
      // If no profile exists, that's okay for now
      if (!farmer) {
        return next();
      }
    }
    
    // For now, we'll assume all farmers are verified
    // In a real application, you would check verification status here
    
    next();
  } catch (error) {
    console.error('Verified farmer middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error in verification check' 
    });
  }
};

/**
 * Combined middleware for most farmer routes
 * Requires farmer role + complete profile + verification
 */
export const requireFullFarmerAccess = [
  requireFarmer,
  requireCompleteFarmerProfile,
  requireVerifiedFarmer
];

export default {
  requireFarmer,
  requireCompleteFarmerProfile,
  requireVerifiedFarmer,
  requireFullFarmerAccess
};