import { useCallback, useId, useLayoutEffect, useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { LIST_TYPES } from '../lib/blocks'
import { getCaretOffset } from '../lib/caret'
import type { Block as BlockData, BlockType } from '../types'

const PLACEHOLDERS: Record<BlockType, string> = {
  text: 'Type something…',
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
    onChange(readText())
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
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
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
    </div>
  )
}

export default Block
