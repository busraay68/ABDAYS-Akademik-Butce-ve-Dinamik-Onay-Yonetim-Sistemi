import { createContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '../utils/authStorage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => getStoredSession());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedSession = getStoredSession();
    if (storedSession) {
      setSession(storedSession);
    }
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      setStoredSession(result, credentials.rememberMe);
      setSession(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload, rememberMe) => {
    setIsLoading(true);
    try {
      const result = await authService.register(payload);
      setStoredSession(result, rememberMe);
      setSession(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (nextUser) => {
    setSession((current) => {
      if (!current) {
        return current;
      }

      const nextSession = {
        ...current,
        user: {
          ...current.user,
          ...nextUser,
        },
      };
      const rememberMe = Boolean(window.localStorage.getItem('abdays.auth.session'));
      setStoredSession(nextSession, rememberMe);
      return nextSession;
    });
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
