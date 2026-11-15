import { initialState } from '../state/reducer'
import type { AppState, Page } from '../types'

export const STORAGE_KEY = 'week1-app:state'
const VERSION = 1

interface StoredData {
  version: number
  state: AppState
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPage(value: unknown): value is Page {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    (value.parentId === null || typeof value.parentId === 'string') &&
    Array.isArray(value.blocks) &&
    typeof value.createdAt === 'number' &&
    typeof value.updatedAt === 'number'
  )
}

function isAppState(value: unknown): value is AppState {
  return (
    isObject(value) &&
    isObject(value.pages) &&
    Object.values(value.pages).every(isPage) &&
    (value.selectedPageId === null || typeof value.selectedPageId === 'string')
  )
}

export function saveState(state: AppState): void {
  const data: StoredData = { version: VERSION, state }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    // Storage can be full or blocked; the app keeps working with in-memory state.
    console.warn('Could not save notes to localStorage', error)
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return initialState

    const data: unknown = JSON.parse(raw)
    if (!isObject(data) || data.version !== VERSION || !isAppState(data.state)) {
      return initialState
    }

    const { pages, selectedPageId } = data.state
    return {
      pages,
      selectedPageId: selectedPageId !== null && pages[selectedPageId] ? selectedPageId : null,
    }
  } catch {
    return initialState
  }
}
