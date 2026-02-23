import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'emconnect-theme';
const FORCE_LIGHT_PATHS = ['/login', '/register'];

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const { pathname } = useLocation();

  const effectiveTheme = FORCE_LIGHT_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
    ? 'light'
    : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = effectiveTheme;
    if (effectiveTheme === theme) {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [effectiveTheme, theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      effectiveTheme,
      isDark: effectiveTheme === 'dark',
      toggleTheme,
    }),
    [theme, effectiveTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

