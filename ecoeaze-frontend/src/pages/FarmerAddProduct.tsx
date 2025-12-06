// src/pages/FarmerAddProduct.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CreateProductResponse {
  success: boolean;
  message: string;
  data: any;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const FarmerAddProduct = () => {
  const navigate = useNavigate();

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
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async (): Promise<CreateProductResponse> => {
      if (!imageFile) {
        throw new Error("Please upload a product image");
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append(
        "price",
        String(typeof price === "string" ? Number(price) : price)
      );
      formData.append(
        "stock",
        String(typeof stock === "string" ? Number(stock) : stock)
      );
      formData.append("unit", unit);
      if (harvestDate) {
        formData.append("harvestDate", harvestDate);
      }
      formData.append("farmLocation", farmLocation);
      formData.append("isOrganic", String(isOrganic));
      formData.append("certification", certification);
      formData.append("isSeasonal", String(isSeasonal));
      formData.append(
        "tags",
        JSON.stringify(
          tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );
      formData.append("image", imageFile); // MUST match backend: upload.single("image")

      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${API_BASE_URL}/farmers/products`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Do NOT set Content-Type here; browser will set multipart/form-data
        },
        body: formData,
      });

      const data = (await res.json().catch(() => null)) as CreateProductResponse | null;

      if (!res.ok) {
        throw new Error(data?.message || "Failed to add product");
      }

      return data as CreateProductResponse;
    },
    onSuccess: () => {
      toast.success("Product added successfully!");
      navigate("/farmer-portal");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to add product");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !price || !stock) {
      toast.error("Name, price, and stock are required");
      return;
    }

    if (!imageFile) {
      toast.error("Please upload a product image");
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
            <CardDescription>
              Publish your fresh produce to the EcoEaze marketplace.
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
                  <label className="text-sm font-medium">Available Stock</label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={stock}
                    onChange={(e) =>
                      setStock(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    required
                  />
                </div>
              </div>

              {/* Harvest & Location */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Harvest Date</label>
                  <Input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Farm Location</label>
                  <Input
                    placeholder="Village / District"
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Organic / Seasonal / Certification */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Growing Details</label>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="organic"
                      checked={isOrganic}
                      onCheckedChange={(checked) =>
                        setIsOrganic(checked === true)
                      }
                    />
                    <label htmlFor="organic" className="text-sm">
                      This product is grown organically
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="seasonal"
                      checked={isSeasonal}
                      onCheckedChange={(checked) =>
                        setIsSeasonal(checked === true)
                      }
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

              {/* Tags & Image Upload */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Tags (comma separated)
                  </label>
                  <Input
                    placeholder="sweet, fibreless, export-quality"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Product Image</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImageFile(file);
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/farmer-portal")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Add Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmerAddProduct;
