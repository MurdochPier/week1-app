import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { LIST_TYPES } from '../lib/blocks'
import { getCaretOffset } from '../lib/caret'
import { filterCommands, optionId } from '../lib/slashCommands'
import type { Block as BlockData, BlockType } from '../types'
import SlashMenu from './SlashMenu'

/** "/" at the start, then no spaces: the text after the slash is the menu's search query. */
const SLASH_QUERY = /^\/(\S*)$/

const PLACEHOLDERS: Record<BlockType, string> = {
  text: "Type '/' for commands",
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bullet: 'List',
  numbered: 'List',
  todo: 'To-do',
}

export interface BlockProps {
  block: BlockData
  /** Position in a run of numbered blocks (1, 2, 3…). Only used by numbered blocks. */
  number?: number
  onChange: (text: string) => void
  /** Enter was pressed; `offset` is where the cursor was. */
  onSplit: (offset: number) => void
  onDeleteEmpty: () => void
  onChangeType: (type: BlockType) => void
  onToggle: () => void
}

function Block({
  block,
  number = 1,
  onChange,
  onSplit,
  onDeleteEmpty,
  onChangeType,
  onToggle,
}: BlockProps) {
  const ref = useRef<HTMLElement | null>(null)
  const textId = useId()
  const menuId = useId()

  // Slash menu: open while this block is focused, its text is "/query", and Esc hasn't closed it.
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [active, setActive] = useState({ query: '', index: 0 })
  const slashMatch = SLASH_QUERY.exec(block.text)
  const query = slashMatch?.[1] ?? ''
  const menuOpen = slashMatch !== null && focused && !dismissed
  const commands = menuOpen ? filterCommands(query) : []
  // The highlight goes back to the first item whenever the query changes.
  const activeIndex = active.query === query ? active.index : 0

  const selectCommand = (type: BlockType) => {
    onChange('') // remove the "/query" text
    onChangeType(type)
  }

  /** Handles keys while the menu is open. Returns true if the key was used. */
  const handleMenuKey = (e: KeyboardEvent<HTMLElement>): boolean => {
    const count = commands.length
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault()
        if (count > 0) {
          const step = e.key === 'ArrowDown' ? 1 : -1
          setActive({ query, index: (activeIndex + step + count) % count })
        }
        return true
      }
      case 'Enter':
        if (e.shiftKey) return false
        e.preventDefault()
        if (count > 0) selectCommand(commands[activeIndex].type)
        return true
      case 'Escape':
        e.preventDefault()
        setDismissed(true)
        return true
      default:
        return false
    }
  }

  // A callback ref, because the tag changes with the block type (p, h1, h2, h3).
  const setRef = useCallback((el: HTMLElement | null) => {
    ref.current = el
  }, [])

  // The editable text is "uncontrolled": we only write to the DOM when the stored text differs
  // from what's on screen (e.g. after a split). Writing on every keystroke would reset the cursor.
  useLayoutEffect(() => {
    const el = ref.current
    if (el && el.textContent !== block.text) el.textContent = block.text
  }, [block.text, block.type])

  const readText = () => ref.current?.textContent ?? ''

  const handleInput = () => {
    const el = ref.current
    if (!el) return
    // Browsers can leave a stray <br> behind when everything is deleted; clear it so :empty works.
    if (el.textContent === '' && el.innerHTML !== '') el.innerHTML = ''
    const text = readText()
    // Once the "/" is gone, a new "/" may open the menu again.
    if (!text.startsWith('/')) setDismissed(false)
    onChange(text)
  }

  /** Replaces the selection with plain text and puts the cursor after it. */
  const insertPlainText = (text: string) => {
    const selection = window.getSelection()
    if (!text || !selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const node = document.createTextNode(text)
    range.insertNode(node)
    range.setStartAfter(node)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    handleInput()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && e.nativeEvent.isComposing) return // typing with an IME (e.g. Japanese)
    if (menuOpen && handleMenuKey(e)) return

    // Shift+Enter: a line break inside the block. Browsers would insert a <br>, which
    // textContent ignores, so insert a real "\n" character instead.
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      insertPlainText('\n')
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (readText() === '' && LIST_TYPES.has(block.type)) {
        onChangeType('text')
        return
      }
      onSplit(ref.current ? getCaretOffset(ref.current) : readText().length)
      return
    }

    if (e.key === 'Backspace' && readText() === '') {
      e.preventDefault()
      onDeleteEmpty()
      return
    }

    // No rich formatting (bold/italic/underline) — blocks are plain text.
    if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
      e.preventDefault()
    }
  }

  // Paste as plain text only, so no HTML/links/styles sneak in.
  const handlePaste = (e: ClipboardEvent<HTMLElement>) => {
    e.preventDefault()
    insertPlainText(e.clipboardData.getData('text/plain'))
  }

  const Tag = block.type === 'h1' || block.type === 'h2' || block.type === 'h3' ? block.type : 'p'

  const editable = (
    <Tag
      ref={setRef}
      id={textId}
      className="block-content"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder={PLACEHOLDERS[block.type]}
      aria-controls={menuOpen && commands.length > 0 ? menuId : undefined}
      aria-activedescendant={
        menuOpen && commands.length > 0 ? optionId(menuId, activeIndex) : undefined
      }
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )

  return (
    <div className={`block block-${block.type}${block.checked ? ' checked' : ''}`} data-type={block.type}
      data-block-id={block.id}
    >
      {block.type === 'bullet' && (
        <span className="block-marker" aria-hidden="true">
          •
        </span>
      )}
      {block.type === 'numbered' && (
        <span className="block-marker" aria-hidden="true">
          {number}.
        </span>
      )}
      {block.type === 'todo' && (
        <input
          type="checkbox"
          className="block-checkbox"
          checked={block.checked ?? false}
          onChange={onToggle}
          aria-labelledby={block.text ? textId : undefined}
          aria-label={block.text ? undefined : 'To-do'}
        />
      )}
      {editable}
      {menuOpen && (
        <SlashMenu
          id={menuId}
          commands={commands}
          activeIndex={activeIndex}
          onSelect={selectCommand}
          onHover={(index) => setActive({ query, index })}
        />
      )}
    </div>
  )
}

export default Block
