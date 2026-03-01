# nach-themes

Lightweight and flexible theme management library for React projects. Perfect for **Next.js (App Router)** and **Vite**. It allows you to easily switch between multiple themes (light, dark, or custom) and customize your UI experience without FOUC (Flash of Unstyled Content).

## Features

- ✅ **No FOUC**: Built-in script injection to prevent theme flashes before hydration.
- ✅ Support for multiple themes (`light`, `dark`, `system`, or custom).
- ✅ Seamless integration with Next.js App Router (`"use client"`) and Vite.
- ✅ Automatic system theme detection (`prefers-color-scheme`).
- ✅ Persistent theme storage using `localStorage`.
- ✅ Opt-in View Transitions API support for smooth theme switching animations.
- ✅ Fully typed with TypeScript.

## Installation

```bash
npm install nach-themes
# or
yarn add nach-themes
# or
pnpm add nach-themes
```

## Usage

### Next.js App Router Usage (Recommended)

In Next.js App Router, you should add `suppressHydrationWarning` to your `<html>` tag. Because `i7a-themes` injects a script to apply the theme class immediately (to prevent FOUC), React will complain if the server-rendered HTML doesn't match the client-modified HTML. The provider itself also uses `"use client"`.

```tsx
// app/layout.tsx
import { ThemeProvider } from "i7a-themes";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Vite / Generic React Usage

Wrap your main component with the `ThemeProvider`:

```tsx
// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "i7a-themes";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
```

### CSS Custom Properties

i7a-themes supports using **CSS variables** for dynamic theming with Tailwind CSS or Vanilla CSS.  
You can define variables for colors, fonts, or any other property and switch them depending on the theme.

#### Tailwind 4

```css
@import "tailwindcss";

:root {
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(222, 47%, 11%);
}

.dark {
  --background: hsl(225, 15%, 5%);
  --foreground: #f8fafc;
}

/* Inline theme mapping for i7a-themes */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

body {
  @apply bg-background text-foreground;
}
```

#### Vanilla CSS

```css
:root {
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(222, 47%, 11%);
}

.dark {
  --background: hsl(225, 15%, 5%);
  --foreground: #f8fafc;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
```

### Accessing the Theme

Use the `useTheme` hook to access or update the current theme:

```tsx
"use client"; // If in Next.js

import { useTheme } from "i7a-themes";

export default function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme, themes } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>

      {themes.map((t) => (
        <button key={t} onClick={(e) => setTheme(t, e)}>
          {t}
        </button>
      ))}
    </div>
  );
}
```

**Note:** Passing the event `e` to `setTheme(t, e)` will trigger the experimental View Transitions API animation if supported by the browser.

## Available Themes

- `light` – Light mode
- `dark` – Dark mode
- `system` – Matches the user's OS preference
- Custom themes – Extend the default theme list as needed
