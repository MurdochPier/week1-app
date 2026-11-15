import { useContext } from 'react'
import type { AppContextValue } from './appContextValue'
import { AppContext } from './appContextValue'

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (value === null) {
    throw new Error('useApp() must be used inside <AppProvider>')
  }
  return value
}
