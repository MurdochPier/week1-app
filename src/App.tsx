import './App.css'
import { UNTITLED } from './components/PageTreeItem'
import Sidebar from './components/Sidebar'
import { AppProvider } from './state/AppContext'
import { useApp } from './state/useApp'

function MainArea() {
  const { state } = useApp()
  const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined

  return (
    <main className="page">
      {page ? (
        <h2 className={page.title ? 'page-title' : 'page-title untitled'}>
          {page.title || UNTITLED}
        </h2>
      ) : (
        <p className="empty-state">Select or create a page to get started.</p>
      )}
    </main>
  )
}

function App() {
  return (
    <AppProvider>
      <div className="app">
        <Sidebar />
        <MainArea />
      </div>
    </AppProvider>
  )
}

export default App
