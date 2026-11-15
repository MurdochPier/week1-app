import { useLayoutEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { LIST_TYPES, listNumbers } from '../lib/blocks'
import { placeCaret } from '../lib/caret'
import {
  addBlock,
  changeBlockType,
  deleteBlock,
  newBlock,
  renamePage,
  toggleTodo,
  updateBlock,
} from '../state/reducer'
import { useApp } from '../state/useApp'
import type { Block as BlockData, Page } from '../types'
import Block from './Block'
import { UNTITLED } from './PageTreeItem'
import './PageView.css'

interface FocusRequest {
  id: string
  where: 'start' | 'end'
}

function PageView({ page }: { page: Page }) {
  const { dispatch } = useApp()
  const blocksRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<FocusRequest | null>(null)
  const numbers = listNumbers(page.blocks)

  /** The editable element of a block, found by its data-block-id. */
  const editableFor = (id: string) =>
    blocksRef.current?.querySelector<HTMLElement>(
      `[data-block-id="${CSS.escape(id)}"] .block-content`,
    ) ?? null

  // After a render, move the cursor to a block if an action asked for it (new block, deleted block…).
  useLayoutEffect(() => {
    const request = pendingFocus.current
    if (!request) return
    const el = editableFor(request.id)
    if (el) {
      placeCaret(el, request.where)
      pendingFocus.current = null
    }
  })

  const insertBlockAfter = (afterId: string | null, block: BlockData) => {
    dispatch(addBlock(page.id, afterId, block))
    pendingFocus.current = { id: block.id, where: 'start' }
  }

  const handleSplit = (block: BlockData, offset: number) => {
    const before = block.text.slice(0, offset)
    const after = block.text.slice(offset)
    if (before !== block.text) dispatch(updateBlock(page.id, block.id, before))
    insertBlockAfter(block.id, newBlock(LIST_TYPES.has(block.type) ? block.type : 'text', after))
  }

  const handleDeleteEmpty = (index: number) => {
    if (index === 0) return
    const previous = page.blocks[index - 1]
    dispatch(deleteBlock(page.id, page.blocks[index].id))
    pendingFocus.current = { id: previous.id, where: 'end' }
  }

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    e.preventDefault()
    const first = page.blocks[0]
    if (first) {
      const el = editableFor(first.id)
      if (el) placeCaret(el, 'start')
    } else {
      insertBlockAfter(null, newBlock())
    }
  }

  const lastBlock = page.blocks.at(-1)

  return (
    <article className="page-view">
      <input
        className="page-title-input"
        aria-label="Page title"
        placeholder={UNTITLED}
        value={page.title}
        onChange={(e) => dispatch(renamePage(page.id, e.target.value))}
        onKeyDown={handleTitleKeyDown}
      />
      <div className="blocks" ref={blocksRef}>
        {page.blocks.map((block, index) => (
          <Block
            key={block.id}
            block={block}
            number={numbers[index]}
            onChange={(text) => dispatch(updateBlock(page.id, block.id, text))}
            onSplit={(offset) => handleSplit(block, offset)}
            onDeleteEmpty={() => handleDeleteEmpty(index)}
            onChangeType={(type) => {
              dispatch(changeBlockType(page.id, block.id, type))
              // A heading uses a different element (<h1> vs <p>), so put the cursor back.
              pendingFocus.current = { id: block.id, where: 'end' }
            }}
            onToggle={() => dispatch(toggleTodo(page.id, block.id))}
          />
        ))}
      </div>
      <button
        type="button"
        className="add-block-button"
        onClick={() => insertBlockAfter(lastBlock?.id ?? null, newBlock())}
      >
        + Add a block
      </button>
    </article>
  )
}

export default PageView
