// src/components/ProductCard.tsx
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;        // made optional
  imageUrl?: string;     // NEW: allow imageUrl from API
  farmer: string;
  location: string;
  rating: number;
  organic?: boolean;
  inStock?: boolean;
}

export const ProductCard = ({
  id,
  name,
  price,
  unit,
  image,
  imageUrl,
  farmer,
  location,
  rating,
  organic = false,
  inStock = true,
}: ProductCardProps) => {
  const { addToCart } = useCart();

  // Prefer imageUrl from backend, then image prop, then a fallback
  const imageSrc =
    imageUrl || image || "https://via.placeholder.com/400x400?text=No+Image";

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart({
      id,
      name,
      price,
      unit,
      image: imageSrc, // store same resolved image
    });
  };

  return (
    <Card className="group flex flex-col overflow-hidden">
      <Link to={`/shop?product=${id}`}>
        <div className="relative aspect-square overflow-hidden">
          <img
            src={imageSrc}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {organic && (
            <Badge className="absolute left-3 top-3 bg-emerald-600 text-white">
              Organic
            </Badge>
          )}
          {!inStock && (
            <Badge
              variant="destructive"
              className="absolute right-3 top-3 bg-red-600 text-white"
            >
              Out of stock
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        <Link to={`/shop?product=${id}`} className="space-y-1">
          <h3 className="line-clamp-1 text-lg font-semibold tracking-tight">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-medium text-foreground">{rating}</span>
            <span className="text-muted-foreground">(128)</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {farmer} • {location}
            </span>
          </div>
        </Link>
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div>
          <p className="text-2xl font-bold text-primary">₹{price}</p>
          <p className="text-xs text-muted-foreground">per {unit}</p>
        </div>
        <Button
          size="icon"
          variant="accent"
          disabled={!inStock}
          className="h-10 w-10"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
