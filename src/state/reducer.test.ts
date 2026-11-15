import { describe, expect, it } from 'vitest'
import type { AppState, Block } from '../types'
import type { AppAction } from './reducer'
import { addPage, initialState, newBlock, reducer, renamePage } from './reducer'

function run(state: AppState, ...actions: AppAction[]): AppState {
  return actions.reduce(reducer, state)
}

const add = (id: string, parentId: string | null = null, now = 0): AppAction => ({
  type: 'addPage',
  id,
  parentId,
  now,
})

describe('reducer: pages', () => {
  it('adding a page creates it with the right parentId and selects it', () => {
    const state = run(initialState, add('root'), add('child', 'root', 5))

    expect(state.pages.child).toEqual({
      id: 'child',
      title: '',
      parentId: 'root',
      blocks: [],
      createdAt: 5,
      updatedAt: 5,
    })
    expect(state.pages.root.parentId).toBeNull()
    expect(state.selectedPageId).toBe('child')
  })

  it('renaming updates the title and updatedAt', () => {
    const state = run(initialState, add('a', null, 1), {
      type: 'renamePage',
      id: 'a',
      title: 'Hello',
      now: 99,
    })

    expect(state.pages.a.title).toBe('Hello')
    expect(state.pages.a.updatedAt).toBe(99)
    expect(state.pages.a.createdAt).toBe(1)
  })

  it('deleting a page also removes all of its sub-pages', () => {
    const state = run(
      initialState,
      add('a'),
      add('b', 'a'),
      add('c', 'b'),
      add('other'),
      { type: 'deletePage', id: 'a' },
    )
    expect(Object.keys(state.pages)).toEqual(['other'])
  })

  it('deleting the selected page moves selection to its parent', () => {
    const state = run(initialState, add('a'), add('b', 'a'), { type: 'deletePage', id: 'b' })
    expect(state.selectedPageId).toBe('a')
  })

  it('deleting the selected root page moves selection to the first remaining root', () => {
    const state = run(
      initialState,
      add('first', null, 1),
      add('second', null, 2),
      add('third', null, 3),
      { type: 'selectPage', id: 'second' },
      { type: 'deletePage', id: 'second' },
    )
    expect(state.selectedPageId).toBe('first')
  })

  it('deleting an ancestor of the selected page moves selection', () => {
    const state = run(
      initialState,
      add('keep', null, 1),
      add('a', null, 2),
      add('b', 'a', 3),
      { type: 'deletePage', id: 'a' },
    )
    expect(state.selectedPageId).toBe('keep')
  })

  it('deleting the last page clears the selection', () => {
    const state = run(initialState, add('a'), { type: 'deletePage', id: 'a' })
    expect(state).toEqual({ pages: {}, selectedPageId: null })
  })

  it('deleting an unselected page keeps the selection', () => {
    const state = run(initialState, add('a'), add('b'), { type: 'deletePage', id: 'a' })
    expect(state.selectedPageId).toBe('b')
  })

  it('selecting a page sets selectedPageId', () => {
    const state = run(initialState, add('a'), add('b'), { type: 'selectPage', id: 'a' })
    expect(state.selectedPageId).toBe('a')
  })

  it('unknown ids leave the state unchanged', () => {
    const state = run(initialState, add('a'))
    expect(reducer(state, { type: 'renamePage', id: 'x', title: 't', now: 1 })).toBe(state)
    expect(reducer(state, { type: 'deletePage', id: 'x' })).toBe(state)
    expect(reducer(state, { type: 'selectPage', id: 'x' })).toBe(state)
  })

  it('never mutates the input state', () => {
    const state = run(initialState, add('a'), add('b', 'a'))
    const snapshot = structuredClone(state)

    reducer(state, add('c'))
    reducer(state, { type: 'renamePage', id: 'a', title: 'new', now: 9 })
    reducer(state, { type: 'deletePage', id: 'a' })
    reducer(state, { type: 'selectPage', id: 'a' })

    expect(state).toEqual(snapshot)
  })
})

describe('action creators', () => {
  it('addPage generates a unique id and timestamp', () => {
    const one = addPage()
    const two = addPage('parent')
    expect(one).toMatchObject({ type: 'addPage', parentId: null })
    expect(two).toMatchObject({ type: 'addPage', parentId: 'parent' })
    expect(one.type === 'addPage' && two.type === 'addPage' && one.id !== two.id).toBe(true)
  })

  it('renamePage includes the current time', () => {
    const action = renamePage('a', 'Title')
    expect(action).toMatchObject({ type: 'renamePage', id: 'a', title: 'Title' })
    expect(action.type === 'renamePage' && typeof action.now).toBe('number')
  })
})

