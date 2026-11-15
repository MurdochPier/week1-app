import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Announcements, DragEndEvent, Modifier, UniqueIdentifier } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useLayoutEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { LIST_TYPES, listNumbers } from '../lib/blocks'
import { placeCaret } from '../lib/caret'
import {
  addBlock,
  changeBlockType,
  deleteBlock,
  moveBlock,
  newBlock,
  renamePage,
  toggleTodo,
  updateBlock,
} from '../state/reducer'
import { useApp } from '../state/useApp'
import type { Block as BlockData, Page } from '../types'
import { UNTITLED } from './PageTreeItem'
import SortableBlock from './SortableBlock'
import './PageView.css'

interface FocusRequest {
  id: string
  where: 'start' | 'end'
}

/** Blocks only move up and down, never sideways. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 })

const screenReaderInstructions = {
  draggable:
    'To pick up a block, press Space or Enter. Use the up and down arrow keys to move it. ' +
    'Press Space or Enter again to drop it, or Escape to cancel.',
}

function PageView({ page }: { page: Page }) {
  const { dispatch } = useApp()
  const blocksRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<FocusRequest | null>(null)
  const numbers = listNumbers(page.blocks)
  const blockIds = page.blocks.map((b) => b.id)

  // Pointer: the mouse must move 5px before a drag starts, so a plain click on the handle isn't a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    dispatch(
      moveBlock(page.id, blockIds.indexOf(String(active.id)), blockIds.indexOf(String(over.id))),
    )
  }

  // What screen readers say during a drag (dnd-kit's default would read out the random block ids).
  const total = page.blocks.length
  const position = (id: UniqueIdentifier) => blockIds.indexOf(String(id)) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up block ${position(active.id)} of ${total}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Block ${position(active.id)} is over position ${position(over.id)} of ${total}.`
        : `Block ${position(active.id)} is no longer over a drop position.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Block ${position(active.id)} was dropped at position ${position(over.id)} of ${total}.`
        : `Block ${position(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Moving cancelled. Block ${position(active.id)} was put back.`,
  }

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[verticalOnly]}
        onDragEnd={handleDragEnd}
        accessibility={{ announcements, screenReaderInstructions }}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <div className="blocks" ref={blocksRef}>
            {page.blocks.map((block, index) => (
              <SortableBlock
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
        </SortableContext>
      </DndContext>
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
