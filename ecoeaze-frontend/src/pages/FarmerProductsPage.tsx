// src/pages/FarmerProductsPage.tsx
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

const FarmerProductsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const errorMessage = productsError as any;

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
            Failed to load products: {errorMessage?.message || "Make sure you are logged in as a farmer and the backend is running."}
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

export default FarmerProductsPage;