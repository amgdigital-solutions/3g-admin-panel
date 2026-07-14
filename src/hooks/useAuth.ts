import { useState, useEffect, useCallback } from "react";

interface AuthUser {
  email: string;
  role: string;
}

const VALID_USERS = [
  { email: "admin@3guae.com", password: "admin123", role: "admin" },
  { email: "super@3guae.com", password: "admin123", role: "super" },
];

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("admin_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ email: parsed.email, role: parsed.role });
      } catch {
        localStorage.removeItem("admin_auth");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const found = VALID_USERS.find(
      (u) => u.email === email && u.password === password,
    );
    if (found) {
      const authData = { email: found.email, role: found.role };
      localStorage.setItem("admin_auth", JSON.stringify(authData));
      setUser(authData);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("admin_auth");
    setUser(null);
  }, []);

  return { user, isLoading, isAuthenticated: !!user, login, logout };
}
