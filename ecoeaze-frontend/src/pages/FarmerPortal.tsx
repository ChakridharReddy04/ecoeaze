// src/pages/FarmerPortal.tsx
import { useEffect, useState } from "react";
import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  Plus,
  BarChart3,
  Users,
  AlertCircle,
  PieChart,
  LineChart,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

// Recharts for data visualization
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";

interface FarmerProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  certification?: string;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  productFarmer?: string;
}

interface FarmerOrder {
  _id: string;
  items: OrderItem[];
  status: string;
  totalAmount?: number;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

// Analytics interfaces
interface ProfitLossData {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

interface SalesTrendData {
  date: string;
  sales: number;
  orders: number;
}

interface TopProductData {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

interface InventoryStatus {
  summary: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalProducts: number;
  };
  details: {
    inStock: Array<{ id: string; name: string; stock: number; price: number }>;
    lowStock: Array<{ id: string; name: string; stock: number; price: number }>;
    outOfStock: Array<{ id: string; name: string; stock: number; price: number }>;
  };
}

interface CustomerInsight {
  totalCustomers: number;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
  }>;
  popularProducts: Array<{
    name: string;
    totalQuantity: number;
  }>;
}

const FarmerPortal = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Check farmer profile
  const { data: profileData } = useQuery({
    queryKey: ["farmer-profile-check"],
    queryFn: async () => {
      try {
        const response = await apiFetch<any>("/farmers/profile");
        return response.data;
      } catch (error) {
        return null;
      }
    },
  });

  // Redirect to profile setup if profile is missing
  useEffect(() => {
    if (profileData === null) {
      navigate("/farmer/profile");
    }
  }, [profileData, navigate]);

  // Fetch products for logged-in farmer
  const {
    data: productsRes,
    isLoading: loadingProducts,
    isError: errorProducts,
  } = useQuery({
    queryKey: ["farmer-products"],
    queryFn: () =>
      apiFetch<ListResponse<FarmerProduct>>("/farmers/products"),
    enabled: !!profileData, // Only fetch products if profile exists
  });

  // Fetch orders that include this farmer's products
  const {
    data: ordersRes,
    isLoading: loadingOrders,
    isError: errorOrders,
  } = useQuery({
    queryKey: ["farmer-orders"],
    queryFn: () => apiFetch<ListResponse<FarmerOrder>>("/farmers/orders"),
    // You can uncomment this if you want auto-refresh "notifications":
    // refetchInterval: 10000,
    enabled: !!profileData, // Only fetch orders if profile exists
  });

  // Fetch farmer analytics data
  const { data: profitLossData } = useQuery({
    queryKey: ["farmer-profit-loss"],
    queryFn: () => apiFetch<{ data: ProfitLossData[] }>("/farmers/analytics/profit-loss"),
    enabled: !!profileData && showAnalytics,
  });

  const { data: salesTrendsData } = useQuery({
    queryKey: ["farmer-sales-trends"],
    queryFn: () => apiFetch<{ data: SalesTrendData[] }>("/farmers/analytics/sales-trends"),
    enabled: !!profileData && showAnalytics,
  });

  const { data: topProductsData } = useQuery({
    queryKey: ["farmer-top-products"],
    queryFn: () => apiFetch<{ data: TopProductData[] }>("/farmers/analytics/top-products"),
    enabled: !!profileData && showAnalytics,
  });

  const { data: inventoryStatusData } = useQuery({
    queryKey: ["farmer-inventory-status"],
    queryFn: () => apiFetch<{ data: InventoryStatus }>("/farmers/analytics/inventory-status"),
    enabled: !!profileData && showAnalytics,
  });

  const { data: customerInsightsData } = useQuery({
    queryKey: ["farmer-customer-insights"],
    queryFn: () => apiFetch<{ data: CustomerInsight }>("/farmers/analytics/customer-insights"),
    enabled: !!profileData && showAnalytics,
  });

  const products = productsRes?.data ?? [];
  const orders = ordersRes?.data ?? [];

