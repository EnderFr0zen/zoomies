import { useState } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
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

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
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
