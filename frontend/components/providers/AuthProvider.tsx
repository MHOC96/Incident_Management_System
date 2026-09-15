"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/auth";
import type { LoginPayload, User } from "@/types";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const generation = useRef(0);

  const refreshProfile = useCallback(async () => {
    const current = generation.current;
    try {
      const session = await authService.session();
      if (current === generation.current) setUser(session.user);
    } catch {
      if (current === generation.current) setUser(null);
    }
  }, []);

  useEffect(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    const expired = () => { generation.current++; setUser(null); };
    const channel = new BroadcastChannel("incident-session");
    channel.onmessage = () => { generation.current++; void refreshProfile(); };
    window.addEventListener("auth-expired", expired);
    void (async () => {
      await refreshProfile();
      setIsLoading(false);
    })();
    return () => { channel.close(); window.removeEventListener("auth-expired", expired); };
  }, [refreshProfile]);

  const login = useCallback(async (payload: LoginPayload) => {
    generation.current++;
    const profile = await authService.login(payload);
    setUser(profile);
    const channel = new BroadcastChannel("incident-session");
    channel.postMessage("changed");
    channel.close();
    return profile;
  }, []);

  const logout = useCallback(async () => {
    generation.current++;
    await authService.logout();
    setUser(null);
    const channel = new BroadcastChannel("incident-session");
    channel.postMessage("changed");
    channel.close();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
