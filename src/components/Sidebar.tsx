import { useMemo, useState } from 'react'
import { buildTree } from '../lib/tree'
import { useApp } from '../state/useApp'
import { addPage } from '../state/reducer'
import PageTreeItem from './PageTreeItem'
import SearchBox from './SearchBox'
import ThemeToggle from './ThemeToggle'
import './Sidebar.css'

function Sidebar() {
  const { state, dispatch } = useApp()
  const [query, setQuery] = useState('')
  const tree = useMemo(() => buildTree(state.pages), [state.pages])
  const searching = query.trim() !== ''

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Notes</h1>
        <ThemeToggle />
      </div>
      <SearchBox query={query} onQueryChange={setQuery} />
      <button type="button" className="new-page-button" onClick={() => dispatch(addPage())}>
        + New page
      </button>
      {/* While searching, the results replace the page tree. */}
      {!searching && (
        <nav aria-label="Pages">
          <ul className="page-tree">
            {tree.map((node) => (
              <PageTreeItem key={node.page.id} node={node} />
            ))}
          </ul>
        </nav>
      )}
    </aside>
  )
}

export default Sidebar
