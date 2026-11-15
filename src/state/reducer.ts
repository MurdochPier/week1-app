import { getDescendants } from '../lib/tree'
import type { AppState, Block, BlockType, Page } from '../types'

export const initialState: AppState = { pages: {}, selectedPageId: null }

export type AppAction =
  | { type: 'addPage'; id: string; parentId: string | null; now: number }
  | { type: 'renamePage'; id: string; title: string; now: number }
  | { type: 'deletePage'; id: string }
  | { type: 'selectPage'; id: string }
  | { type: 'addBlock'; pageId: string; afterId: string | null; block: Block; now: number }
  | { type: 'updateBlock'; pageId: string; blockId: string; text: string; now: number }
  | { type: 'deleteBlock'; pageId: string; blockId: string; now: number }
  | {
      type: 'changeBlockType'
      pageId: string
      blockId: string
      blockType: BlockType
      now: number
    }
  | { type: 'toggleTodo'; pageId: string; blockId: string; now: number }
  | { type: 'moveBlock'; pageId: string; from: number; to: number; now: number }

// Action creators: these generate ids and timestamps so the reducer itself stays pure.
export const addPage = (parentId: string | null = null): AppAction => ({
  type: 'addPage',
  id: crypto.randomUUID(),
  parentId,
  now: Date.now(),
})

export const renamePage = (id: string, title: string): AppAction => ({
  type: 'renamePage',
  id,
  title,
  now: Date.now(),
})

export const deletePage = (id: string): AppAction => ({ type: 'deletePage', id })

export const selectPage = (id: string): AppAction => ({ type: 'selectPage', id })

export function newBlock(type: BlockType = 'text', text = ''): Block {
  const block: Block = { id: crypto.randomUUID(), type, text }
  if (type === 'todo') block.checked = false
  return block
}

export const addBlock = (pageId: string, afterId: string | null, block: Block): AppAction => ({
  type: 'addBlock',
  pageId,
  afterId,
  block,
  now: Date.now(),
})

export const updateBlock = (pageId: string, blockId: string, text: string): AppAction => ({
  type: 'updateBlock',
  pageId,
  blockId,
  text,
  now: Date.now(),
})

export const deleteBlock = (pageId: string, blockId: string): AppAction => ({
  type: 'deleteBlock',
  pageId,
  blockId,
  now: Date.now(),
})

export const changeBlockType = (
  pageId: string,
  blockId: string,
  blockType: BlockType,
): AppAction => ({ type: 'changeBlockType', pageId, blockId, blockType, now: Date.now() })

export const toggleTodo = (pageId: string, blockId: string): AppAction => ({
  type: 'toggleTodo',
  pageId,
  blockId,
  now: Date.now(),
})

/** Moves the block at index `from` to index `to` (for drag-and-drop). */
export const moveBlock = (pageId: string, from: number, to: number): AppAction => ({
  type: 'moveBlock',
  pageId,
  from,
  to,
  now: Date.now(),
})

function firstRootPageId(pages: Record<string, Page>): string | null {
  const roots = Object.values(pages)
    .filter((p) => p.parentId === null || !pages[p.parentId])
    .sort((a, b) => a.createdAt - b.createdAt)
  return roots[0]?.id ?? null
}

/** Returns a new state with the page's blocks replaced, or the same state if the page is missing. */
function withBlocks(
  state: AppState,
  pageId: string,
  now: number,
  change: (blocks: Block[]) => Block[] | null,
): AppState {
  const page = state.pages[pageId]
  if (!page) return state
  const blocks = change(page.blocks)
  if (blocks === null) return state
  return { ...state, pages: { ...state.pages, [pageId]: { ...page, blocks, updatedAt: now } } }
}

/** Applies `change` to one block; returns null (no change) if the block doesn't exist. */
function mapBlock(blocks: Block[], blockId: string, change: (b: Block) => Block): Block[] | null {
  if (!blocks.some((b) => b.id === blockId)) return null
  return blocks.map((b) => (b.id === blockId ? change(b) : b))
}

export function reducer(state: AppState, action: AppAction): AppState {
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

    case 'addBlock':
      return withBlocks(state, action.pageId, action.now, (blocks) => {
        if (action.afterId === null) return [action.block, ...blocks]
        const index = blocks.findIndex((b) => b.id === action.afterId)
        if (index === -1) return null
        return [...blocks.slice(0, index + 1), action.block, ...blocks.slice(index + 1)]
      })

    case 'updateBlock':
      return withBlocks(state, action.pageId, action.now, (blocks) =>
        mapBlock(blocks, action.blockId, (b) => ({ ...b, text: action.text })),
      )

    case 'deleteBlock':
      return withBlocks(state, action.pageId, action.now, (blocks) =>
        blocks.some((b) => b.id === action.blockId)
          ? blocks.filter((b) => b.id !== action.blockId)
          : null,
      )

    case 'changeBlockType':
      return withBlocks(state, action.pageId, action.now, (blocks) =>
        mapBlock(blocks, action.blockId, (b) => {
          const changed: Block = { id: b.id, type: action.blockType, text: b.text }
          if (action.blockType === 'todo') changed.checked = b.checked ?? false
          return changed
        }),
      )

    case 'toggleTodo':
      return withBlocks(state, action.pageId, action.now, (blocks) =>
        mapBlock(blocks, action.blockId, (b) => ({ ...b, checked: !b.checked })),
      )

    case 'moveBlock':
      return withBlocks(state, action.pageId, action.now, (blocks) => {
        const { from, to } = action
        const inRange = (i: number) => Number.isInteger(i) && i >= 0 && i < blocks.length
        if (from === to || !inRange(from) || !inRange(to)) return null
        const moved = [...blocks]
        const [block] = moved.splice(from, 1)
        moved.splice(to, 0, block)
        return moved
      })
  }
}
