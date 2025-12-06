// src/lib/api.ts
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5008/api";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include", // allow cookies too
    headers: {
      // JSON by default (not for FormData)
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      // ✅ ALWAYS attach JWT if we have it
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Handle 401 Unauthorized specifically
    if (res.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error((data as any)?.message || "Request failed");
  }

  // If we receive a new accessToken in the response, save it
  if (data && typeof data === 'object' && 'accessToken' in data) {
    localStorage.setItem("accessToken", data.accessToken);
  }

  return data as T;
}