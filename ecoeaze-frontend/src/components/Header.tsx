// src/components/Header.tsx
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const { items } = useCart();
  const navigate = useNavigate();

  const totalItems = items.reduce((t, i) => t + i.quantity, 0);

  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="border-b bg-background shadow-sm">
      <div className="container flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary">
          EcoEaze 🌱
        </Link>

        {/* Nav links */}
        <nav className="hidden gap-6 md:flex">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <Link to="/shop" className="hover:text-primary">
            Shop
          </Link>
          <Link to="/about" className="hover:text-primary">
            About
          </Link>
          <Link to="/contact" className="hover:text-primary">
            Contact
          </Link>
          {/* Show Admin Portal link only if role = admin */}
          {user?.role === "admin" && (
            <Link to="/admin-portal" className="hover:text-primary">
              Admin Portal
            </Link>
          )}
          {/* Show Farmer Portal link only if role = farmer */}
          {user?.role === "farmer" && (
            <Link to="/farmer-portal" className="hover:text-primary">
              Farmer Portal
            </Link>
          )}
          {/* Show My Orders link only if user is logged in and not a farmer */}
          {user && user.role !== "farmer" && user.role !== "admin" && (
            <Link to="/my-orders" className="hover:text-primary">
              My Orders
            </Link>
          )}
        </nav>

        {/* Right side: Cart + Login/Logout */}
        <div className="flex items-center gap-4">
          {/* Cart button */}
          <button
            onClick={() => navigate("/cart")}
            className="relative flex h-10 w-10 items-center justify-center rounded-md border hover:bg-accent"
          >
            <ShoppingCart className="h-5 w-5" />

            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>

          {/* Login / Logout */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm">
                Hi, {user.name ? user.name.split(" ")[0] : "User"}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")}>
              <User className="mr-2 h-4 w-4" /> Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

// Optional default export so both import styles work
export default Header;