// src/pages/FarmerProductManagement.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Package,
  ShoppingCart,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
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

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
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

const FarmerProductManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Fetch products for logged-in farmer
  const {
    data: productsRes,
    isLoading: loadingProducts,
    isError: errorProducts,
    error: productsError,
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
    error: ordersError,
  } = useQuery({
    queryKey: ["farmer-orders"],
    queryFn: () => apiFetch<ListResponse<FarmerOrder>>("/farmers/orders"),
  });

  const products = productsRes?.data ?? [];
  const orders = ordersRes?.data ?? [];

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

  // Mutation to update order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) =>
      apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["farmer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      setSelectedOrderId(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update order status");
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const handleOpenStatusDialog = (orderId: string, currentStatus: string) => {
    setSelectedOrderId(orderId);
    setNewStatus(currentStatus);
  };

  const loading = loadingProducts || loadingOrders;
  const hasError = errorProducts || errorOrders;
  const errorMessage = errorProducts ? (productsError as any)?.message : (ordersError as any)?.message;

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              Farmer Dashboard
            </Badge>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="max-w-xl text-muted-foreground">
              Manage your products and view orders for your products.
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
              <Eye className="h-4 w-4" />
              View Dashboard
            </Button>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <p className="mb-4 text-sm text-muted-foreground">
            Loading your products & orders...
          </p>
        )}
        {hasError && (
          <p className="mb-4 text-sm text-destructive">
            Failed to load data: {errorMessage || "Make sure you are logged in as a farmer and the backend is running."}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Products Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Products</CardTitle>
                  <CardDescription>
                    Manage your product listings
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
                              <div className="text-sm text-muted-foreground">
                                {product.category}
                              </div>
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

          {/* Orders Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Orders</CardTitle>
                  <CardDescription>
                    View and manage orders for your products
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {orders.length} orders
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-medium">No orders yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Orders for your products will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order._id}>
                            <TableCell>
                              <div className="font-medium">#{order._id.slice(-6)}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{order.items.length} items</div>
                              <div className="text-sm text-muted-foreground">
                                {order.user?.name || "Customer"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  order.status === "delivered"
                                    ? "default"
                                    : order.status === "confirmed"
                                    ? "secondary"
                                    : order.status === "cancelled"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ₹{(order.totalAmount || order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {order.status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateOrderStatus(order._id, "confirmed")}
                                      disabled={updateOrderStatusMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateOrderStatus(order._id, "cancelled")}
                                      disabled={updateOrderStatusMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Dialog 
                                  open={selectedOrderId === order._id} 
                                  onOpenChange={(open) => !open && setSelectedOrderId(null)}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenStatusDialog(order._id, order.status)}
                                    >
                                      Change Status
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Update Order Status</DialogTitle>
                                      <DialogDescription>
                                        Change the status of order #{order._id.slice(-6)}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-sm font-medium">Status</label>
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="confirmed">Confirmed</SelectItem>
                                            <SelectItem value="shipped">Shipped</SelectItem>
                                            <SelectItem value="delivered">Delivered</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => setSelectedOrderId(null)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => handleUpdateOrderStatus(order._id, newStatus)}
                                          disabled={updateOrderStatusMutation.isPending}
                                        >
                                          {updateOrderStatusMutation.isPending ? "Updating..." : "Update Status"}
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
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
    </div>
  );
};

export default FarmerProductManagement;