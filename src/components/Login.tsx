import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const success = await login(username, password)
    if (!success) {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Zoomies</h1>
          <p>Focus Learning Assistant</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-demo">
          <h3>Demo Accounts</h3>
          <div className="demo-accounts">
            <div className="demo-account">
              <strong>Teacher Account:</strong>
              <p>Username: teacher1</p>
              <p>Password: password</p>
            </div>
            <div className="demo-account">
              <strong>Student Accounts:</strong>
              <p>Username: student1, student2, student3</p>
              <p>Password: password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
