// src/pages/AdminPortal.tsx
import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
// Import recharts components
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
}

interface UserDetails extends User {
  orders?: Array<{
    _id: string;
    orderId: string;
    items: any[];
    totalPrice: number;
    status: string;
    createdAt: string;
  }>;
  products?: Array<{
    _id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalOrders?: number;
  totalProducts?: number;
}
  _id: string;
  name: string;
  price: number;
  stock: number;
  farmer: {
    name: string;
    farmName: string;
  };
}

interface Order {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalFarmers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

// Define color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminPortal = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await apiFetch<{ data: User[] }>("/admin/users");
      return response.data;
    },
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const response = await apiFetch<{ data: Product[] }>("/admin/products");
      return response.data;
    },
  });

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const response = await apiFetch<{ data: Order[] }>("/admin/orders");
      return response.data;
    },
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await apiFetch<{ data: Stats }>("/admin/stats");
      return response.data;
    },
  });

  // Fetch user role distribution
  const { data: userRoleDistribution } = useQuery({
    queryKey: ["admin-user-role-distribution"],
    queryFn: async () => {
      const response = await apiFetch<{ data: Array<{ role: string; count: number }> }>("/admin/analytics/user-role-distribution");
      return response.data;
    },
  });

  // Fetch order status distribution
  const { data: orderStatusDistribution } = useQuery({
    queryKey: ["admin-order-status-distribution"],
    queryFn: async () => {
      const response = await apiFetch<{ data: Array<{ status: string; count: number }> }>("/admin/analytics/order-status-distribution");
      return response.data;
    },
  });

  // Fetch revenue over time
  const { data: revenueOverTime } = useQuery({
    queryKey: ["admin-revenue-over-time"],
    queryFn: async () => {
      const response = await apiFetch<{ data: Array<{ _id: string; revenue: number; orderCount: number }> }>("/admin/analytics/revenue-over-time");
      return response.data;
    },
  });

  // Fetch top selling products
  const { data: topSellingProducts } = useQuery({
    queryKey: ["admin-top-selling-products"],
    queryFn: async () => {
      const response = await apiFetch<{ data: Array<{ productName: string; totalQuantity: number; totalRevenue: number }> }>("/admin/analytics/top-selling-products");
      return response.data;
    },
  });

  // Fetch farmer performance
  const { data: farmerPerformance } = useQuery({
    queryKey: ["admin-farmer-performance"],
    queryFn: async () => {
      const response = await apiFetch<{ data: Array<{ farmerName: string; farmerOwner: string; totalOrders: number; totalQuantity: number; totalRevenue: number }> }>("/admin/analytics/farmer-performance");
      return response.data;
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiFetch(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      toast.success("User role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update user role");
    },
  });

  const handleUpdateRole = (userId: string, role: string) => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  // Fetch user details
  const handleViewDetails = async (userId: string, role: string) => {
    try {
      const endpoint = role === "farmer" ? `/admin/farmers/${userId}` : `/admin/customers/${userId}`;
      const response = await apiFetch<{ data: UserDetails }>(endpoint);
      setSelectedUser(response.data);
      setShowDetails(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load user details");
    }
  };

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch(`/admin/users/${userId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete user");
    },
  });

  const handleDeleteUser = (userId: string, userRole: string) => {
    const currentUser = localStorage.getItem("user");
    const currentUserId = currentUser ? JSON.parse(currentUser).id : null;

    if (userRole === "admin") {
      toast.error("Cannot delete an admin user via this interface");
      return;
    }

    if (userId === currentUserId) {
      toast.error("You cannot delete your own account from the admin panel");
      return;
    }

    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Prepare data for charts
  // User role distribution pie chart
  const getUserRoleDistribution = () => {
    if (!userRoleDistribution) return [];
    
    return userRoleDistribution.map(item => ({
      name: item.role.charAt(0).toUpperCase() + item.role.slice(1),
      value: item.count
    }));
  };

  // Orders by status bar chart
  const getOrdersByStatus = () => {
    if (!orderStatusDistribution) return [];
    
    return orderStatusDistribution.map(item => ({
      name: item.status,
      count: item.count
    }));
  };

  // Revenue over time line chart
  const getRevenueOverTime = () => {
    if (!revenueOverTime) return [];
    
    return revenueOverTime.map(item => ({
      date: item._id,
      revenue: item.revenue,
      orders: item.orderCount
    }));
  };

  // Top selling products bar chart
  const getTopSellingProducts = () => {
    if (!topSellingProducts) return [];
    
    return topSellingProducts.map(item => ({
      name: item.productName,
      quantity: item.totalQuantity,
      revenue: item.totalRevenue
    }));
  };

  // Farmer performance bar chart
  const getFarmerPerformance = () => {
    if (!farmerPerformance) return [];
    
    return farmerPerformance.map(item => ({
      name: item.farmerName,
      owner: item.farmerOwner,
      revenue: item.totalRevenue,
      orders: item.totalOrders,
      quantity: item.totalQuantity
    }));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, products, and orders</p>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Farmers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFarmers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getUserRoleDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getUserRoleDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Users']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getOrdersByStatus()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Number of Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={getRevenueOverTime()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => 
                  name === 'revenue' ? [formatCurrency(Number(value)), 'Revenue'] : [value, 'Orders']
                } />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Revenue" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#82ca9d" 
                  name="Orders" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getTopSellingProducts()}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 100,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" scale="band" />
                <Tooltip formatter={(value, name) => 
                  name === 'quantity' ? [value, 'Quantity'] : [formatCurrency(Number(value)), 'Revenue']
                } />
                <Legend />
                <Bar dataKey="quantity" fill="#8884d8" name="Quantity Sold" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Farmer Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Farmer Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getFarmerPerformance()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue') return [formatCurrency(Number(value)), 'Revenue'];
                    if (name === 'quantity') return [value, 'Quantity'];
                    return [value, 'Orders'];
                  }}
                  labelFormatter={(value, payload) => {
                    const farmer = payload[0]?.payload;
                    return `${farmer?.name} (${farmer?.owner})`;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div>Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Name</th>
                        <th className="text-left py-3">Email</th>
                        <th className="text-left py-3">Role</th>
                        <th className="text-left py-3">Joined</th>
                        <th className="text-left py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map((user) => (
                        <tr key={user._id} className="border-b">
                          <td className="py-3">{user.name}</td>
                          <td className="py-3">{user.email}</td>
                          <td className="py-3">
                            <Badge 
                              variant={
                                user.role === "admin" ? "default" : 
                                user.role === "farmer" ? "secondary" : "outline"
                              }
                            >
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3">{formatDate(user.createdAt)}</td>
                          <td className="py-3">
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleUpdateRole(user._id, value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="farmer">Farmer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(user._id, user.role)}
                            >
                              View Details
                            </Button>
                            {user.role !== "admin" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user._id, user.role)}
                                disabled={deleteUserMutation.isLoading}
                              >
                                Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div>Loading products...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Product</th>
                        <th className="text-left py-3">Farmer</th>
                        <th className="text-left py-3">Price</th>
                        <th className="text-left py-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products?.map((product) => (
                        <tr key={product._id} className="border-b">
                          <td className="py-3">{product.name}</td>
                          <td className="py-3">
                            {product.farmer?.name} 
                            {product.farmer?.farmName && ` (${product.farmer.farmName})`}
                          </td>
                          <td className="py-3">{formatCurrency(product.price)}</td>
                          <td className="py-3">{product.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div>Loading orders...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Order ID</th>
                        <th className="text-left py-3">Customer</th>
                        <th className="text-left py-3">Items</th>
                        <th className="text-left py-3">Total</th>
                        <th className="text-left py-3">Status</th>
                        <th className="text-left py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map((order) => (
                        <tr key={order._id} className="border-b">
                          <td className="py-3 font-mono text-sm">{order._id.substring(0, 8)}</td>
                          <td className="py-3">
                            {order.user?.name}
                            <div className="text-sm text-muted-foreground">{order.user?.email}</div>
                          </td>
                          <td className="py-3">
                            {order.items.length} item(s)
                          </td>
                          <td className="py-3">{formatCurrency(order.totalAmount)}</td>
                          <td className="py-3">
                            <Badge variant="outline">{order.status}</Badge>
                          </td>
                          <td className="py-3">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedUser.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedUser.role.toUpperCase()}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Login Credentials */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Login Credentials</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-mono text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-mono text-sm">{selectedUser.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-mono text-sm">{selectedUser.address || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs">{selectedUser._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge className="mt-1">{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Orders (for customers) */}
              {selectedUser.role === "customer" && selectedUser.orders && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Orders ({selectedUser.totalOrders || 0})</h3>
                  {selectedUser.orders.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedUser.orders.map((order) => (
                        <div key={order._id} className="bg-gray-50 p-2 rounded text-sm">
                          <p><span className="font-mono">{order.orderId}</span> - {new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">Amount: ₹{order.totalPrice} | Status: <Badge variant="outline" className="ml-1">{order.status}</Badge></p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                  )}
                </div>
              )}

              {/* Products (for farmers) */}
              {selectedUser.role === "farmer" && selectedUser.products && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Products ({selectedUser.totalProducts || 0})</h3>
                  {selectedUser.products.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedUser.products.map((product) => (
                        <div key={product._id} className="bg-gray-50 p-2 rounded text-sm">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-muted-foreground">₹{product.price} | Stock: {product.quantity}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No products yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;