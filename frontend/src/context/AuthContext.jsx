import { createContext, useContext, useState, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  googleLogin as apiGoogleLogin,
  getStoredUser,
  isAuthenticated as checkAuth,
  getCurrentUser as apiGetCurrentUser,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      setGuestMode(false);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRegister(email, password, name);
      setUser(data.user);
      setGuestMode(false);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setGuestMode(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const googleLoginFn = useCallback(async (credential) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGoogleLogin(credential);
      setUser(data.user);
      setGuestMode(false);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const enterGuestMode = useCallback(() => {
    // Ensure guest entry never carries a persisted auth session.
    apiLogout();
    setUser(null);
    setError(null);
    setGuestMode(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    setGuestMode(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiGetCurrentUser();
      setUser(userData);
      localStorage.setItem('em_user', JSON.stringify(userData));
      return userData;
    } catch {
      // Silently fail
      return null;
    }
  }, []);

  const value = {
    user,
    guestMode,
    loading,
    error,
    login,
    register,
    logout,
    enterGuestMode,
    exitGuestMode,
    clearError,
    googleLogin: googleLoginFn,
    refreshUser,
    isAuthenticated: !!user && checkAuth(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

