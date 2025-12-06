// src/pages/CartPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ShoppingCart } from "lucide-react";

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    status: string;
    totalAmount: number;
  };
}

const CartPage = () => {
  const { items, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const mutation = useMutation({
    mutationFn: async (): Promise<OrderResponse> => {
      if (!phone.trim()) {
        throw new Error("Please enter your mobile number");
      }

      // Validate phone number format (10 digits)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error("Please enter a valid 10-digit Indian mobile number");
      }

      const orderItems = items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      // 🔍 optional debug
      console.log("ACCESS TOKEN AT CHECKOUT:", localStorage.getItem("accessToken"));

      return apiFetch<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: orderItems,
          phone,
        }),
      });
    },
    onSuccess: (res) => {
      toast.success(`Order placed successfully! Order ID: ${res.data._id}`);
      clearCart();
      navigate("/my-orders");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to place order. Please try again.");
    },
  });

  if (items.length === 0) {
    return (
      <div className="container px-4 py-10">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center py-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              Browse our fresh, organic produce and add something to your cart.
            </p>
            <Button asChild className="w-full">
              <Link to="/shop">Go to Shop</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Your Cart ({items.length} item{items.length !== 1 ? 's' : ''})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b pb-3"
              >
                <div className="flex items-center gap-4">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.price.toFixed(2)} / {item.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">Total</p>
              <p className="text-xl font-bold text-primary">
                ₹{total.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Mobile Number for order updates
              </label>
              <Input
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                We'll send order updates to this number via WhatsApp
              </p>
            </div>

            {mutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {mutation.error?.message || "Failed to place order. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={clearCart}>
                Clear Cart
              </Button>
              <Button
                className="flex-1"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Placing order..." : "Checkout"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CartPage;