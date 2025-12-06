import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Leaf, TrendingUp, Users, Shield, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-harvest.jpg";
import productTomatoes from "@/assets/product-tomatoes.jpg";
import productGreens from "@/assets/product-greens.jpg";
import productPeppers from "@/assets/product-peppers.jpg";
import farmerProfile from "@/assets/farmer-profile.jpg";

const Home = () => {
  const featuredProducts = [
    {
      id: "1",
      name: "Organic Cherry Tomatoes",
      price: 4.99,
      unit: "lb",
      image: productTomatoes,
      farmer: "Green Valley Farm",
      location: "California",
      rating: 4.8,
      organic: true,
      inStock: true,
    },
    {
      id: "2",
      name: "Fresh Mixed Greens",
      price: 3.49,
      unit: "bunch",
      image: productGreens,
      farmer: "Sunshine Acres",
      location: "Oregon",
      rating: 4.9,
      organic: true,
      inStock: true,
    },
    {
      id: "3",
      name: "Rainbow Bell Peppers",
      price: 5.99,
      unit: "lb",
      image: productPeppers,
      farmer: "Harvest Haven",
      location: "Washington",
      rating: 4.7,
      organic: false,
      inStock: true,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        
        <div className="container relative z-10 px-4 py-20 md:py-32">
          <div className="max-w-2xl space-y-6">
            <Badge variant="secondary" className="text-sm font-semibold">
              Fresh • Local • Sustainable
            </Badge>
            <h1 className="text-gradient">
              Farm-Fresh Produce Delivered to Your Door
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Connect directly with local farmers and enjoy the freshest organic produce. 
              Support sustainable agriculture while feeding your family the best.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/farmers">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Meet Our Farmers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">100% Organic</h3>
              <p className="text-sm text-muted-foreground">
                Certified organic produce from trusted local farms
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Fair Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Direct from farm prices that benefit both farmers and consumers
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Community First</h3>
              <p className="text-sm text-muted-foreground">
                Building strong connections between farmers and families
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Quality Assured</h3>
              <p className="text-sm text-muted-foreground">
                Every product verified for freshness and quality
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="mb-2">Featured Products</h2>
              <p className="text-muted-foreground">Fresh picks from our local farmers</p>
            </div>
            <Link to="/shop">
              <Button variant="ghost">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Farmer Spotlight */}
      <section className="py-16 bg-farmer-accent">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-large">
              <img
                src={farmerProfile}
                alt="Local farmer"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-6">
              <Badge variant="secondary">Farmer Spotlight</Badge>
              <h2>Meet John from Green Valley Farm</h2>
              <p className="text-lg text-muted-foreground">
                "Being part of EcoEaze has transformed my farming business. I can now reach 
                customers directly and get fair prices for my organic produce. It's wonderful to 
                see families enjoying the fruits and vegetables I grow with care."
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">20+ years of organic farming experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">USDA Organic certified since 2010</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Sustainable farming practices</span>
                </li>
              </ul>
              <Link to="/farmers">
                <Button variant="farmer" size="lg">
                  Meet All Our Farmers
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2>Ready to Experience Farm-Fresh Goodness?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of families who trust EcoEaze for their fresh produce needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button variant="hero" size="xl">
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/farmer-portal">
                <Button variant="farmer" size="xl">
                  Join as a Farmer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
