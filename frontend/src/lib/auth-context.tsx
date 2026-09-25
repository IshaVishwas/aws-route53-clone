"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { AuthUser } from "@/lib/types";
import {
  loginApi,
  logoutApi,
  getSessionApi,
  getStoredToken,
  clearStoredToken,
} from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // isLoading starts as true on both server and client to guarantee identical initial hydration trees.
  // Client-side useEffect then verifies any stored token in localStorage against the backend.
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const storedToken = getStoredToken();
    if (!storedToken) {
      // No stored token: complete initialization asynchronously so setState is inside a promise callback
      Promise.resolve().then(() => {
        if (!cancelled) {
          setAuthState({ user: null, token: null, isLoading: false });
        }
      });
      return;
    }

    // Stored token found: validate against backend session endpoint
    getSessionApi()
      .then((session) => {
        if (!cancelled) {
          setAuthState({
            user: session.user,
            token: session.token,
            isLoading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredToken();
          setAuthState({ user: null, token: null, isLoading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const session = await loginApi(email, password);
    setAuthState({ user: session.user, token: session.token, isLoading: false });
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Proceed even if server unreachable
    } finally {
      clearStoredToken();
      setAuthState({ user: null, token: null, isLoading: false });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isAuthenticated: Boolean(authState.user && authState.token),
        isLoading: authState.isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
