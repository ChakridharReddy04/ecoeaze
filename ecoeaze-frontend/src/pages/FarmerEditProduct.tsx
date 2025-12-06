// src/pages/FarmerEditProduct.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  isOrganic: boolean;
  certification: string;
  isSeasonal: boolean;
  farmLocation: string;
  harvestDate?: string;
}

const FarmerEditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState<number | "">("");
  const [harvestDate, setHarvestDate] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [isOrganic, setIsOrganic] = useState(true);
  const [certification, setCertification] = useState("");
  const [isSeasonal, setIsSeasonal] = useState(false);

  // Fetch product details
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await apiFetch<{ success: boolean; data: Product }>(
        `/products/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });

  // Set form values when product data is loaded
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setCategory(product.category);
      setPrice(product.price);
      setUnit(product.unit);
      setStock(product.stock);
      setHarvestDate(product.harvestDate || "");
      setFarmLocation(product.farmLocation);
      setIsOrganic(product.isOrganic);
      setCertification(product.certification);
      setIsSeasonal(product.isSeasonal);
    }
  }, [product]);

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/farmers/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          description,
          category,
          price: typeof price === "string" ? Number(price) : price,
          unit,
          stock: typeof stock === "string" ? Number(stock) : stock,
          harvestDate: harvestDate || undefined,
          farmLocation,
          isOrganic,
          certification,
          isSeasonal,
        }),
      });
      return response;
    },
    onSuccess: () => {
      toast.success("Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["farmer-products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      navigate("/farmer-products");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update product");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === "" || stock === "") {
      toast.error("Please fill in all required fields");
      return;
    }
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 py-10">
        <div className="container px-4">
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-muted/30 py-10">
        <div className="container px-4">
          <p className="text-destructive">Failed to load product details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
            <CardDescription>
              Update your product details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Name & Category */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input
                    placeholder="Organic Alphonso Mangoes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    placeholder="Fruits / Vegetables / Grains..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe the taste, variety, and how it is grown..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Price, Unit, Stock */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Price (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Unit</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="dozen">dozen</option>
                    <option value="bunch">bunch</option>
                    <option value="piece">piece</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Stock</label>
                  <Input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) =>
                      setStock(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    required
                  />
                </div>
              </div>

              {/* Harvest Date & Farm Location */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Harvest Date (optional)
                  </label>
                  <Input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Farm Location</label>
                  <Input
                    placeholder="Village, District, State"
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Organic & Seasonal */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="organic"
                      checked={isOrganic}
                      onChange={(e) => setIsOrganic(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="organic" className="text-sm">
                      This product is grown organically
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="seasonal"
                      checked={isSeasonal}
                      onChange={(e) => setIsSeasonal(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="seasonal" className="text-sm">
                      Seasonal speciality
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Certification (optional)
                  </label>
                  <Input
                    placeholder="NPOP / FPO / State Organic Board..."
                    value={certification}
                    onChange={(e) => setCertification(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/farmer-products")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmerEditProduct;