import './App.css'

function App() {
  return (
    <div className="app">
      <aside className="sidebar" aria-label="Sidebar">
        <h1 className="sidebar-title">Notes</h1>
      </aside>
      <main className="page">
        <p className="empty-state">Select or create a page to get started.</p>
      </main>
    </div>
  )
}

export default App
