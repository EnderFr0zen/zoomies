import { useState, useEffect } from 'react'
import type { UserDocument, UserRole } from '../database/types'
import { zoomiesDB } from '../database'

export const useAuthSimple = () => {
  const [user, setUser] = useState<UserDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('zoomies_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('zoomies_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('Login attempt:', username, password)
    setIsLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Find user in database
      console.log('Looking up user in database...')
      const foundUser = await zoomiesDB.getUserByUsername(username)
      console.log('Found user:', foundUser)
      
      if (foundUser && password === 'password') { // Simple password validation
        console.log('Login successful, setting user and refreshing...')
        setUser(foundUser)
        localStorage.setItem('zoomies_user', JSON.stringify(foundUser))
        setIsLoading(false)
        // Small delay to show success state before refresh
        setTimeout(() => {
          window.location.reload()
        }, 500)
        return true
      }
      
      console.log('Login failed - user not found or wrong password')
      setIsLoading(false)
      return false
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('zoomies_user')
    window.location.reload()
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const isTeacher = hasRole('teacher')
  const isStudent = hasRole('student')
  const isAuthenticated = !!user

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    isTeacher,
    isStudent
  }
}
