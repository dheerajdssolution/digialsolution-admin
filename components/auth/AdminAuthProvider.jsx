"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const API = (
  process.env.NEXT_PUBLIC_CMS_API_URL || "https://digital-solution-1-h8nk.onrender.com/api"
).replace(/\/$/, "");
const AuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(window.localStorage.getItem("ds-admin-token") || "");
    setEmail(window.localStorage.getItem("ds-admin-email") || "");
    setReady(true);
  }, []);

  const request = useCallback(
    async (path, options = {}) => {
      const isFormData =
        typeof FormData !== "undefined" && options.body instanceof FormData;
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Request failed.");
      return data;
    },
    [token],
  );

  const authenticate = useCallback(async (path, values) => {
    const response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Sign-in failed.");
    window.localStorage.setItem("ds-admin-token", data.token);
    window.localStorage.setItem(
      "ds-admin-email",
      data.user?.email || values.email,
    );
    setToken(data.token);
    setEmail(data.user?.email || values.email);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("ds-admin-token");
    window.localStorage.removeItem("ds-admin-email");
    setToken("");
    setEmail("");
  }, []);

  const value = useMemo(
    () => ({ token, email, ready, request, authenticate, logout }),
    [token, email, ready, request, authenticate, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const value = useContext(AuthContext);
  if (!value)
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  return value;
}
