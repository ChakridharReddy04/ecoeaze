// src/utils/validation.js
import Joi from "joi";

/**
 * Auth validation schemas
 */
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  // E.164-ish phone validation (allow optional leading +, 8-15 digits)
  phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid("customer", "farmer", "admin").optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/**
 * Product schema
 */
export const productCreateSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  description: Joi.string().max(2000).allow("", null),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  category: Joi.string().max(80).allow("", null),
  certification: Joi.string().max(120).allow("", null),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(200).allow("", null),
      })
    )
    .optional(),
});

export const productUpdateSchema = productCreateSchema.fork(
  ["name", "price", "stock"],
  (schema) => schema.optional()
);

/**
 * Order schema
 */
export const orderCreateSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).default(1),
      })
    )
    .min(1)
    .required(),
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow("", null),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().default("India"),
  }).required(),
  paymentMethod: Joi.string()
    .valid("cod", "razorpay", "stripe", "other")
    .default("cod"),
});

/**
 * Review schema
 */
export const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow("", null),
});

/**
 * Farmer profile schema
 */
export const farmerProfileSchema = Joi.object({
  farmName: Joi.string().max(120).allow("", null),
  location: Joi.string().max(200).allow("", null),
  bio: Joi.string().max(2000).allow("", null),
  certifications: Joi.array().items(
    Joi.object({
      name: Joi.string().max(120).required(),
      issuer: Joi.string().max(120).allow("", null),
      validFrom: Joi.date().optional(),
      validTo: Joi.date().optional(),
      certificateId: Joi.string().max(120).allow("", null),
    })
  ),
});

/**
 * Helper to create a validation middleware quickly
 * (If you don't want to use validateRequest.js you can use this.)
 */
export const createValidator =
  (schema, property = "body") =>
  (req, res, next) => {
    const data = req[property];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: details,
      });
    }

    req[property] = value;
    next();
  };

export default {
  registerSchema,
  loginSchema,
  productCreateSchema,
  productUpdateSchema,
  orderCreateSchema,
  reviewSchema,
  farmerProfileSchema,
  createValidator,
};
