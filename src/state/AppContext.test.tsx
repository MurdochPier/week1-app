import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as storage from '../storage/storage'
import { AppProvider, SAVE_DELAY_MS } from './AppContext'
import { addPage } from './reducer'
import { useApp } from './useApp'

function setup() {
  const save = vi.spyOn(storage, 'saveState')
  const { result, unmount } = renderHook(() => useApp(), { wrapper: AppProvider })
  // Let the save of the initial state happen, then start counting from zero.
  act(() => vi.advanceTimersByTime(SAVE_DELAY_MS))
  save.mockClear()
  const dispatch = (action: ReturnType<typeof addPage>) => act(() => result.current.dispatch(action))
  return { save, dispatch, unmount }
}

describe('AppProvider saving', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('saves only after changes stop for the delay', () => {
    const { save, dispatch } = setup()

    dispatch(addPage())
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS - 50))
    dispatch(addPage()) // restarts the wait
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS - 50))
    expect(save).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(50))
    expect(save).toHaveBeenCalledOnce()
    expect(Object.keys(save.mock.calls[0][0].pages)).toHaveLength(2)
  })

  it('saves right away when unmounted', () => {
    const { save, dispatch, unmount } = setup()

    dispatch(addPage())
    expect(save).not.toHaveBeenCalled()

    unmount()
    expect(save).toHaveBeenCalledOnce()
  })

  it('saves right away when the browser tab is hidden', () => {
    const { save, dispatch } = setup()

    dispatch(addPage())
    window.dispatchEvent(new Event('pagehide'))
    expect(save).toHaveBeenCalledOnce()
  })

  it('does not save again on unmount when nothing changed', () => {
    const { save, unmount } = setup()
    unmount()
    expect(save).not.toHaveBeenCalled()
  })
})
