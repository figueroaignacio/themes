"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemeProvider } from "nach-themes";

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-6 selection:bg-primary/10 gap-8">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Next.js + nach-themes
        </h1>
        <ThemeSwitcher />
      </div>
    </ThemeProvider>
  );
}
