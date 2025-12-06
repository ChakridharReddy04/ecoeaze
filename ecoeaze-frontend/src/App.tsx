// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import FarmerAddProduct from "./pages/FarmerAddProduct";
import FarmerProductsPage from "./pages/FarmerProductsPage";
import FarmerProductManagement from "./pages/FarmerProductManagement";
import FarmerEditProduct from "./pages/FarmerEditProduct";
import FarmerProfile from "./pages/FarmerProfile";
import MyOrders from "./pages/MyOrders";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FarmerPortal from "./pages/FarmerPortal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CartPage from "./pages/CartPage";
import NotFound from "./pages/NotFound";
import AdminPortal from "./pages/AdminPortal";

import { CartProvider } from "./context/CartContext";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {/* 👇 VERY IMPORTANT: wrap everything that uses useCart */}
          <CartProvider>
            <div className="flex min-h-screen flex-col bg-background text-foreground">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/farmer-portal" element={<FarmerPortal />} />
                  <Route path="/farmer/profile" element={<FarmerProfile />} />
                  <Route path="/farmer/products/new" element={<FarmerAddProduct />} />
                  <Route path="/farmer/products/manage" element={<FarmerProductManagement />} />
                  <Route path="/farmer/products/edit/:id" element={<FarmerEditProduct />} />
                  <Route path="/farmer-products" element={<FarmerProductsPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path="/admin-portal" element={<AdminPortal />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </CartProvider>

          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;