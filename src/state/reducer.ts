import { getDescendants } from '../lib/tree'
import type { AppState, Page } from '../types'

export const initialState: AppState = { pages: {}, selectedPageId: null }

export type PageAction =
  | { type: 'addPage'; id: string; parentId: string | null; now: number }
  | { type: 'renamePage'; id: string; title: string; now: number }
  | { type: 'deletePage'; id: string }
  | { type: 'selectPage'; id: string }

// Action creators: these generate ids and timestamps so the reducer itself stays pure.
export const addPage = (parentId: string | null = null): PageAction => ({
  type: 'addPage',
  id: crypto.randomUUID(),
  parentId,
  now: Date.now(),
})

export const renamePage = (id: string, title: string): PageAction => ({
  type: 'renamePage',
  id,
  title,
  now: Date.now(),
})

export const deletePage = (id: string): PageAction => ({ type: 'deletePage', id })

export const selectPage = (id: string): PageAction => ({ type: 'selectPage', id })

function firstRootPageId(pages: Record<string, Page>): string | null {
  const roots = Object.values(pages)
    .filter((p) => p.parentId === null || !pages[p.parentId])
    .sort((a, b) => a.createdAt - b.createdAt)
  return roots[0]?.id ?? null
}

export function reducer(state: AppState, action: PageAction): AppState {
  switch (action.type) {
    case 'addPage': {
      const page: Page = {
        id: action.id,
        title: '',
        parentId: action.parentId,
        blocks: [],
        createdAt: action.now,
        updatedAt: action.now,
      }
      return { pages: { ...state.pages, [page.id]: page }, selectedPageId: page.id }
    }

    case 'renamePage': {
      const page = state.pages[action.id]
      if (!page) return state
      return {
        ...state,
        pages: { ...state.pages, [page.id]: { ...page, title: action.title, updatedAt: action.now } },
      }
    }

    case 'deletePage': {
      const page = state.pages[action.id]
      if (!page) return state
      const removed = new Set([page.id, ...getDescendants(state.pages, page.id)])
      const pages = Object.fromEntries(
        Object.entries(state.pages).filter(([id]) => !removed.has(id)),
      )

      let selectedPageId = state.selectedPageId
      if (selectedPageId !== null && removed.has(selectedPageId)) {
        selectedPageId =
          page.parentId !== null && pages[page.parentId] ? page.parentId : firstRootPageId(pages)
      }
      return { pages, selectedPageId }
    }

    case 'selectPage': {
      if (!state.pages[action.id]) return state
      return { ...state, selectedPageId: action.id }
    }
  }
}
