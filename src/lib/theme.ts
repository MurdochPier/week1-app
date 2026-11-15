// NOTE: index.html has a small inline copy of loadThemeChoice + resolveTheme + applyTheme that runs before
// the page draws (to avoid a white flash). Keep the two in sync if the key or rules change.

export type ThemeChoice = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

export const THEME_KEY = 'week1-app:theme'
export const DARK_QUERY = '(prefers-color-scheme: dark)'

const CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system']

function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (CHOICES as readonly string[]).includes(value)
}

/** The saved choice, or 'system' if nothing (valid) was saved. */
export function loadThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return isThemeChoice(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

export function saveThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(THEME_KEY, choice)
  } catch {
    // Storage blocked or full: the theme still works, it just won't be remembered.
  }
}

/** True if the operating system is set to dark mode. False if the browser can't tell us. */
export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

/** Turns the user's choice into the theme to actually show. */
export function resolveTheme(choice: ThemeChoice, prefersDark = systemPrefersDark()): Theme {
  if (choice === 'system') return prefersDark ? 'dark' : 'light'
  return choice
}

/** The next choice when the toggle is clicked: light → dark → system → light. */
export function nextThemeChoice(choice: ThemeChoice): ThemeChoice {
  return CHOICES[(CHOICES.indexOf(choice) + 1) % CHOICES.length]
}

/** Shows a theme by setting <html data-theme="…">; the CSS variables in index.css do the rest. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}
