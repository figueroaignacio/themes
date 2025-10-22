# i7a-themes

Lightweight and flexible theme management library for React projects. It allows you to easily switch between multiple themes (light, dark, or custom) and customize your UI experience.

## Features

- ✅ Support for multiple themes (`light`, `dark`, `system`, or custom`).
- ✅ Easy integration with React and Next.js projects.
- ✅ Automatic system theme detection (`prefers-color-scheme`).
- ✅ Persistent theme storage using `localStorage`.
- ✅ Fully typed with TypeScript.

## Installation

```bash
npm install i7a-themes
# or
yarn add i7a-themes
```

## Usage

### Setup Provider

Wrap your app with the `ThemeProvider`:

```tsx
import { ThemeProvider } from "i7a-themes";
import App from "./App";

export default function Root() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
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
  background-color: var(--background)
  color: var(--foreground)
}
```

### Accessing the Theme

Use the `useTheme` hook to access or update the current theme:

```tsx
import { useTheme } from "i7a-themes";

export default function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme, themes } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>

      {themes.map((t) => (
        <button key={t} onClick={() => setTheme(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}
```

## Available Themes

- `light` – Light mode
- `dark` – Dark mode
- `system` – Matches the user's OS preference
- Custom themes – Extend the default theme list as needed
