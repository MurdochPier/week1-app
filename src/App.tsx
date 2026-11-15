import './App.css'
import PageView from './components/PageView'
import Sidebar from './components/Sidebar'
import { AppProvider } from './state/AppContext'
import { useApp } from './state/useApp'

function MainArea() {
  const { state } = useApp()
  const page = state.selectedPageId ? state.pages[state.selectedPageId] : undefined

  return (
    <main className="page">
      {page ? (
        // key: start fresh (refs, focus) when switching pages
        <PageView key={page.id} page={page} />
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
