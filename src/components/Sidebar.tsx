import React from 'react'
import './Sidebar.css'

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="user-greeting">
          <h2>Hello, Andy.</h2>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Overview</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">💼</span>
            <span className="nav-text">Courses</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">📄</span>
            <span className="nav-text">Study Materials</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </div>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
