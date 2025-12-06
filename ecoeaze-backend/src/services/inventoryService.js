// src/services/inventoryService.js
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";

/**
 * Ensure inventory doc exists for a product
 */
export const ensureInventoryForProduct = async (productId) => {
  let inv = await Inventory.findOne({ product: productId });

  if (!inv) {
    // initialize from product.stock if available
    const product = await Product.findById(productId);
    const quantityAvailable = product?.stock ?? 0;

    inv = await Inventory.create({
      product: productId,
      quantityAvailable,
      quantityReserved: 0,
    });
  }

  return inv;
};

/**
 * Get inventory record
 */
export const getInventoryService = async (productId) => {
  return ensureInventoryForProduct(productId);
};

/**
 * Set available quantity directly
 */
export const setInventoryQuantity = async (productId, quantity, userId, reason) => {
  const inv = await ensureInventoryForProduct(productId);

  inv.quantityAvailable = Math.max(0, Number(quantity) || 0);
  inv.lastUpdatedBy = userId || inv.lastUpdatedBy;
  inv.lastUpdateReason = reason || inv.lastUpdateReason;

  await inv.save();
  return inv;
};

/**
 * Adjust available quantity by delta (can be + or -)
 * Example: adjustInventory("p1", -2, userId, "order placed")
 */
export const adjustInventoryQuantity = async (productId, delta, userId, reason) => {
  const inv = await ensureInventoryForProduct(productId);

  const newQty = inv.quantityAvailable + Number(delta);
  if (newQty < 0) {
    throw new Error("Not enough stock");
  }

  inv.quantityAvailable = newQty;
  inv.lastUpdatedBy = userId || inv.lastUpdatedBy;
  inv.lastUpdateReason = reason || inv.lastUpdateReason;

  await inv.save();
  return inv;
};

/**
 * Reserve stock (for pending orders / checkout)
 */
export const reserveStock = async (productId, quantity, userId) => {
  const inv = await ensureInventoryForProduct(productId);

  if (inv.quantityAvailable < quantity) {
    throw new Error("Not enough stock to reserve");
  }

  inv.quantityAvailable -= quantity;
  inv.quantityReserved += quantity;
  inv.lastUpdatedBy = userId || inv.lastUpdatedBy;
  inv.lastUpdateReason = "stock reserved";

  await inv.save();
  return inv;
};

/**
 * Confirm reservation (e.g. after successful payment)
 */
export const confirmReservation = async (productId, quantity, userId) => {
  const inv = await ensureInventoryForProduct(productId);

  if (inv.quantityReserved < quantity) {
    throw new Error("Not enough reserved stock to confirm");
  }

  inv.quantityReserved -= quantity;
  inv.lastUpdatedBy = userId || inv.lastUpdatedBy;
  inv.lastUpdateReason = "reservation confirmed";

  await inv.save();
  return inv;
};

/**
 * Release reserved stock (e.g. payment failed / order cancelled)
 */
export const releaseReservation = async (productId, quantity, userId) => {
  const inv = await ensureInventoryForProduct(productId);

  if (inv.quantityReserved < quantity) {
    throw new Error("Not enough reserved stock to release");
  }

  inv.quantityReserved -= quantity;
  inv.quantityAvailable += quantity;
  inv.lastUpdatedBy = userId || inv.lastUpdatedBy;
  inv.lastUpdateReason = "reservation released";

  await inv.save();
  return inv;
};

export default {
  ensureInventoryForProduct,
  getInventoryService,
  setInventoryQuantity,
  adjustInventoryQuantity,
  reserveStock,
  confirmReservation,
  releaseReservation,
};
