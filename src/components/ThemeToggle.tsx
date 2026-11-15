import { useEffect, useState } from 'react'
import {
  applyTheme,
  DARK_QUERY,
  loadThemeChoice,
  nextThemeChoice,
  resolveTheme,
  saveThemeChoice,
} from '../lib/theme'
import type { ThemeChoice } from '../lib/theme'

const DISPLAY: Record<ThemeChoice, { icon: string; label: string }> = {
  light: { icon: '☀', label: 'Light' },
  dark: { icon: '☾', label: 'Dark' },
  system: { icon: '◐', label: 'System' },
}

function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(loadThemeChoice)

  useEffect(() => {
    applyTheme(resolveTheme(choice))
    saveThemeChoice(choice)

    // On "System", follow the OS live when the user switches it between light and dark.
    if (choice !== 'system' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(DARK_QUERY)
    const onChange = (e: MediaQueryListEvent) => applyTheme(resolveTheme('system', e.matches))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [choice])

  const { icon, label } = DISPLAY[choice]
  const next = DISPLAY[nextThemeChoice(choice)].label

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Theme: ${label}. Switch to ${next}.`}
      title={`Theme: ${label}`}
      onClick={() => setChoice(nextThemeChoice)}
    >
      <span aria-hidden="true">{icon}</span> {label}
    </button>
  )
}

export default ThemeToggle