describe('reducer: blocks', () => {
  const block = (id: string, text = id, type: Block['type'] = 'text'): Block => ({ id, type, text })

  /** A state with page "p" holding blocks a, b, c. */
  function withBlocks(...blocks: Block[]): AppState {
    const state = run(initialState, add('p', null, 0))
    return { ...state, pages: { p: { ...state.pages.p, blocks } } }
  }

  const ids = (state: AppState) => state.pages.p.blocks.map((b) => b.id)

  it('add inserts the block after the right one', () => {
    const state = reducer(withBlocks(block('a'), block('b')), {
      type: 'addBlock',
      pageId: 'p',
      afterId: 'a',
      block: block('new'),
      now: 1,
    })
    expect(ids(state)).toEqual(['a', 'new', 'b'])
  })

  it('add with afterId null inserts at the start', () => {
    const state = reducer(withBlocks(block('a')), {
      type: 'addBlock',
      pageId: 'p',
      afterId: null,
      block: block('new'),
      now: 1,
    })
    expect(ids(state)).toEqual(['new', 'a'])
  })

  it('update changes its text', () => {
    const state = reducer(withBlocks(block('a'), block('b')), {
      type: 'updateBlock',
      pageId: 'p',
      blockId: 'b',
      text: 'hello',
      now: 1,
    })
    expect(state.pages.p.blocks.map((b) => b.text)).toEqual(['a', 'hello'])
  })

  it('delete removes it', () => {
    const state = reducer(withBlocks(block('a'), block('b'), block('c')), {
      type: 'deleteBlock',
      pageId: 'p',
      blockId: 'b',
      now: 1,
    })
    expect(ids(state)).toEqual(['a', 'c'])
  })

  it('changing the type keeps the text', () => {
    const state = reducer(withBlocks(block('a', 'Title')), {
      type: 'changeBlockType',
      pageId: 'p',
      blockId: 'a',
      blockType: 'h1',
      now: 1,
    })
    expect(state.pages.p.blocks[0]).toEqual({ id: 'a', type: 'h1', text: 'Title' })
  })

  it('changing to todo starts unchecked, and leaving todo drops checked', () => {
    const toTodo = reducer(withBlocks(block('a')), {
      type: 'changeBlockType',
      pageId: 'p',
      blockId: 'a',
      blockType: 'todo',
      now: 1,
    })
    expect(toTodo.pages.p.blocks[0].checked).toBe(false)

    const fromTodo = reducer(withBlocks({ ...block('a', 'x', 'todo'), checked: true }), {
      type: 'changeBlockType',
      pageId: 'p',
      blockId: 'a',
      blockType: 'bullet',
      now: 1,
    })
    expect(fromTodo.pages.p.blocks[0]).not.toHaveProperty('checked')
  })

  it('toggling a todo flips checked', () => {
    const start = withBlocks({ ...block('a', 'x', 'todo'), checked: false })
    const toggle: AppAction = { type: 'toggleTodo', pageId: 'p', blockId: 'a', now: 1 }

    const once = reducer(start, toggle)
    expect(once.pages.p.blocks[0].checked).toBe(true)
    expect(reducer(once, toggle).pages.p.blocks[0].checked).toBe(false)
  })

  it('every block action bumps the page updatedAt', () => {
    const start = withBlocks(block('a'))
    const actions: AppAction[] = [
      { type: 'addBlock', pageId: 'p', afterId: 'a', block: block('b'), now: 50 },
      { type: 'updateBlock', pageId: 'p', blockId: 'a', text: 't', now: 50 },
      { type: 'deleteBlock', pageId: 'p', blockId: 'a', now: 50 },
      { type: 'changeBlockType', pageId: 'p', blockId: 'a', blockType: 'h2', now: 50 },
      { type: 'toggleTodo', pageId: 'p', blockId: 'a', now: 50 },
    ]
    for (const action of actions) {
      expect(reducer(start, action).pages.p.updatedAt).toBe(50)
    }
  })

  it('unknown page or block ids leave the state unchanged', () => {
    const start = withBlocks(block('a'))
    const actions: AppAction[] = [
      { type: 'addBlock', pageId: 'nope', afterId: null, block: block('b'), now: 1 },
      { type: 'addBlock', pageId: 'p', afterId: 'nope', block: block('b'), now: 1 },
      { type: 'updateBlock', pageId: 'p', blockId: 'nope', text: 't', now: 1 },
      { type: 'deleteBlock', pageId: 'p', blockId: 'nope', now: 1 },
      { type: 'changeBlockType', pageId: 'p', blockId: 'nope', blockType: 'h1', now: 1 },
      { type: 'toggleTodo', pageId: 'nope', blockId: 'a', now: 1 },
    ]
    for (const action of actions) {
      expect(reducer(start, action)).toBe(start)
    }
  })

  it('newBlock creates todos unchecked and other types without checked', () => {
    expect(newBlock('todo', 'x')).toMatchObject({ type: 'todo', text: 'x', checked: false })
    expect(newBlock()).not.toHaveProperty('checked')
  })
})

describe('reducer: moveBlock', () => {
  const block = (id: string): Block => ({ id, type: 'text', text: id })

  function pageWith(...blockIds: string[]): AppState {
    const state = run(initialState, add('p', null, 0))
    return { ...state, pages: { p: { ...state.pages.p, blocks: blockIds.map(block) } } }
  }

  const move = (state: AppState, from: number, to: number, pageId = 'p') =>
    reducer(state, { type: 'moveBlock', pageId, from, to, now: 77 })

  const ids = (state: AppState) => state.pages.p.blocks.map((b) => b.id)

  it('moves a block down', () => {
    expect(ids(move(pageWith('a', 'b', 'c', 'd'), 0, 2))).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves a block up', () => {
    expect(ids(move(pageWith('a', 'b', 'c', 'd'), 3, 1))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('moves a block to the first and last position', () => {
    expect(ids(move(pageWith('a', 'b', 'c'), 2, 0))).toEqual(['c', 'a', 'b'])
    expect(ids(move(pageWith('a', 'b', 'c'), 0, 2))).toEqual(['b', 'c', 'a'])
  })

  it('bumps updatedAt when a block moves', () => {
    expect(move(pageWith('a', 'b'), 0, 1).pages.p.updatedAt).toBe(77)
  })

  it('dropping in the same spot leaves the state unchanged', () => {
    const state = pageWith('a', 'b', 'c')
    expect(move(state, 1, 1)).toBe(state)
  })

  it('bad indexes or an unknown page leave the state unchanged', () => {
    const state = pageWith('a', 'b', 'c')
    expect(move(state, -1, 0)).toBe(state)
    expect(move(state, 0, 3)).toBe(state)
    expect(move(state, 1.5, 0)).toBe(state)
    expect(move(state, 0, 1, 'nope')).toBe(state)
  })
})
