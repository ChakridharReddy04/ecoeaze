// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "customer" | "farmer" | "admin";
  };
  accessToken: string;
  refreshToken?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<'credentials' | 'otp'>('credentials');
  const [code, setCode] = useState('');

  // Get the redirect path from location state, or default to home
  const from = location.state?.from?.pathname || "/";

  const loginMutation = useMutation({
    mutationFn: async (): Promise<any> => {
      return apiFetch<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    onSuccess: (data) => {
      // If server returned accessToken (no OTP flow), treat as logged in
      if (data?.accessToken && data?.user) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Welcome back!");
        if (data.user.role === "admin") navigate("/admin-portal");
        else if (data.user.role === "farmer") navigate("/farmer-portal");
        else navigate(from, { replace: true });
        return;
      }

      // Otherwise OTP was sent — move to OTP stage
      setStage('otp');
      toast.success(data?.message || 'OTP sent. Check your phone.');
    },
    onError: (err: any) => {
      toast.error(err?.message || "Login failed");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<any>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Login successful");
      if (data.user.role === "admin") navigate("/admin-portal");
      else if (data.user.role === "farmer") navigate("/farmer-portal");
      else navigate(from, { replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.message || "OTP verification failed");
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<any>("/auth/resend", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    onSuccess: (data) => {
      toast.success(data?.message || "OTP resent");
      setStage('otp');
    },
    onError: (err: any) => {
      toast.error(err?.message || "Resend failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === 'credentials') {
      loginMutation.mutate();
    } else {
      verifyMutation.mutate();
    }
  };

  const handleResend = () => {
    // call resend endpoint (requires email + password)
    resendMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              EcoEaze Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              {stage === 'credentials' && (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isLoading}
                >
                  {loginMutation.isLoading ? "Logging in..." : "Login"}
                </Button>
              )}

              {stage === 'otp' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Enter OTP</label>
                    <Input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      placeholder="6-digit code"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={verifyMutation.isLoading}
                    >
                      {verifyMutation.isLoading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleResend} disabled={resendMutation.isLoading || loginMutation.isLoading}>
                      {resendMutation.isLoading ? 'Resending...' : 'Resend'}
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;