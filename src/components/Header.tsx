import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import './Header.css'
import logoImage from '../assets/logo.png'

const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = () => {
    setIsSigningOut(true)
    // Small delay to show the signing out state
    setTimeout(() => {
      logout()
    }, 300)
  }

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
          <span className="user-name">{user?.displayName || 'User'}</span>
        </div>
        <button 
          className="sign-out-btn"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </header>
  )
}

export default Header
