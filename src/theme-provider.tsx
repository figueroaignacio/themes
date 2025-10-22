import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme, clickEvent?: React.MouseEvent) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme-preference';

interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

type DocumentWithTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition;
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY,
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
  enableViewTransitions = true,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  enableViewTransitions?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const resolveTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  const applyTheme = (newTheme: 'light' | 'dark', clickEvent?: React.MouseEvent) => {
    const root = document.documentElement;
    const doc = document as DocumentWithTransition;

    const updateTheme = () => {
      root.classList.remove('light', 'dark');

      if (attribute === 'class') {
        root.classList.add(newTheme);
      } else {
        root.setAttribute(attribute, newTheme);
      }

      root.style.colorScheme = newTheme;
    };

    if (!enableViewTransitions || !doc.startViewTransition) {
      if (disableTransitionOnChange) {
        const css = document.createElement('style');
        css.type = 'text/css';
        css.appendChild(
          document.createTextNode(
            '*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}',
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
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      });
    } else {
      doc.startViewTransition(() => {
        updateTheme();
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  useEffect(() => {
    if (!enableSystem || !mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = getSystemTheme();
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme, enableSystem, mounted]);

  const setTheme = (newTheme: Theme, clickEvent?: React.MouseEvent) => {
    setThemeState(newTheme);

    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {}

    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved, clickEvent);
  };

  const themes: Theme[] = enableSystem ? ['light', 'dark', 'system'] : ['light', 'dark'];

  const value = {
    theme,
    resolvedTheme,
    setTheme,
    themes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}
