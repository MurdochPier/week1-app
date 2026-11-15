import { useEffect, useReducer, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { loadState, saveState } from '../storage/storage'
import type { AppState } from '../types'
import { AppContext } from './appContextValue'
import { reducer } from './reducer'

/** How long to wait after the last change before saving (a "debounce"). */
export const SAVE_DELAY_MS = 300

/** Saves the waiting state, if there is one. */
function flush(pending: RefObject<AppState | null>) {
  if (pending.current !== null) {
    saveState(pending.current)
    pending.current = null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: localStorage is read once, on first render.
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const pending = useRef<AppState | null>(null)

  // Every change restarts the timer, so typing only saves once you pause.
  useEffect(() => {
    pending.current = state
    const timer = setTimeout(() => flush(pending), SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state])

  // Don't lose the last few keystrokes when the tab closes or the app unmounts.
  useEffect(() => {
    const onPageHide = () => flush(pending)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      flush(pending)
    }
  }, [])

  return <AppContext value={{ state, dispatch }}>{children}</AppContext>
}
