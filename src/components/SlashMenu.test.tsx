import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { SLASH_COMMANDS } from '../lib/slashCommands'
import { saveState } from '../storage/storage'
import type { Block } from '../types'

function setup(blocks: Block[] = [{ id: 'a', type: 'text', text: '' }]) {
  saveState({
    pages: { p: { id: 'p', title: 'Page', parentId: null, blocks, createdAt: 1, updatedAt: 1 } },
    selectedPageId: 'p',
  })
  const user = userEvent.setup()
  render(<App />)
  return { user }
}

const main = () => screen.getByRole('main')
const editables = () => Array.from(main().querySelectorAll<HTMLElement>('.block-content'))
const blockTypes = () =>
  Array.from(main().querySelectorAll('.block')).map((b) => b.getAttribute('data-type'))
const menu = () => screen.queryByRole('listbox', { name: 'Block types' })
const optionNames = () => screen.getAllByRole('option').map((o) => o.textContent)
const activeOption = () => screen.getByRole('option', { selected: true })

/** Clicks into the first block and types. */
async function typeInBlock(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(editables()[0])
  await user.keyboard(text)
}

describe('Slash menu', () => {
  it('"/" opens the menu with every command', async () => {
    const { user } = setup()
    expect(menu()).toBeNull()

    await typeInBlock(user, '/')

    expect(menu()).toBeInTheDocument()
    expect(optionNames()).toEqual(SLASH_COMMANDS.map((c) => c.label))
    expect(activeOption()).toHaveTextContent('Text')
  })

  it('typing "head" leaves only the headings', async () => {
    const { user } = setup()
    await typeInBlock(user, '/head')
    expect(optionNames()).toEqual(['Heading 1', 'Heading 2', 'Heading 3'])
  })

  it('ArrowDown then Enter changes the block type and clears the "/" text', async () => {
    const { user } = setup()
    await typeInBlock(user, '/head')

    await user.keyboard('{ArrowDown}')
    expect(activeOption()).toHaveTextContent('Heading 2')
    await user.keyboard('{Enter}')

    expect(menu()).toBeNull()
    expect(blockTypes()).toEqual(['h2'])
    expect(editables()[0]).toHaveTextContent('')
    expect(editables()[0]).toHaveFocus()
    expect(screen.getByRole('heading', { level: 2 })).toBe(editables()[0])
  })

  it('ArrowUp from the first item wraps to the last', async () => {
    const { user } = setup()
    await typeInBlock(user, '/')
    await user.keyboard('{ArrowUp}')
    expect(activeOption()).toHaveTextContent('To-do')
  })

  it('clicking an option picks it', async () => {
    const { user } = setup()
    await typeInBlock(user, '/')

    await user.click(screen.getByRole('option', { name: 'To-do' }))

    expect(blockTypes()).toEqual(['todo'])
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(editables()[0]).toHaveFocus()
  })

  it('Esc closes the menu, keeps the text, and Enter then works as normal', async () => {
    const { user } = setup()
    await typeInBlock(user, '/h')

    await user.keyboard('{Escape}')
    expect(menu()).toBeNull()
    expect(editables()[0]).toHaveTextContent('/h')

    await user.keyboard('1') // still closed while typing after Esc
    expect(menu()).toBeNull()

    await user.keyboard('{Enter}')
    expect(editables()).toHaveLength(2)
    expect(blockTypes()).toEqual(['text', 'text'])
  })

  it('typing a space closes the menu', async () => {
    const { user } = setup()
    await typeInBlock(user, '/to')
    expect(menu()).toBeInTheDocument()

    await user.keyboard(' ')
    expect(menu()).toBeNull()
  })

  it('shows "No results" when nothing matches, and Enter does nothing', async () => {
    const { user } = setup()
    await typeInBlock(user, '/zzz')

    expect(screen.getByText('No results')).toBeInTheDocument()
    await user.keyboard('{Enter}')

    expect(editables()).toHaveLength(1)
    expect(editables()[0]).toHaveTextContent('/zzz')
  })

  it('"/" in the middle of text does not open the menu', async () => {
    const { user } = setup([{ id: 'a', type: 'text', text: 'and' }])
    await user.click(editables()[0])
    await user.keyboard('/or')
    expect(menu()).toBeNull()
  })

  it('the menu only shows in the focused block', async () => {
    const { user } = setup([
      { id: 'a', type: 'text', text: '' },
      { id: 'b', type: 'text', text: 'other' },
    ])
    await typeInBlock(user, '/')
    expect(menu()).toBeInTheDocument()

    await user.click(editables()[1])
    expect(menu()).toBeNull()
  })
})
