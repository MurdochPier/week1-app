import { useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import { loadState, saveState } from '../storage/storage'
import { AppContext } from './appContextValue'
import { reducer } from './reducer'

export function AppProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: localStorage is read once, on first render.
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  return <AppContext value={{ state, dispatch }}>{children}</AppContext>
}
