// src/controllers/farmerAnalyticsController.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getCachedAnalyticsData, cacheAnalyticsData, getUserBehaviors } from "../services/redisService.js";

/**
 * GET /api/farmers/analytics/profit-loss
 * Get profit/loss data for the logged-in farmer
 */
export const getFarmerProfitLoss = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    
    // Check cache first
    const cacheKey = `farmer_profit_loss:${farmerId}`;
    const cachedData = await getCachedAnalyticsData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }
    
    // Find orders that contain products from this farmer
    const orders = await Order.find({
      "items.farmer": farmerId,
      status: { $in: ["paid", "delivered"] }
    }).sort({ createdAt: -1 });
    
    // Calculate profit/loss over time (monthly)
    const profitLossData = {};
    
    for (const order of orders) {
      const monthYear = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
      
      if (!profitLossData[monthYear]) {
        profitLossData[monthYear] = {
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }
      
      // Calculate revenue from this farmer's products in this order
      for (const item of order.items) {
        if (item.farmer && item.farmer.toString() === farmerId) {
          const itemRevenue = item.price * item.quantity;
          // Assume 30% cost of goods sold
          const itemCost = itemRevenue * 0.3;
          const itemProfit = itemRevenue - itemCost;
          
          profitLossData[monthYear].revenue += itemRevenue;
          profitLossData[monthYear].cost += itemCost;
          profitLossData[monthYear].profit += itemProfit;
        }
      }
    }
    
    // Convert to array format for charting
    const chartData = Object.entries(profitLossData)
      .map(([month, data]) => ({
        month,
        revenue: parseFloat(data.revenue.toFixed(2)),
        cost: parseFloat(data.cost.toFixed(2)),
        profit: parseFloat(data.profit.toFixed(2))
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Cache for 1 hour
    await cacheAnalyticsData(cacheKey, chartData, 3600);
    
    return res.json({
      success: true,
      data: chartData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/farmers/analytics/sales-trends
 * Get sales trends for the logged-in farmer
 */
export const getFarmerSalesTrends = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    
    // Check cache first
    const cacheKey = `farmer_sales_trends:${farmerId}`;
    const cachedData = await getCachedAnalyticsData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }
    
    // Find orders that contain products from this farmer
    const orders = await Order.find({
      "items.farmer": farmerId,
      status: { $in: ["paid", "delivered"] }
    }).sort({ createdAt: 1 }); // Ascending for timeline
    
    // Group by date
    const salesByDate = {};
    
    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          sales: 0,
          orders: 0
        };
      }
      
      // Count this farmer's products in this order
      let farmerProductCount = 0;
      for (const item of order.items) {
        if (item.farmer && item.farmer.toString() === farmerId) {
          farmerProductCount += item.quantity;
        }
      }
      
      salesByDate[date].sales += farmerProductCount;
      salesByDate[date].orders += 1;
    }
    
    // Convert to array and sort by date
    const chartData = Object.values(salesByDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Cache for 30 minutes
    await cacheAnalyticsData(cacheKey, chartData, 1800);
    
    return res.json({
      success: true,
      data: chartData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/farmers/analytics/top-products
 * Get top selling products for the logged-in farmer
 */
export const getFarmerTopProducts = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const { limit = 10 } = req.query;
    
    // Check cache first
    const cacheKey = `farmer_top_products:${farmerId}:${limit}`;
    const cachedData = await getCachedAnalyticsData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }
    
    // Find orders that contain products from this farmer
    const orders = await Order.find({
      "items.farmer": farmerId,
      status: { $in: ["paid", "delivered"] }
    });
    
    // Aggregate product sales
    const productSales = {};
    
    for (const order of orders) {
      for (const item of order.items) {
        if (item.farmer && item.farmer.toString() === farmerId) {
          const productId = item.productId.toString();
          
          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              productName: item.name,
              quantity: 0,
              revenue: 0
            };
          }
          
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += item.price * item.quantity;
        }
      }
    }
    
    // Convert to array and sort by quantity
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, parseInt(limit));
    
    // Cache for 1 hour
    await cacheAnalyticsData(cacheKey, topProducts, 3600);
    
    return res.json({
      success: true,
      data: topProducts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/farmers/analytics/inventory-status
 * Get inventory status for the logged-in farmer
 */
export const getFarmerInventoryStatus = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    
    // Check cache first
    const cacheKey = `farmer_inventory_status:${farmerId}`;
    const cachedData = await getCachedAnalyticsData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }
    
    // Find all products for this farmer
    const products = await Product.find({ farmer: farmerId });
    
    // Categorize by stock level
    const inventoryStatus = {
      inStock: products.filter(p => p.stock > 10).length,
      lowStock: products.filter(p => p.stock <= 10 && p.stock > 0).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      totalProducts: products.length
    };
    
    // Get actual products for each category
    const detailedInventory = {
      inStock: products.filter(p => p.stock > 10).map(p => ({
        id: p._id,
        name: p.name,
        stock: p.stock,
        price: p.price
      })),
      lowStock: products.filter(p => p.stock <= 10 && p.stock > 0).map(p => ({
        id: p._id,
        name: p.name,
        stock: p.stock,
        price: p.price
      })),
      outOfStock: products.filter(p => p.stock === 0).map(p => ({
        id: p._id,
        name: p.name,
        stock: p.stock,
        price: p.price
      }))
    };
    
    const result = {
      summary: inventoryStatus,
      details: detailedInventory
    };
    
    // Cache for 15 minutes
    await cacheAnalyticsData(cacheKey, result, 900);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/farmers/analytics/customer-insights
 * Get customer insights for the logged-in farmer
 */
export const getFarmerCustomerInsights = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    
    // Check cache first
    const cacheKey = `farmer_customer_insights:${farmerId}`;
    const cachedData = await getCachedAnalyticsData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }
    
    // Find orders that contain products from this farmer
    const orders = await Order.find({
      "items.farmer": farmerId,
      status: { $in: ["paid", "delivered"] }
    }).populate("user", "name email");
    
    // Analyze customer data
    const customers = {};
    
    for (const order of orders) {
      const userId = order.user._id.toString();
      
      if (!customers[userId]) {
        customers[userId] = {
          id: userId,
          name: order.user.name,
          email: order.user.email,
          totalOrders: 0,
          totalSpent: 0,
          favoriteProducts: {}
        };
      }
      
      customers[userId].totalOrders += 1;
      
      // Calculate spending on this farmer's products
      for (const item of order.items) {
        if (item.farmer && item.farmer.toString() === farmerId) {
          const itemTotal = item.price * item.quantity;
          customers[userId].totalSpent += itemTotal;
          
          // Track favorite products
          const productId = item.productId.toString();
          if (!customers[userId].favoriteProducts[productId]) {
            customers[userId].favoriteProducts[productId] = {
              name: item.name,
              quantity: 0
            };
          }
          customers[userId].favoriteProducts[productId].quantity += item.quantity;
        }
      }
    }
    
    // Convert to array and find top customers
    const customerList = Object.values(customers);
    const topCustomers = customerList
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    // Find most popular products
    const productPopularity = {};
    for (const customer of customerList) {
      for (const [productId, productData] of Object.entries(customer.favoriteProducts)) {
        if (!productPopularity[productId]) {
          productPopularity[productId] = {
            name: productData.name,
            totalQuantity: 0
          };
        }
        productPopularity[productId].totalQuantity += productData.quantity;
      }
    }
    
    const popularProducts = Object.values(productPopularity)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
    
    const result = {
      totalCustomers: customerList.length,
      topCustomers,
      popularProducts
    };
    
    // Cache for 1 hour
    await cacheAnalyticsData(cacheKey, result, 3600);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getFarmerProfitLoss,
  getFarmerSalesTrends,
  getFarmerTopProducts,
  getFarmerInventoryStatus,
  getFarmerCustomerInsights
};