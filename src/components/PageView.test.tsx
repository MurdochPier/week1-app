import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { saveState } from '../storage/storage'
import type { AppState, Block } from '../types'

function stateWith(blocks: Block[], title = 'Notes page'): AppState {
  return {
    pages: { p: { id: 'p', title, parentId: null, blocks, createdAt: 1, updatedAt: 1 } },
    selectedPageId: 'p',
  }
}

const text = (id: string, value: string, type: Block['type'] = 'text'): Block => ({
  id,
  type,
  text: value,
})

function setup(state: AppState) {
  saveState(state)
  const user = userEvent.setup()
  const utils = render(<App />)
  return { user, ...utils }
}

const main = () => screen.getByRole('main')
const editables = () => Array.from(main().querySelectorAll<HTMLElement>('.block-content'))
const blockTexts = () => editables().map((el) => el.textContent)

function setCaret(el: HTMLElement, offset: number) {
  el.focus()
  const range = document.createRange()
  range.setStart(el.firstChild ?? el, offset)
  range.collapse(true)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
}

describe('PageView', () => {
  it('editing the title updates the sidebar', async () => {
    const { user } = setup(stateWith([]))
    const title = screen.getByRole('textbox', { name: 'Page title' })

    await user.clear(title)
    await user.type(title, 'Groceries')

    const sidebar = screen.getByRole('navigation', { name: 'Pages' })
    expect(within(sidebar).getByRole('button', { name: 'Groceries' })).toBeInTheDocument()
  })

  it('Enter splits a block into two at the cursor and focuses the new one', async () => {
    const { user } = setup(stateWith([text('a', 'helloworld')]))

    setCaret(editables()[0], 5)
    await user.keyboard('{Enter}')

    expect(blockTexts()).toEqual(['hello', 'world'])
    expect(editables()[1]).toHaveFocus()
  })

  it('Enter in a bullet continues the list', async () => {
    const { user } = setup(stateWith([text('a', 'one', 'bullet')]))

    setCaret(editables()[0], 3)
    await user.keyboard('{Enter}')

    const types = Array.from(main().querySelectorAll('.block')).map((b) => b.getAttribute('data-type'))
    expect(types).toEqual(['bullet', 'bullet'])
  })

  it('Backspace on an empty block removes it and focuses the one above', async () => {
    const { user } = setup(stateWith([text('a', 'first'), text('b', '')]))

    setCaret(editables()[1], 0)
    await user.keyboard('{Backspace}')

    expect(blockTexts()).toEqual(['first'])
    expect(editables()[0]).toHaveFocus()
  })

  it('Backspace on the only empty block keeps it', async () => {
    const { user } = setup(stateWith([text('a', '')]))

    setCaret(editables()[0], 0)
    await user.keyboard('{Backspace}')

    expect(editables()).toHaveLength(1)
  })

  it('typing in a block updates it', async () => {
    const { user } = setup(stateWith([text('a', '')]))

    await user.click(editables()[0])
    await user.keyboard('Hello')

    expect(blockTexts()).toEqual(['Hello'])
  })

  it('"+ Add a block" adds an empty block and focuses it', async () => {
    const { user } = setup(stateWith([text('a', 'first')]))

    await user.click(screen.getByRole('button', { name: '+ Add a block' }))

    expect(blockTexts()).toEqual(['first', ''])
    expect(editables()[1]).toHaveFocus()
  })

  it('Enter in the title of an empty page creates the first block', async () => {
    const { user } = setup(stateWith([]))

    await user.click(screen.getByRole('textbox', { name: 'Page title' }))
    await user.keyboard('{Enter}')

    expect(editables()).toHaveLength(1)
    expect(editables()[0]).toHaveFocus()
  })

  it('numbered blocks count up and restart after another block', () => {
    setup(
      stateWith([
        text('a', 'x', 'numbered'),
        text('b', 'y', 'numbered'),
        text('c', 'break'),
        text('d', 'z', 'numbered'),
      ]),
    )
    const markers = Array.from(main().querySelectorAll('.block-marker')).map((m) => m.textContent)
    expect(markers).toEqual(['1.', '2.', '1.'])
  })

  it('toggling a todo checks it', async () => {
    const { user } = setup(stateWith([{ id: 'a', type: 'todo', text: 'Milk', checked: false }]))

    await user.click(screen.getByRole('checkbox', { name: 'Milk' }))

    expect(screen.getByRole('checkbox', { name: 'Milk' })).toBeChecked()
  })

  it('blocks still show after a reload', async () => {
    const { user, unmount } = setup(stateWith([text('a', '')]))

    await user.click(editables()[0])
    await user.keyboard('Remember me')
    unmount()
    render(<App />)

    expect(blockTexts()).toEqual(['Remember me'])
  })
})
