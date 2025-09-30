import { zoomiesDB } from './couchdb-simple'
import { privacyManager } from './privacyManager'
import { storageManager } from './storageManager'
import { migrationManager } from './migrationManager'

// Export the database instance
export { zoomiesDB }

// Export types
export * from './types'

// Database system initializer
export class DatabaseSystem {
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing Zoomies database system...')

      // 1. Request privacy consent
      const consentGiven = await privacyManager.requestConsent()
      if (!consentGiven) {
        throw new Error('User consent required for database initialization')
      }

      // 2. Initialize privacy manager
      await privacyManager.initializeEncryption()

      // 3. Initialize database
      await zoomiesDB.initialize()

      // 4. Initialize default data only if no users exist
      await this.initializeDefaultData()

      // 5. Log database status for verification
      const userCount = (await zoomiesDB.getAllUsers()).length
      const courseCount = (await zoomiesDB.getAllCourses()).length
      console.log(`Database ready: ${userCount} users, ${courseCount} courses (teachers can create new courses)`)

      // 6. Execute data migration
      if (migrationManager.needsMigration()) {
        await migrationManager.migrate()
      }

      // 7. Request persistent storage
      await storageManager.requestPersistentStorage()

      // 8. Set storage quota
      storageManager.setStorageQuota({
        maxEvents: 10000,
        maxSessions: 1000,
        retentionDays: 30,
        compressionEnabled: true
      })

      // 9. Start periodic cleanup
      storageManager.startPeriodicCleanup()

      this.isInitialized = true
      console.log('Zoomies database system initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database system:', error)
      throw error
    }
  }

  // Initialize default users and courses
  private async initializeDefaultData(): Promise<void> {
    try {
      // Check if users already exist
      const existingUsers = await zoomiesDB.getAllUsers()
      if (existingUsers.length === 0) {
        console.log('Creating default users (teacher1, student1, student2, student3)...')
        
        // Create default teacher with fixed ID
        await zoomiesDB.createUser({
          _id: 'user_teacher1', // Fixed ID
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
        })

        // Create default students with fixed IDs
        await zoomiesDB.createUser({
          _id: 'user_student1', // Fixed ID
          username: 'student1',
          email: 'student1@zoomies.com',
          role: 'student',
          displayName: 'Alice',
          isActive: true,
          teacherId: 'teacher1',
          enrolledCourses: [],
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true
          }
        })

        await zoomiesDB.createUser({
          _id: 'user_student2', // Fixed ID
          username: 'student2',
          email: 'student2@zoomies.com',
          role: 'student',
          displayName: 'Bob',
          isActive: true,
          teacherId: 'teacher1',
          enrolledCourses: [],
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true
          }
        })

        await zoomiesDB.createUser({
          _id: 'user_student3', // Fixed ID
          username: 'student3',
          email: 'student3@zoomies.com',
          role: 'student',
          displayName: 'Carol',
          isActive: true,
          teacherId: 'teacher1',
          enrolledCourses: [],
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true
          }
        })

        console.log('Default users created successfully')
      }

      // No default courses - teachers will create their own courses
    } catch (error) {
      console.error('Failed to initialize default data:', error)
      // Don't throw error, continue with app
    }
  }

  // Clear all data from databases
  private async clearAllData(): Promise<void> {
    await zoomiesDB.clearAllData()
  }

  // Clear only courses data
  async clearAllCourses(): Promise<void> {
    try {
      console.log('Clearing all courses...')
      await zoomiesDB.clearAllCourses()
      console.log('All courses cleared successfully')
    } catch (error) {
      console.error('Failed to clear courses:', error)
      throw error
    }
  }

  // Create new course
  async createCourse(courseData: Omit<CourseDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'type'>): Promise<CourseDocument> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    return await zoomiesDB.createCourse(courseData)
  }

  // Create new session
  async createSession(subject: string, duration?: number): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    const sessionId = zoomiesDB.generateId()
    
    await zoomiesDB.createSession({
      type: 'session',
      sessionId,
      userId: 'default-user', // Temporary user ID, should be obtained from authentication system in real app
      subject,
      startedAt: new Date().toISOString(),
      duration: (duration || 25) * 60, // Convert minutes to seconds
      isActive: true,
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })

    return sessionId
  }

  // End session
  async endSession(sessionId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    const session = await zoomiesDB.getSessionById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const endedAt = new Date().toISOString()
    const duration = Math.floor((new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)

    await zoomiesDB.updateSession(sessionId, {
      endedAt,
      duration,
      isActive: false
    })
  }

  // Log event
  async logEvent(sessionId: string, eventType: string, data?: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    await zoomiesDB.createEvent({
      type: 'event',
      sessionId,
      userId: 'default-user',
      eventType: eventType as any,
      timestamp: new Date().toISOString(),
      data: data || {}
    })
  }

  // Get user settings
  async getUserSettings(_userId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    return {
      theme: 'light',
      language: 'en',
      notifications: true,
      privacy: {
        dataCollection: true,
        analytics: true,
        personalization: true
      }
    }
  }

  // Update user settings
  async updateUserSettings(_userId: string, settings: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    // Settings update would be implemented here
    console.log('Updating user settings:', settings)
  }

  // Get session stats
  async getSessionStats(sessionId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    const session = await zoomiesDB.getSessionById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    return {
      sessionId: session.sessionId,
      duration: session.duration,
      isActive: session.isActive,
      startedAt: session.startedAt,
      endedAt: session.endedAt
    }
  }

  // Cleanup old data
  async cleanupOldData(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    // This would implement cleanup logic for old sessions, events, etc.
    console.log('Cleaning up old data...')
  }

  // Export data
  async exportData(userId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    // This would implement data export functionality
    console.log(`Exporting data for user ${userId}...`)
    return {}
  }

  // Import data
  async importData(userId: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    // This would implement data import functionality
    console.log(`Importing data for user ${userId}...`, data)
  }
}

// Create and export singleton instance
export const databaseSystem = new DatabaseSystem()