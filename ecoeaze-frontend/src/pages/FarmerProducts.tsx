// src/pages/FarmerPortal.tsx
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
} from "lucide-react";
import { toast } from "sonner";

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

const FarmerPortal = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch products for logged-in farmer
  const {
    data: productsRes,
    isLoading: loadingProducts,
    isError: errorProducts,
  } = useQuery({
    queryKey: ["farmer-products"],
    queryFn: () =>
      apiFetch<ListResponse<FarmerProduct>>("/farmers/products"),
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
                  onClick={() => navigate("/farmer/products/manage")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Manage Products & Orders
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View All Orders
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Detailed Analytics
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
```
```
// src/pages/FarmerProducts.tsx
import { useState } from "react";
import {
  useQuery,
  useQueryClient,
  useMutation,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Package,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

interface FarmerProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  certification?: string;
  imageUrl?: string;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

const FarmerProducts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch products for logged-in farmer
  const {
    data: productsRes,
    isLoading: loadingProducts,
    isError: errorProducts,
  } = useQuery({
    queryKey: ["farmer-products"],
    queryFn: () =>
      apiFetch<ListResponse<FarmerProduct>>("/farmers/products"),
  });

  const products = productsRes?.data ?? [];

  // Mutation to delete a product
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) =>
      apiFetch(`/farmers/products/${productId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["farmer-products"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete product");
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const loading = loadingProducts;
  const hasError = errorProducts;

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              Farmer Dashboard
            </Badge>
            <h1 className="text-3xl font-bold">My Products</h1>
            <p className="max-w-xl text-muted-foreground">
              Manage your product listings and inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
              onClick={() => navigate("/farmer-portal")}
            >
              <Package className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <p className="mb-4 text-sm text-muted-foreground">
            Loading your products...
          </p>
        )}
        {hasError && (
          <p className="mb-4 text-sm text-destructive">
            Failed to load products. Make sure you are logged in as a farmer and the backend is running.
          </p>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>
                  View and manage your product listings
                </CardDescription>
              </div>
              <Badge variant="outline">
                {products.length} products
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-medium">No products yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first product to start selling.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate("/farmer/products/new")}
                >
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.category || "Uncategorized"}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={product.stock <= 10 ? "destructive" : "secondary"}>
                              {product.stock} units
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/farmer/products/edit/${product._id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product._id)}
                                disabled={deleteProductMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmerProducts;
