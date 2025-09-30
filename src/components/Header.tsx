import React from 'react'
import './Header.css'

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-text">Zoomies</span>
        </div>
      </div>
      
      <div className="header-right">
        <div className="user-profile">
          <div className="profile-icon">👤</div>
        </div>
        <button className="sign-out-btn">Sign out</button>
      </div>
    </header>
  )
}

export default Header
