"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme, clickEvent?: React.MouseEvent) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "theme-preference";

interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

type DocumentWithTransition = Document & {
  startViewTransition?: (
    callback: () => void | Promise<void>,
  ) => ViewTransition;
};

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  enableViewTransitions?: boolean;
  nonce?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
  enableViewTransitions = true,
  nonce,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  const resolveTheme = useCallback(
    (currentTheme: Theme): "light" | "dark" => {
      if (currentTheme === "system") {
        return getSystemTheme();
      }
      return currentTheme;
    },
    [getSystemTheme],
  );

  const applyTheme = useCallback(
    (
      newTheme: "light" | "dark",
      clickEvent?: React.MouseEvent,
      isInitial = false,
    ) => {
      if (typeof document === "undefined") return;

      const root = document.documentElement;
      const doc = document as DocumentWithTransition;

      const updateTheme = () => {
        root.classList.remove("light", "dark");

        if (attribute === "class") {
          root.classList.add(newTheme);
        } else {
          root.setAttribute(attribute, newTheme);
        }

        root.style.colorScheme = newTheme;
      };

      if (!enableViewTransitions || !doc.startViewTransition || isInitial) {
        if (disableTransitionOnChange) {
          const css = document.createElement("style");
          css.type = "text/css";
          css.appendChild(
            document.createTextNode(
              "*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}",
            ),
          );
          document.head.appendChild(css);
          (() => window.getComputedStyle(root).opacity)();
          setTimeout(() => {
            document.head.removeChild(css);
          }, 1);
        }
        updateTheme();
        return;
      }

      if (clickEvent) {
        const x = clickEvent.clientX;
        const y = clickEvent.clientY;
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y),
        );

        const transition = doc.startViewTransition(() => {
          updateTheme();
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];

          document.documentElement.animate(
            {
              clipPath: clipPath,
            },
            {
              duration: 500,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        });
      } else {
        doc.startViewTransition(() => {
          updateTheme();
        });
      }
    },
    [attribute, disableTransitionOnChange, enableViewTransitions],
  );

  useIsomorphicLayoutEffect(() => {
    const savedTheme =
      (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    setThemeState(savedTheme);
    const resolved = resolveTheme(savedTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved, undefined, true);
    setMounted(true);
  }, [defaultTheme, resolveTheme, storageKey, applyTheme]);

  useEffect(() => {
    if (!enableSystem || !mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const newResolved = getSystemTheme();
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, enableSystem, mounted, getSystemTheme, applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme, clickEvent?: React.MouseEvent) => {
      setThemeState(newTheme);

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (e) {
        // Ignore
      }

      const resolved = resolveTheme(newTheme);
      setResolvedTheme(resolved);
      applyTheme(resolved, clickEvent);
    },
    [storageKey, resolveTheme, applyTheme],
  );

  const themes: Theme[] = useMemo(
    () => (enableSystem ? ["light", "dark", "system"] : ["light", "dark"]),
    [enableSystem],
  );

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      themes,
    }),
    [theme, resolvedTheme, setTheme, themes],
  );

  // Theme script to be injected to avoid FOUC
  const scriptContent = `(function() {
    try {
      var localTheme = window.localStorage.getItem('${storageKey}');
      var theme = localTheme ? localTheme : '${defaultTheme}';
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var root = document.documentElement;
      ${attribute === "class" ? "root.classList.add(theme);" : `root.setAttribute('${attribute}', theme);`}
      root.style.colorScheme = theme;
    } catch (e) {}
  })();`;

  return (
    <ThemeContext.Provider value={value}>
      <script
        suppressHydrationWarning
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: scriptContent }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
