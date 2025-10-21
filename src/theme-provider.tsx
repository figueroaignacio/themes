"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: "class" | "data-theme";
  disableTransitionOnChange?: boolean;
  forcedTheme?: Theme;
  enableCookieStorage?: boolean;
  cookieName?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
};

const getStoredTheme = (key: string, defaultTheme: Theme): Theme => {
  if (typeof window === "undefined") return defaultTheme;
  try {
    const stored = localStorage.getItem(key) as Theme;
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
  } catch {}
  return defaultTheme;
};

const setCookie = (name: string, value: string): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value};path=/;max-age=31536000;SameSite=Lax`;
};

const applyTheme = (
  theme: ResolvedTheme,
  attribute: "class" | "data-theme",
  disableTransition: boolean
): void => {
  if (typeof document === "undefined") return;
  const html = document.documentElement;

  if (disableTransition) {
    const css = document.createElement("style");
    css.textContent =
      "*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}";
    document.head.appendChild(css);
    void window.getComputedStyle(document.body);
    setTimeout(() => document.head.removeChild(css), 1);
  }

  if (attribute === "class") {
    html.classList.remove("light", "dark");
    html.classList.add(theme);
  } else {
    html.setAttribute("data-theme", theme);
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
  storageKey = "theme",
  attribute = "class",
  disableTransitionOnChange = true,
  forcedTheme,
  enableCookieStorage = false,
  cookieName = "theme",
}) => {
  const [theme, setThemeState] = useState<Theme>(
    () => forcedTheme || getStoredTheme(storageKey, defaultTheme)
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme | undefined>(
    () => getSystemTheme()
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const current = forcedTheme || getStoredTheme(storageKey, defaultTheme);
    return current === "system" ? getSystemTheme() : current;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? "dark" : "light";
      setSystemTheme(newSystemTheme);
      if (theme === "system") {
        setResolvedTheme(newSystemTheme);
        applyTheme(newSystemTheme, attribute, disableTransitionOnChange);
        if (enableCookieStorage) setCookie(cookieName, newSystemTheme);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [
    theme,
    attribute,
    disableTransitionOnChange,
    enableCookieStorage,
    cookieName,
  ]);

  useEffect(() => {
    const current = forcedTheme || theme;
    const resolved =
      current === "system" ? systemTheme || getSystemTheme() : current;
    setResolvedTheme(resolved);
    applyTheme(resolved, attribute, false);
    if (enableCookieStorage) setCookie(cookieName, resolved);
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (forcedTheme) return;
      setThemeState(newTheme);
      const resolved =
        newTheme === "system" ? systemTheme || getSystemTheme() : newTheme;
      setResolvedTheme(resolved);
      applyTheme(resolved, attribute, disableTransitionOnChange);
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {}
      if (enableCookieStorage) setCookie(cookieName, resolved);
    },
    [
      forcedTheme,
      systemTheme,
      storageKey,
      attribute,
      disableTransitionOnChange,
      enableCookieStorage,
      cookieName,
    ]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme: forcedTheme || theme,
        setTheme,
        resolvedTheme,
        systemTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
