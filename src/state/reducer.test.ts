import { describe, expect, it } from 'vitest'
import type { AppState } from '../types'
import type { PageAction } from './reducer'
import { addPage, initialState, reducer, renamePage } from './reducer'

function run(state: AppState, ...actions: PageAction[]): AppState {
  return actions.reduce(reducer, state)
}

const add = (id: string, parentId: string | null = null, now = 0): PageAction => ({
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
