import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import './Sidebar.css'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, isTeacher } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    ...(isTeacher ? [{
      id: 'dashboard',
      icon: '📊',
      text: 'Overview',
      description: 'Student Focus Monitoring'
    }] : []),
    {
      id: 'courses',
      icon: '💼',
      text: 'Courses',
      description: isTeacher ? 'Manage Courses' : 'Study Courses'
    },
    {
      id: 'settings',
      icon: '⚙️',
      text: 'Settings',
      description: 'Personal Settings'
    }
  ]

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId)
    setIsMobileMenuOpen(false) // Close mobile menu after selection
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button 
        className="mobile-menu-button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-content">
          <div className="user-greeting">
            <h2>Hello, {user?.displayName || 'User'}.</h2>
            <div className="user-role">
              {isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
            </div>
          </div>
          
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <div 
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleTabChange(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleTabChange(item.id)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-text-container">
                  <span className="nav-text">{item.text}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
