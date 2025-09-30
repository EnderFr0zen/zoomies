import type { 
  SessionDocument, 
  EventDocument, 
  MetricsDocument, 
  SettingsDocument,
  UserDocument,
  CourseDocument
} from './types'
import { DATABASE_NAMES, SCHEMA_VERSION } from './types'

// Simple IndexedDB wrapper for browser compatibility
class SimpleDB {
  private dbName: string
  private db: IDBDatabase | null = null

  constructor(dbName: string) {
    this.dbName = dbName
  }

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: '_id' })
        }
      }
    })
  }

  async put(doc: any): Promise<any> {
    if (!this.db) await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readwrite')
      const store = transaction.objectStore('documents')
      const request = store.put(doc)
      
      request.onsuccess = () => resolve(doc)
      request.onerror = () => reject(request.error)
    })
  }

  async get(id: string): Promise<any> {
    if (!this.db) await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly')
      const store = transaction.objectStore('documents')
      const request = store.get(id)
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAll(): Promise<any[]> {
    if (!this.db) await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly')
      const store = transaction.objectStore('documents')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async find(selector: any): Promise<any[]> {
    const allDocs = await this.getAll()
    // Simple filtering - in a real app you'd want more sophisticated querying
    return allDocs.filter(doc => {
      for (const [key, value] of Object.entries(selector)) {
        if (doc[key] !== value) return false
      }
      return true
    })
  }

  async destroy(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Database instances
class ZoomiesDatabase {
  private readonly usersDB: SimpleDB
  private readonly coursesDB: SimpleDB
  private readonly sessionsDB: SimpleDB
  private readonly eventsDB: SimpleDB
  private readonly metricsDB: SimpleDB
  private readonly settingsDB: SimpleDB
  
  private isInitialized = false

  constructor() {
    // Initialize database instances
    this.usersDB = new SimpleDB(DATABASE_NAMES.USERS)
    this.coursesDB = new SimpleDB(DATABASE_NAMES.COURSES)
    this.sessionsDB = new SimpleDB(DATABASE_NAMES.SESSIONS)
    this.eventsDB = new SimpleDB(DATABASE_NAMES.EVENTS)
    this.metricsDB = new SimpleDB(DATABASE_NAMES.METRICS)
    this.settingsDB = new SimpleDB(DATABASE_NAMES.SETTINGS)
  }

  // Initialize database
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Request persistent storage
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersistent = await navigator.storage.persist()
        console.log('Persistent storage granted:', isPersistent)
      }

      // Open all databases
      await Promise.all([
        this.usersDB.open(),
        this.coursesDB.open(),
        this.sessionsDB.open(),
        this.eventsDB.open(),
        this.metricsDB.open(),
        this.settingsDB.open()
      ])
      
      // Initialize default settings
      await this.initializeDefaultSettings()
      
      this.isInitialized = true
      console.log('Zoomies database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  // Initialize default settings
  private async initializeDefaultSettings(): Promise<void> {
    try {
      const settings = await this.getSettings()
      if (!settings) {
        const defaultSettings: Omit<SettingsDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt'> = {
          type: 'settings',
          isDefault: true,
          koala: {
            position: { x: 100, y: 100 },
            isMuted: false,
            reducedMotion: false
          },
          privacy: {
            consentGiven: true,
            consentDate: new Date().toISOString(),
            dataRetentionDays: 30,
            allowAnalytics: true
          },
          learning: {
            defaultSubject: 'General',
            sessionDuration: 30,
            nudgeSensitivity: 'medium',
            breakReminders: true
          },
          notifications: {
            soundEnabled: true,
            visualEnabled: true,
            vibrationEnabled: true
          }
        }
        await this.settingsDB.put({
          ...defaultSettings,
          _id: 'app_settings',
          schemaVersion: SCHEMA_VERSION,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        console.log('Default settings initialized')
      }
    } catch (error) {
      console.error('Failed to initialize default settings:', error)
    }
  }

  // Get settings
  async getSettings(): Promise<SettingsDocument | null> {
    try {
      return await this.settingsDB.get('app_settings') as SettingsDocument
    } catch (error: any) {
      if (error.name === 'not_found') {
        return null
      }
      throw error
    }
  }

  // Update settings
  async updateSettings(updates: Partial<SettingsDocument>): Promise<SettingsDocument> {
    const existing = await this.getSettings()
    if (!existing) {
      throw new Error('Settings document not found')
    }
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await this.settingsDB.put(updated)
    return updated
  }

  // Clear all databases
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.usersDB.destroy(),
      this.coursesDB.destroy(),
      this.sessionsDB.destroy(),
      this.eventsDB.destroy(),
      this.metricsDB.destroy(),
      this.settingsDB.destroy()
    ])
    console.log('All databases destroyed')
    // Re-initialize after destruction if needed
    this.isInitialized = false
    await this.initialize()
  }

  // Clear only courses data
  async clearAllCourses(): Promise<void> {
    try {
      console.log('Clearing all courses...')
      await this.coursesDB.destroy()
      // Re-initialize courses database
      await this.initialize()
      console.log('All courses cleared successfully')
    } catch (error) {
      console.error('Failed to clear courses:', error)
      throw error
    }
  }

  // Close all databases
  async closeAllDatabases(): Promise<void> {
    // SimpleDB doesn't need explicit closing
    console.log('All databases closed')
  }


  // User management methods
  async createUser(user: Omit<UserDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'type'> & { _id?: string }): Promise<UserDocument> {
    const now = new Date().toISOString()
    const userDoc: UserDocument = {
      ...user,
      _id: user._id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
      type: 'user' // Automatically set type
    }

    await this.usersDB.put(userDoc)
    return userDoc
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    try {
      const doc = await this.usersDB.get(userId)
      return doc as UserDocument
    } catch (error) {
      return null
    }
  }

  async getUserByUsername(username: string): Promise<UserDocument | null> {
    try {
      const result = await this.usersDB.find({ username })
      return result.length > 0 ? result[0] as UserDocument : null
    } catch (error) {
      return null
    }
  }

  async updateUser(userId: string, updates: Partial<UserDocument>): Promise<UserDocument> {
    const existing = await this.usersDB.get(userId)
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await this.usersDB.put(updated)
    return updated
  }

  async getAllUsers(): Promise<UserDocument[]> {
    try {
      const result = await this.usersDB.getAll()
      return result as UserDocument[]
    } catch (error) {
      return []
    }
  }

  async getUsersByRole(role: 'teacher' | 'student'): Promise<UserDocument[]> {
    try {
      const result = await this.usersDB.find({ role })
      return result as UserDocument[]
    } catch (error) {
      return []
    }
  }

  // Course management methods
  async createCourse(course: Omit<CourseDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'type'>): Promise<CourseDocument> {
    const now = new Date().toISOString()
    const courseDoc: CourseDocument = {
      ...course,
      _id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
      type: 'course' // Automatically set type
    }

    await this.coursesDB.put(courseDoc)
    return courseDoc
  }

  async getCourseById(courseId: string): Promise<CourseDocument | null> {
    try {
      const doc = await this.coursesDB.get(courseId)
      return doc as CourseDocument
    } catch (error) {
      return null
    }
  }

  async updateCourse(courseId: string, updates: Partial<CourseDocument>): Promise<CourseDocument> {
    const existing = await this.coursesDB.get(courseId)
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await this.coursesDB.put(updated)
    return updated
  }

  async getCoursesByTeacher(teacherId: string): Promise<CourseDocument[]> {
    try {
      const result = await this.coursesDB.find({ teacherId })
      return result as CourseDocument[]
    } catch (error) {
      console.error('Error in getCoursesByTeacher:', error)
      return []
    }
  }

  async getCoursesByStudent(studentId: string): Promise<CourseDocument[]> {
    try {
      const allCourses = await this.coursesDB.getAll()
      return allCourses.filter(course => 
        course.studentIds?.includes(studentId) && course.isActive
      ) as CourseDocument[]
    } catch (error) {
      return []
    }
  }

  async getAllCourses(): Promise<CourseDocument[]> {
    try {
      const result = await this.coursesDB.getAll()
      return result as CourseDocument[]
    } catch (error) {
      return []
    }
  }

  // Student enrollment methods
  async addStudentToCourse(courseId: string, studentId: string): Promise<CourseDocument> {
    const course = await this.getCourseById(courseId)
    if (!course) {
      throw new Error('Course not found')
    }

    if (!course.studentIds.includes(studentId)) {
      const updatedCourse = {
        ...course,
        studentIds: [...course.studentIds, studentId],
        updatedAt: new Date().toISOString()
      }
      await this.coursesDB.put(updatedCourse)
      return updatedCourse
    }

    return course
  }

  async removeStudentFromCourse(courseId: string, studentId: string): Promise<CourseDocument> {
    const course = await this.getCourseById(courseId)
    if (!course) {
      throw new Error('Course not found')
    }

    const updatedCourse = {
      ...course,
      studentIds: course.studentIds.filter(id => id !== studentId),
      updatedAt: new Date().toISOString()
    }
    await this.coursesDB.put(updatedCourse)
    return updatedCourse
  }

  async enrollStudentInCourse(studentId: string, courseId: string): Promise<UserDocument> {
    const user = await this.getUserById(studentId)
    if (!user) {
      throw new Error('Student not found')
    }

    if (!user.enrolledCourses.includes(courseId)) {
      const updatedUser = {
        ...user,
        enrolledCourses: [...user.enrolledCourses, courseId],
        updatedAt: new Date().toISOString()
      }
      await this.usersDB.put(updatedUser)
      return updatedUser
    }

    return user
  }

  async unenrollStudentFromCourse(studentId: string, courseId: string): Promise<UserDocument> {
    const user = await this.getUserById(studentId)
    if (!user) {
      throw new Error('Student not found')
    }

    const updatedUser = {
      ...user,
      enrolledCourses: user.enrolledCourses.filter(id => id !== courseId),
      updatedAt: new Date().toISOString()
    }
    await this.usersDB.put(updatedUser)
    return updatedUser
  }

  // Session management methods
  async createSession(session: Omit<SessionDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<SessionDocument> {
    const now = new Date().toISOString()
    const sessionDoc: SessionDocument = {
      ...session,
      _id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now
    }

    await this.sessionsDB.put(sessionDoc)
    return sessionDoc
  }

  async getSessionById(sessionId: string): Promise<SessionDocument | null> {
    try {
      const doc = await this.sessionsDB.get(sessionId)
      return doc as SessionDocument
    } catch (error) {
      return null
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionDocument>): Promise<SessionDocument> {
    const existing = await this.sessionsDB.get(sessionId)
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await this.sessionsDB.put(updated)
    return updated
  }

  async getAllSessions(): Promise<SessionDocument[]> {
    try {
      const result = await this.sessionsDB.getAll()
      return result as SessionDocument[]
    } catch (error) {
      return []
    }
  }

  // Event management methods
  async createEvent(event: Omit<EventDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<EventDocument> {
    const now = new Date().toISOString()
    const eventDoc: EventDocument = {
      ...event,
      _id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now
    }

    await this.eventsDB.put(eventDoc)
    return eventDoc
  }

  async getEventsBySession(sessionId: string): Promise<EventDocument[]> {
    try {
      const result = await this.eventsDB.find({ sessionId })
      return result as EventDocument[]
    } catch (error) {
      return []
    }
  }

  async getAllEvents(): Promise<EventDocument[]> {
    try {
      const result = await this.eventsDB.getAll()
      return result as EventDocument[]
    } catch (error) {
      return []
    }
  }

  // Metrics management methods
  async createMetrics(metrics: Omit<MetricsDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<MetricsDocument> {
    const now = new Date().toISOString()
    const metricsDoc: MetricsDocument = {
      ...metrics,
      _id: `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now
    }

    await this.metricsDB.put(metricsDoc)
    return metricsDoc
  }

  async getMetricsByUser(userId: string): Promise<MetricsDocument[]> {
    try {
      const result = await this.metricsDB.find({ userId })
      return result as MetricsDocument[]
    } catch (error) {
      return []
    }
  }

  async getAllMetrics(): Promise<MetricsDocument[]> {
    try {
      const result = await this.metricsDB.getAll()
      return result as MetricsDocument[]
    } catch (error) {
      return []
    }
  }

  // Additional methods for compatibility
  generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async getSession(sessionId: string): Promise<SessionDocument | null> {
    return this.getSessionById(sessionId)
  }

  async getMetricsBySession(sessionId: string): Promise<MetricsDocument[]> {
    try {
      const result = await this.metricsDB.find({ sessionId })
      return result as MetricsDocument[]
    } catch (error) {
      return []
    }
  }

  async updateMetrics(metricsId: string, updates: Partial<MetricsDocument>): Promise<MetricsDocument> {
    const existing = await this.metricsDB.get(metricsId)
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await this.metricsDB.put(updated)
    return updated
  }

  async getRecentSessions(limit: number = 10): Promise<SessionDocument[]> {
    try {
      const allSessions = await this.sessionsDB.getAll()
      return allSessions
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, limit) as SessionDocument[]
    } catch (error) {
      return []
    }
  }

  async getRecentEvents(limit: number = 100): Promise<EventDocument[]> {
    try {
      const allEvents = await this.eventsDB.getAll()
      return allEvents
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit) as EventDocument[]
    } catch (error) {
      return []
    }
  }

  async exportData(): Promise<any> {
    try {
      const [users, courses, sessions, events, metrics, settings] = await Promise.all([
        this.getAllUsers(),
        this.getAllCourses(),
        this.getAllSessions(),
        this.getAllEvents(),
        this.getAllMetrics(),
        this.getSettings()
      ])

      return {
        users,
        courses,
        sessions,
        events,
        metrics,
        settings,
        exportedAt: new Date().toISOString()
      }
    } catch (error) {
      throw new Error('Failed to export data')
    }
  }

  async close(): Promise<void> {
    return this.closeAllDatabases()
  }
}

// Export singleton instance
export const zoomiesDB = new ZoomiesDatabase()
export default zoomiesDB










