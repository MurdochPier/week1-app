import { createContext } from 'react'
import type { Dispatch } from 'react'
import type { AppState } from '../types'
import type { PageAction } from './reducer'

export interface AppContextValue {
  state: AppState
  dispatch: Dispatch<PageAction>
}

export const AppContext = createContext<AppContextValue | null>(null)
