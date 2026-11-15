import { useMemo } from 'react'
import type { KeyboardEvent } from 'react'
import { searchPages, splitMatch } from '../lib/search'
import { selectPage } from '../state/reducer'
import { useApp } from '../state/useApp'
import { UNTITLED } from './PageTreeItem'
import './SearchBox.css'

/** Shows `text` with the first match of `query` wrapped in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const parts = splitMatch(text, query)
  if (!parts) return <>{text}</>
  return (
    <>
      {parts.before}
      <mark>{parts.match}</mark>
      {parts.after}
    </>
  )
}

interface SearchBoxProps {
  query: string
  onQueryChange: (query: string) => void
}

function SearchBox({ query, onQueryChange }: SearchBoxProps) {
  const { state, dispatch } = useApp()
  const results = useMemo(() => searchPages(state.pages, query), [state.pages, query])
  const searching = query.trim() !== ''

  const open = (pageId: string) => {
    dispatch(selectPage(pageId))
    onQueryChange('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && results.length > 0) {
      e.preventDefault()
      open(results[0].pageId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onQueryChange('')
    }
  }

  return (
    <div className="search">
      <input
        type="search"
        className="search-input"
        placeholder="Search"
        aria-label="Search pages"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {searching && (
        <div className="search-results">
          {results.length === 0 ? (
            <p className="search-empty">No pages found</p>
          ) : (
            <ul aria-label="Search results">
              {results.map((result) => (
                <li key={result.pageId}>
                  <button type="button" className="search-result" onClick={() => open(result.pageId)}>
                    <span className="search-result-title">
                      <Highlight text={result.title || UNTITLED} query={query} />
                    </span>
                    {result.snippet && (
                      <span className="search-result-snippet">
                        <Highlight text={result.snippet} query={query} />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBox
