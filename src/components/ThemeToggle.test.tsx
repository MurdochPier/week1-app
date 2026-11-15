import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveThemeChoice, THEME_KEY } from '../lib/theme'
import ThemeToggle from './ThemeToggle'

/** A fake OS setting that can be switched during a test, like changing Windows to dark mode. */
function mockSystem(dark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>()
  const media = {
    matches: dark,
    addEventListener: (_type: string, listener: (e: { matches: boolean }) => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: (e: { matches: boolean }) => void) =>
      listeners.delete(listener),
  }
  vi.stubGlobal('matchMedia', () => media)
  return {
    setDark(value: boolean) {
      media.matches = value
      act(() => listeners.forEach((listener) => listener({ matches: value })))
    },
    listenerCount: () => listeners.size,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const html = document.documentElement
const toggle = () => screen.getByRole('button', { name: /^Theme:/ })

describe('ThemeToggle', () => {
  it('clicking cycles light → dark → system, updating <html data-theme> and saving', async () => {
    mockSystem(true)
    saveThemeChoice('light')
    const user = userEvent.setup()
    render(<ThemeToggle />)

    expect(toggle()).toHaveAccessibleName('Theme: Light. Switch to Dark.')
    expect(html).toHaveAttribute('data-theme', 'light')

    await user.click(toggle())
    expect(toggle()).toHaveTextContent('Dark')
    expect(html).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')

    await user.click(toggle())
    expect(toggle()).toHaveTextContent('System')
    expect(html).toHaveAttribute('data-theme', 'dark') // the mocked OS is dark
    expect(localStorage.getItem(THEME_KEY)).toBe('system')

    await user.click(toggle())
    expect(toggle()).toHaveTextContent('Light')
    expect(html).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })

  it('starts on System when nothing is saved', () => {
    mockSystem(false)
    render(<ThemeToggle />)
    expect(toggle()).toHaveTextContent('System')
    expect(html).toHaveAttribute('data-theme', 'light')
  })

  it('on System, follows the OS when it switches between light and dark', () => {
    const system = mockSystem(false)
    render(<ThemeToggle />)
    expect(html).toHaveAttribute('data-theme', 'light')

    system.setDark(true)
    expect(html).toHaveAttribute('data-theme', 'dark')

    system.setDark(false)
    expect(html).toHaveAttribute('data-theme', 'light')
  })

  it('an explicit choice ignores OS changes and stops listening', async () => {
    const system = mockSystem(false)
    const user = userEvent.setup()
    render(<ThemeToggle />)
    expect(system.listenerCount()).toBe(1)

    await user.click(toggle()) // System → Light
    expect(system.listenerCount()).toBe(0)

    system.setDark(true)
    expect(html).toHaveAttribute('data-theme', 'light')
  })
})
