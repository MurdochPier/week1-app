import { createContext } from 'react'
import type { Dispatch } from 'react'
import type { AppState } from '../types'
import type { AppAction } from './reducer'

export interface AppContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
}

export const AppContext = createContext<AppContextValue | null>(null)
