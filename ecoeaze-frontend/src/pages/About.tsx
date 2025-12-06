import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Heart, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import farmerProfile from "@/assets/farmer-profile.jpg";

const About = () => {
  const values = [
    {
      icon: Leaf,
      title: "Sustainability",
      description: "We're committed to promoting sustainable farming practices that protect our planet for future generations.",
    },
    {
      icon: Heart,
      title: "Community",
      description: "Building strong relationships between local farmers and families is at the heart of what we do.",
    },
    {
      icon: Users,
      title: "Fair Trade",
      description: "We ensure farmers receive fair compensation for their hard work and quality produce.",
    },
    {
      icon: TrendingUp,
      title: "Growth",
      description: "Supporting the growth of local agriculture and empowering small-scale farmers to thrive.",
    },
  ];

  const stats = [
    { value: "500+", label: "Local Farmers" },
    { value: "50K+", label: "Happy Customers" },
    { value: "100K+", label: "Orders Delivered" },
    { value: "95%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="text-sm font-semibold">
              Our Story
            </Badge>
            <h1>Connecting Farmers and Families</h1>
            <p className="text-lg text-muted-foreground">
              EcoEaze was founded with a simple mission: to make fresh, local, and organic 
              produce accessible to everyone while supporting sustainable agriculture and fair 
              compensation for hardworking farmers.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <p className="text-4xl md:text-5xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-large">
              <img
                src={farmerProfile}
                alt="Our mission"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-6">
              <Badge variant="secondary">Our Mission</Badge>
              <h2>Making a Difference, One Harvest at a Time</h2>
              <p className="text-muted-foreground">
                We believe in creating a food system that's better for everyone. By connecting 
                consumers directly with local farmers, we eliminate unnecessary middlemen, 
                reduce food miles, and ensure that the people who grow our food can make a 
                living doing what they love.
              </p>
              <p className="text-muted-foreground">
                Every purchase on EcoEaze supports sustainable farming practices, reduces 
                carbon footprint, and helps build resilient local food systems. Together, we're 
                not just buying groceries – we're investing in our communities and our planet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Our Values</Badge>
            <h2>What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2>Simple, Transparent, Direct</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-foreground">Browse & Select</h3>
              <p className="text-sm text-muted-foreground">
                Explore fresh produce from verified local farmers and choose what you need
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-foreground">Order Direct</h3>
              <p className="text-sm text-muted-foreground">
                Place your order directly with farmers, cutting out the middleman
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-foreground">Receive Fresh</h3>
              <p className="text-sm text-muted-foreground">
                Get farm-fresh produce delivered to your door or pick up from the farm
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-farmer-accent">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2>Join Our Growing Community</h2>
            <p className="text-lg text-muted-foreground">
              Whether you're a consumer looking for fresh produce or a farmer wanting to 
              reach more customers, EcoEaze is here for you.
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
                  Become a Farmer Partner
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
