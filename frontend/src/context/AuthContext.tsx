'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  AUTH_CHANGE_EVENT,
  StoredAuthUser,
  clearStoredAuth,
  getStoredToken,
  persistAuth,
  readStoredUser,
} from '@/lib/authStorage';

type AuthUser = StoredAuthUser;

interface AuthContextValue {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isReady: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const syncFromStorage = useCallback(() => {
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    syncFromStorage();
    const handleAuthChange = () => syncFromStorage();

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, [syncFromStorage]);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setIsReady(true);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setUser(null);
      return;
    }

    const profile = await api.getProfile();
    const nextUser = {
      _id: profile._id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      whatsappOptIn: profile.whatsappOptIn,
      role: profile.role,
      token,
    };

    persistAuth(nextUser);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAuth() {
      if (!getStoredToken()) {
        if (!cancelled) {
          setIsReady(true);
        }
        return;
      }

      try {
        await refreshProfile();
      } catch {
        clearStoredAuth();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void hydrateAuth();

    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  const login = (userData: AuthUser) => {
    persistAuth(userData);
    setUser(userData);
    setIsReady(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isReady,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