  // ---- Mutation to confirm order ----
  const confirmMutation = useMutation({
    mutationFn: async (orderId: string) =>
      apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "confirmed" }),
      }),
    onSuccess: () => {
      toast.success("Order confirmed");
      queryClient.invalidateQueries({ queryKey: ["farmer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update order");
    },
  });

  // ---- Derived analytics ----
  const {
    totalRevenue,
    totalOrders,
    totalItemsSold,
    lowStockProducts,
    recentOrders,
    topProducts,
  } = useMemo(() => {
    let revenue = 0;
    let ordersCount = orders.length;
    let itemsSold = 0;

    const productSalesMap = new Map<string, { name: string; qty: number }>();

    for (const order of orders) {
      if (order.totalAmount != null) {
        revenue += order.totalAmount;
      } else {
        // fallback: calculate from items
        for (const item of order.items) {
          revenue += item.price * item.quantity;
        }
      }

      for (const item of order.items) {
        itemsSold += item.quantity;

        const entry = productSalesMap.get(item.name) || {
          name: item.name,
          qty: 0,
        };
        entry.qty += item.quantity;
        productSalesMap.set(item.name, entry);
      }
    }

    // top products by quantity sold
    const top = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // low stock: stock < 10
    const lowStock = products
      .filter((p) => p.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    // recent orders: latest 5
    const recent = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    return {
      totalRevenue: revenue,
      totalOrders: ordersCount,
      totalItemsSold: itemsSold,
      lowStockProducts: lowStock,
      recentOrders: recent,
      topProducts: top,
    };
  }, [products, orders]);

  const loading = loadingProducts || loadingOrders;
  const hasError = errorProducts || errorOrders;

  // Helper functions for chart data
  const getProfitLossChartData = () => {
    if (!profitLossData?.data) return [];
    return profitLossData.data.map(item => ({
      name: item.month,
      Revenue: item.revenue,
      Cost: item.cost,
      Profit: item.profit
    }));
  };

  const getSalesTrendsChartData = () => {
    if (!salesTrendsData?.data) return [];
    return salesTrendsData.data.map(item => ({
      name: item.date,
      Sales: item.sales,
      Orders: item.orders
    }));
  };

  const getTopProductsChartData = () => {
    if (!topProductsData?.data) return [];
    return topProductsData.data.map(item => ({
      name: item.productName,
      Quantity: item.quantity,
      Revenue: item.revenue
    }));
  };

  const getInventoryStatusData = () => {
    if (!inventoryStatusData?.data) return [];
    const summary = inventoryStatusData.data.summary;
    return [
      { name: 'In Stock', value: summary.inStock },
      { name: 'Low Stock', value: summary.lowStock },
      { name: 'Out of Stock', value: summary.outOfStock }
    ];
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // If profile doesn't exist yet, don't render the dashboard
  if (profileData === null) {
    return null;
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toFixed(2)}`,
      change: "+12.4%",
      icon: DollarSign,
    },
    {
      title: "Orders",
      value: totalOrders.toString(),
      change: "+5.1%",
      icon: ShoppingBag,
    },
    {
      title: "Products Listed",
      value: products.length.toString(),
      change: "+2 new",
      icon: Package,
    },
    {
      title: "Items Sold",
      value: totalItemsSold.toString(),
      change: "+8.7%",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              Farmer Dashboard
            </Badge>
            <h1 className="text-3xl font-bold">Farmer Portal</h1>
            <p className="max-w-xl text-muted-foreground">
              Track your sales, manage inventory, and monitor performance of
              your farm&apos;s products in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Customer Feedback
            </Button>
            <Button
              className="gap-2"
              onClick={() => navigate("/farmer/products/new")}
            >
              <Plus className="h-4 w-4" />
              Add New Product
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/farmer/products/manage")}
            >
              <Package className="h-4 w-4" />
              Manage Products & Orders
            </Button>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <p className="mb-4 text-sm text-muted-foreground">
            Loading your products & sales...
          </p>
        )}
        {hasError && (
          <p className="mb-4 text-sm text-destructive">
            Failed to load farmer data. Make sure you are logged in as a
            farmer and the backend is running.
          </p>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="mt-1 flex items-center text-xs text-primary">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stat.change} vs last period
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="mb-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Farm Analytics Dashboard</h2>
              <Badge variant="outline">Real-time Data</Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Profit/Loss Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Profit & Loss Overview
                  </CardTitle>
                  <CardDescription>
                    Monthly revenue, costs, and profit trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getProfitLossChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₹${value}`, '']} />
                        <Legend />
                        <Bar dataKey="Revenue" fill="#0088FE" />
                        <Bar dataKey="Cost" fill="#FF8042" />
                        <Bar dataKey="Profit" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Sales Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-500" />
                    Sales Trends
                  </CardTitle>
                  <CardDescription>
                    Daily sales volume and order count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={getSalesTrendsChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="Orders" stroke="#82ca9d" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Top Products Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Top Selling Products
                  </CardTitle>
                  <CardDescription>
                    Your best performing products by quantity sold
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getTopProductsChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => 
                          name === 'Quantity' ? [value, 'Units'] : [`₹${value}`, 'Revenue']
                        } />
                        <Legend />
                        <Bar dataKey="Quantity" fill="#8884d8" />
                        <Bar dataKey="Revenue" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Inventory Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    Inventory Status
                  </CardTitle>
                  <CardDescription>
                    Current stock level distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={getInventoryStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getInventoryStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} products`, '']} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>
                    Latest orders containing your products
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {totalOrders} total orders
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders yet. Once customers start buying your products,
                  you&apos;ll see them here.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Order #{order._id.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} items •{" "}
                          {order.user?.name || "Customer"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "pending"
                              ? "outline"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                        <p className="text-sm font-semibold text-primary">
                          ₹
                          {(
                            order.totalAmount ??
                            order.items.reduce(
                              (sum, item) =>
                                sum + item.price * item.quantity,
                              0
                            )
                          ).toFixed(2)}
                        </p>
                        {/* Confirm button */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            confirmMutation.isPending ||
                            order.status !== "pending"
                          }
                          onClick={() => confirmMutation.mutate(order._id)}
                        >
                          {order.status === "pending"
                            ? "Confirm"
                            : "Confirm"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Low Stock Alert */}
            <Card className="border-warning/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <CardTitle className="text-base">
                    Low Stock Alert
                  </CardTitle>
                </div>
                <CardDescription>Products running low</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All products have healthy inventory.
                  </p>
                ) : (
                  lowStockProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-foreground">
                        {product.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {product.stock} units
                      </Badge>
                    </div>
                  ))
                )}
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  Update Inventory
                </Button>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">
                    Top Products
                  </CardTitle>
                </div>
                <CardDescription>Your best sellers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sales data will appear once orders start coming in.
                  </p>
                ) : (
                  topProducts.map((prod, index) => (
                    <div
                      key={prod.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm">{prod.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {prod.qty} sold
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>
                  Manage your farm faster
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/farmer/products/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/farmer-products")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  View My Products
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/farmer/products/manage")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Manage Products & Orders
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View All Orders
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {showAnalytics ? 'Hide Analytics' : 'Show Detailed Analytics'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerPortal;