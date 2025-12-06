import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
}

const MyOrders = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch<OrdersResponse>("/orders/my"),
  });

  const orders = data?.data ?? [];

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container px-4">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p>Loading your orders...</p>}
            {isError && (
              <p className="text-destructive">
                Failed to load orders. Are you logged in?
              </p>
            )}
            {!isLoading && !isError && orders.length === 0 && (
              <p className="text-muted-foreground">
                You haven&apos;t placed any orders yet.
              </p>
            )}

            {orders.map((order) => (
              <Card key={order._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-muted px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">Order #{order._id.slice(-6)}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          order.status === "delivered" 
                            ? "default" 
                            : order.status === "confirmed" 
                            ? "secondary" 
                            : "outline"
                        }
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <span className="font-semibold">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Items</h4>
                      <ul className="space-y-2">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span>
                              {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                            </span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-3 border-t flex justify-end">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyOrders;