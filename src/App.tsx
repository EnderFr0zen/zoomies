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
import { KoalaMoodProvider } from './context/KoalaMoodContext'

function App() {
  const { isAuthenticated, isLoading, isTeacher, isStudent } = useAuth()
  const [activeTab, setActiveTab] = useState('courses')
  const [dbInitialized, setDbInitialized] = useState(false)

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Initializing database system...')
        console.log('Skipping CouchDB connection test')
        await databaseSystem.initialize()
        setDbInitialized(true)
        console.log('Database system initialized successfully')
      } catch (error) {
        console.error('Failed to initialize database system:', error)
        setDbInitialized(true)
      }
    }

    initializeDatabase()
  }, [])

  if (isLoading || !dbInitialized) {
    return (
      <KoalaMoodProvider>
        <div className="app">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>{isLoading ? 'Loading...' : 'Initializing database...'}</p>
          </div>
        </div>
      </KoalaMoodProvider>
    )
  }

  if (!isAuthenticated) {
    return (
      <KoalaMoodProvider>
        <Login />
      </KoalaMoodProvider>
    )
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
    <KoalaMoodProvider>
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
    </KoalaMoodProvider>
  )
}

export default App
