import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "nach-themes";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/50 p-1 backdrop-blur-xl shadow-sm relative z-10">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;

        return (
          <button
            key={t.value}
            type="button"
            onClick={(e) => setTheme(t.value, e)}
            className={`relative flex items-center justify-center rounded-full p-2 text-sm font-medium transition-colors hover:text-foreground ${
              isActive ? "text-foreground" : "text-muted-foreground"
            }`}
            aria-label={`Switch to ${t.label} theme`}
            title={t.label}>
            {isActive && (
              <motion.div
                layoutId="theme-bubble-vite"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
