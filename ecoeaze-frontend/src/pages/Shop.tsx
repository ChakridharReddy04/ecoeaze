// src/pages/Shop.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  certification?: string;
  images?: { url: string; alt?: string }[];
  imageUrl?: string;        // from backend (Cloudinary)
  image?: string;           // any older field
  unit?: string;
  farmer?: {
    name: string;
    farmName?: string;
    location?: string;
  };
  averageRating?: number;
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: "all", label: "All Products" },
    { id: "fruits", label: "Fruits" },
    { id: "vegetables", label: "Vegetables" },
    { id: "leafy-greens", label: "Leafy Greens" },
    { id: "grains", label: "Grains & Pulses" },
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", searchQuery, selectedCategory, sortBy, minPrice, maxPrice],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (sortBy) params.append("sort", sortBy);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiFetch<ProductsResponse>(`/products${query}`);

      // 🔍 DEBUG: log what backend actually sends
      console.log("SHOP PRODUCTS:", res.data);
      return res;
    },
  });

  const products = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || minPrice || maxPrice || sortBy !== "newest";

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4">Fresh Produce Market</h1>
          <p className="max-w-2xl text-muted-foreground">
            Explore a curated selection of verified organic produce from local
            farmers. Filter by category or search for your favorite items.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search by product, farm, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <Button 
                variant="outline" 
                className="shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="stock_desc">Stock: High → Low</option>
              <option value="stock_asc">Stock: Low → High</option>
            </select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={
                        selectedCategory === category.id ? "default" : "outline"
                      }
                      className="cursor-pointer px-3 py-1"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Min Price ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Price ($)</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetFilters}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              )}
            </div>
          )}

          {/* Category badges (always visible on larger screens) */}
          <div className="hidden md:flex md:flex-wrap md:gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                className="cursor-pointer px-3 py-1"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Products grid */}
        {isLoading && <p className="py-8 text-center">Loading products...</p>}
        {isError && (
          <p className="py-8 text-center text-destructive">
            Failed to load products. Check backend.
          </p>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No products found. Try changing filters or search text.
          </p>
        )}

        {!isLoading && !isError && products.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {products.length} of {total} products
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const firstImageFromArray = product.images?.[0]?.url;

            // ✅ prefer real imageUrl, then image, then first image in array, then a valid placeholder URL
            const imageSrc =
              product.imageUrl ||
              product.image ||
              firstImageFromArray ||
              "https://via.placeholder.com/400x400?text=No+Image";

            const unit = product.unit || "kg";

            return (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                price={product.price}
                unit={unit}
                image={imageSrc}
                farmer={product.farmer?.name || "Local Farmer"}
                location={product.farmer?.location || "Farm Nearby"}
                rating={product.averageRating || 4.5}
                organic={!!product.certification}
                inStock={product.stock > 0}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Shop;
