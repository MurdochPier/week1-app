import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Block as BlockData, BlockType } from '../types'
import type { BlockProps } from './Block'
import Block from './Block'

function setup(block: Partial<BlockData> = {}, props: Partial<BlockProps> = {}) {
  const callbacks = {
    onChange: vi.fn(),
    onSplit: vi.fn(),
    onDeleteEmpty: vi.fn(),
    onChangeType: vi.fn(),
    onToggle: vi.fn(),
  }
  const data: BlockData = { id: 'b1', type: 'text', text: '', ...block }
  const user = userEvent.setup()
  const { container } = render(<Block block={data} {...callbacks} {...props} />)
  const editable = container.querySelector<HTMLElement>('.block-content')!
  return { user, editable, container, ...callbacks }
}

/** Puts the cursor `offset` characters into the editable element. */
function setCaret(el: HTMLElement, offset: number) {
  el.focus()
  const range = document.createRange()
  range.setStart(el.firstChild ?? el, offset)
  range.collapse(true)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
}

describe('Block', () => {
  it.each<[BlockType, string]>([
    ['text', 'P'],
    ['h1', 'H1'],
    ['h2', 'H2'],
    ['h3', 'H3'],
    ['bullet', 'P'],
    ['numbered', 'P'],
    ['todo', 'P'],
  ])('a %s block renders a <%s> with the text', (type, tag) => {
    const { editable, container } = setup({ type, text: 'Hello' })
    expect(editable.tagName).toBe(tag)
    expect(editable).toHaveTextContent('Hello')
    expect(container.querySelector(`[data-type="${type}"]`)).not.toBeNull()
  })

  it('headings are real headings', () => {
    setup({ type: 'h2', text: 'Section' })
    expect(screen.getByRole('heading', { level: 2, name: 'Section' })).toBeInTheDocument()
  })

  it('bullets show a dot and numbered blocks show their number', () => {
    const { container } = setup({ type: 'bullet' })
    expect(container.querySelector('.block-marker')).toHaveTextContent('•')

    const numbered = setup({ type: 'numbered' }, { number: 3 })
    expect(numbered.container.querySelector('.block-marker')).toHaveTextContent('3.')
  })

  it('typing calls onChange with the new text', async () => {
    const { user, editable, onChange } = setup()
    await user.click(editable)
    await user.keyboard('hi')
    expect(onChange).toHaveBeenLastCalledWith('hi')
  })

  it('Enter calls onSplit with the cursor offset', async () => {
    const { user, editable, onSplit } = setup({ text: 'hello' })
    setCaret(editable, 2)
    await user.keyboard('{Enter}')
    expect(onSplit).toHaveBeenCalledWith(2)
    expect(editable).toHaveTextContent('hello') // the Enter itself doesn't change the text
  })

  it('Enter on an empty list item turns it into plain text instead of splitting', async () => {
    const { user, editable, onSplit, onChangeType } = setup({ type: 'bullet' })
    setCaret(editable, 0)
    await user.keyboard('{Enter}')
    expect(onChangeType).toHaveBeenCalledWith('text')
    expect(onSplit).not.toHaveBeenCalled()
  })

  it('Enter on an empty text block still splits', async () => {
    const { user, editable, onSplit } = setup()
    setCaret(editable, 0)
    await user.keyboard('{Enter}')
    expect(onSplit).toHaveBeenCalledWith(0)
  })

  it('Backspace on an empty block calls onDeleteEmpty', async () => {
    const { user, editable, onDeleteEmpty } = setup()
    setCaret(editable, 0)
    await user.keyboard('{Backspace}')
    expect(onDeleteEmpty).toHaveBeenCalledOnce()
  })

  it('Backspace on a block with text does not delete it', async () => {
    const { user, editable, onDeleteEmpty } = setup({ text: 'ab' })
    setCaret(editable, 2)
    await user.keyboard('{Backspace}')
    expect(onDeleteEmpty).not.toHaveBeenCalled()
  })

  it('Shift+Enter inserts a line break instead of splitting', async () => {
    const { user, editable, onSplit, onChange } = setup({ text: 'ab' })
    setCaret(editable, 1)
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(onSplit).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenLastCalledWith('a\nb')
  })

  it('pasting inserts plain text only, even when the clipboard has HTML', () => {
    const { editable, onChange } = setup({ text: '' })
    setCaret(editable, 0)
    const clipboard: Record<string, string> = { 'text/html': '<b>bold</b>', 'text/plain': 'bold' }

    fireEvent.paste(editable, { clipboardData: { getData: (type: string) => clipboard[type] ?? '' } })

    expect(editable.innerHTML).toBe('bold')
    expect(onChange).toHaveBeenLastCalledWith('bold')
  })

  it('clicking a todo checkbox calls onToggle', async () => {
    const { user, onToggle } = setup({ type: 'todo', text: 'Buy milk', checked: false })
    const checkbox = screen.getByRole('checkbox', { name: 'Buy milk' })
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('a checked todo shows a ticked checkbox', () => {
    setup({ type: 'todo', text: 'Done', checked: true })
    expect(screen.getByRole('checkbox', { name: 'Done' })).toBeChecked()
  })
})
