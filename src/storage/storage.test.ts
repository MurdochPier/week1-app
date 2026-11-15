import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialState } from '../state/reducer'
import type { AppState } from '../types'
import { loadState, saveState, STORAGE_KEY } from './storage'

const sample: AppState = {
  pages: {
    a: { id: 'a', title: 'A', parentId: null, blocks: [], createdAt: 1, updatedAt: 2 },
    b: {
      id: 'b',
      title: 'B',
      parentId: 'a',
      blocks: [{ id: 'x', type: 'todo', text: 'do it', checked: true }],
      createdAt: 3,
      updatedAt: 4,
    },
  },
  selectedPageId: 'b',
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saving and then loading gives back the same state', () => {
    saveState(sample)
    expect(loadState()).toEqual(sample)
  })

  it('missing data falls back to the default state', () => {
    expect(loadState()).toEqual(initialState)
  })

  it('invalid JSON falls back to the default state', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadState()).toEqual(initialState)
  })

  it('a different version falls back to the default state', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, state: sample }))
    expect(loadState()).toEqual(initialState)
  })

  it.each([
    ['null', null],
    ['an array', []],
    ['no pages', { version: 1, state: { selectedPageId: null } }],
    ['a broken page', { version: 1, state: { pages: { a: { id: 'a' } }, selectedPageId: null } }],
    ['a bad selectedPageId', { version: 1, state: { pages: {}, selectedPageId: 42 } }],
  ])('wrong shape (%s) falls back to the default state', (_label, data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    expect(loadState()).toEqual(initialState)
  })

  it('a selectedPageId pointing to a missing page becomes null', () => {
    saveState({ ...sample, selectedPageId: 'gone' })
    expect(loadState()).toEqual({ ...sample, selectedPageId: null })
  })

  it('saving does not throw when storage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => saveState(sample)).not.toThrow()
    expect(warn).toHaveBeenCalled()
  })
})
