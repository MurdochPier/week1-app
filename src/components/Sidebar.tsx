import { useMemo } from 'react'
import { buildTree } from '../lib/tree'
import { useApp } from '../state/useApp'
import { addPage } from '../state/reducer'
import PageTreeItem from './PageTreeItem'
import './Sidebar.css'

function Sidebar() {
  const { state, dispatch } = useApp()
  const tree = useMemo(() => buildTree(state.pages), [state.pages])

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <h1 className="sidebar-title">Notes</h1>
      <button type="button" className="new-page-button" onClick={() => dispatch(addPage())}>
        + New page
      </button>
      <nav aria-label="Pages">
        <ul className="page-tree">
          {tree.map((node) => (
            <PageTreeItem key={node.page.id} node={node} />
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
