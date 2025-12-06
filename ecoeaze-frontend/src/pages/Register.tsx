// src/pages/Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface RegisterResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"customer" | "farmer">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const mutation = useMutation({
    mutationFn: async () =>
      apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role, phone }),
      }),
    onSuccess: () => {
      toast.success("Account created! Please login.");
      navigate("/login");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Registration failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Create your EcoEaze account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Ravi Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone (E.164, e.g. +9198xxxx...)</label>
                <Input
                  type="tel"
                  placeholder="+9198xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-sm font-medium">I am a</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={role === "customer" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setRole("customer")}
                  >
                    Customer
                  </Button>
                  <Button
                    type="button"
                    variant={role === "farmer" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setRole("farmer")}
                  >
                    Farmer
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating account..." : "Sign up"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;