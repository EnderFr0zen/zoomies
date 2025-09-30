import React from 'react'
import './Header.css'
import logoImage from '../assets/logo.png'

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <img 
            src={logoImage} 
            alt="Zoomies Logo" 
            className="logo-image"
          />
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
