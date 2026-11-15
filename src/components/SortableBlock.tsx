import { useSortable } from '@dnd-kit/sortable'
import type { CSSProperties } from 'react'
import type { BlockProps } from './Block'
import Block from './Block'

/** One block plus a drag handle. Only the handle starts a drag, so text editing works as normal. */
function SortableBlock(props: BlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.block.id })

  const style: CSSProperties = {
    // dnd-kit tells us how far to shift this row while something is being dragged.
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'sortable-row dragging' : 'sortable-row'}>
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag to move block"
      >
        ⋮⋮
      </button>
      <Block {...props} />
    </div>
  )
}

export default SortableBlock
