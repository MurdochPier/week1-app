import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyTheme,
  loadThemeChoice,
  nextThemeChoice,
  resolveTheme,
  saveThemeChoice,
  systemPrefersDark,
  THEME_KEY,
} from './theme'

/** jsdom has no matchMedia, so fake one that reports the OS as dark or light. */
function mockSystemDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resolveTheme', () => {
  it("'system' follows the OS setting", () => {
    mockSystemDark(true)
    expect(resolveTheme('system')).toBe('dark')

    mockSystemDark(false)
    expect(resolveTheme('system')).toBe('light')
  })

  it("an explicit 'dark' or 'light' choice overrides the OS", () => {
    mockSystemDark(true)
    expect(resolveTheme('light')).toBe('light')

    mockSystemDark(false)
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('falls back to light when the browser cannot report the OS setting', () => {
    // jsdom has no window.matchMedia
    expect(systemPrefersDark()).toBe(false)
    expect(resolveTheme('system')).toBe('light')
  })
})

describe('saving and loading the choice', () => {
  it('the saved choice loads back', () => {
    saveThemeChoice('dark')
    expect(loadThemeChoice()).toBe('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it("nothing saved means 'system'", () => {
    expect(loadThemeChoice()).toBe('system')
  })

  it("an invalid stored value falls back to 'system'", () => {
    localStorage.setItem(THEME_KEY, 'purple')
    expect(loadThemeChoice()).toBe('system')
  })
})

describe('nextThemeChoice', () => {
  it('cycles light → dark → system → light', () => {
    expect(nextThemeChoice('light')).toBe('dark')
    expect(nextThemeChoice('dark')).toBe('system')
    expect(nextThemeChoice('system')).toBe('light')
  })
})

describe('applyTheme', () => {
  it('sets data-theme on <html>', () => {
    applyTheme('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    applyTheme('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })
})
