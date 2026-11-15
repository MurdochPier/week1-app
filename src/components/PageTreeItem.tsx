import { useState } from 'react'
import type { TreeNode } from '../lib/tree'
import { useApp } from '../state/useApp'
import { addPage, deletePage, selectPage } from '../state/reducer'

export const UNTITLED = 'Untitled'

function PageTreeItem({ node }: { node: TreeNode }) {
  const { state, dispatch } = useApp()
  const [expanded, setExpanded] = useState(true)
  const { page, children } = node
  const title = page.title || UNTITLED
  const hasChildren = children.length > 0
  const isSelected = state.selectedPageId === page.id

  const handleAddChild = () => {
    setExpanded(true)
    dispatch(addPage(page.id))
  }

  const handleDelete = () => {
    if (hasChildren && !window.confirm(`Delete "${title}" and all of its sub-pages?`)) return
    dispatch(deletePage(page.id))
  }

  return (
    <li>
      <div className={isSelected ? 'tree-row selected' : 'tree-row'}>
        {hasChildren ? (
          <button
            type="button"
            className="tree-icon-button"
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="tree-icon-spacer" />
        )}
        <button
          type="button"
          className="tree-page-button"
          aria-current={isSelected ? 'page' : undefined}
          onClick={() => dispatch(selectPage(page.id))}
        >
          {title}
        </button>
        <span className="tree-actions">
          <button
            type="button"
            className="tree-icon-button"
            aria-label={`Add sub-page to ${title}`}
            onClick={handleAddChild}
          >
            +
          </button>
          <button
            type="button"
            className="tree-icon-button"
            aria-label={`Delete ${title}`}
            onClick={handleDelete}
          >
            ×
          </button>
        </span>
      </div>
      {hasChildren && expanded && (
        <ul className="page-tree">
          {children.map((child) => (
            <PageTreeItem key={child.page.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default PageTreeItem
