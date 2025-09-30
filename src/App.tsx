import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth.tsx'
import { databaseSystem } from './database'
import Login from './components/Login'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import TeacherDashboard from './components/TeacherDashboard'
import Courses from './components/Courses'
import SimpleKoala from './components/SimpleKoala'

function App() {
  const { isAuthenticated, isLoading, isTeacher, isStudent } = useAuth()
  const [activeTab, setActiveTab] = useState('courses')
  const [dbInitialized, setDbInitialized] = useState(false)

  // Initialize database system
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Initializing database system...')
        
        // Test CouchDB connection first
        // Skip CouchDB connection test for now
        console.log('Skipping CouchDB connection test')
        
        await databaseSystem.initialize()
        setDbInitialized(true)
        console.log('Database system initialized successfully')
      } catch (error) {
        console.error('Failed to initialize database system:', error)
        // Continue with app even if database fails
        setDbInitialized(true)
      }
    }

    initializeDatabase()
  }, [])

  if (isLoading || !dbInitialized) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>{isLoading ? 'Loading...' : 'Initializing database...'}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isTeacher ? <TeacherDashboard /> : <Dashboard />
      case 'courses':
        return <Courses />
      case 'settings':
        return <div className="settings-placeholder">Settings page under development...</div>
      default:
        return isTeacher ? <TeacherDashboard /> : <Dashboard />
    }
  }

  return (
    <div className="app">
      <Header />
      <div className="main-layout">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="main-content">
          {renderMainContent()}
        </main>
      </div>
      {isStudent && <SimpleKoala />}
    </div>
  )
}

export default App
