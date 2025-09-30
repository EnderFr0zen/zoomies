import { useState, useEffect, createContext, useContext } from 'react'
import type { UserDocument, UserRole } from '../database/types'

interface AuthContextType {
  user: UserDocument | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hasRole: (role: UserRole) => boolean
  isTeacher: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data - In real application this should come from API
const MOCK_USERS: UserDocument[] = [
  {
    _id: 'teacher1',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'user',
    username: 'teacher1',
    email: 'teacher1@zoomies.com',
    role: 'teacher',
    displayName: 'Mr. Smith',
    isActive: true,
    enrolledCourses: [],
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    }
  },
  {
    _id: 'student1',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'user',
    username: 'student1',
    email: 'student1@zoomies.com',
    role: 'student',
    displayName: 'Alice',
    isActive: true,
    teacherId: 'teacher1',
    enrolledCourses: ['course1', 'course2', 'course3', 'course4'],
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    }
  },
  {
    _id: 'student2',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'user',
    username: 'student2',
    email: 'student2@zoomies.com',
    role: 'student',
    displayName: 'Bob',
    isActive: true,
    teacherId: 'teacher1',
    enrolledCourses: ['course1', 'course2', 'course3', 'course4'],
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    }
  },
  {
    _id: 'student3',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'user',
    username: 'student3',
    email: 'student3@zoomies.com',
    role: 'student',
    displayName: 'Carol',
    isActive: true,
    teacherId: 'teacher1',
    enrolledCourses: ['course1', 'course2', 'course3', 'course4'],
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    }
  }
]

export const useAuth = (): AuthContextType => {
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
    setIsLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Find user (in real app, password should be hashed and compared with database)
    const foundUser = MOCK_USERS.find(u => u.username === username)
    
    if (foundUser && password === 'password') { // Simple password validation
      setUser(foundUser)
      localStorage.setItem('zoomies_user', JSON.stringify(foundUser))
      setIsLoading(false)
      // Small delay to show success state before refresh
      setTimeout(() => {
        window.location.reload()
      }, 500)
      return true
    }
    
    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('zoomies_user')
    // Refresh the page to ensure proper redirect to login page
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

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
