import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SimpleKoala from './components/SimpleKoala'

function App() {
  return (
    <div className="app">
      <Header />
      <div className="main-layout">
        <Sidebar />
        <Dashboard />
      </div>
      <SimpleKoala />
    </div>
  )
}

export default App
