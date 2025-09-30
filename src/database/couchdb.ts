import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
import type { 
  SessionDocument, 
  EventDocument, 
  MetricsDocument, 
  SettingsDocument,
  UserDocument,
  CourseDocument
} from './types'
import { DATABASE_NAMES, SCHEMA_VERSION } from './types'

// Enable PouchDB plugins
PouchDB.plugin(PouchDBFind)

// CouchDB configuration
const COUCHDB_URL = 'http://admin:password@localhost:5984'
const COUCHDB_DATABASE_PREFIX = 'zoomies_'

// Database instances
class CouchDBDatabase {
  private readonly usersDB: PouchDB.Database
  private readonly coursesDB: PouchDB.Database
  private readonly sessionsDB: PouchDB.Database
  private readonly eventsDB: PouchDB.Database
  private readonly metricsDB: PouchDB.Database
  private readonly settingsDB: PouchDB.Database
  
  private isInitialized = false

  constructor() {
    // Initialize CouchDB databases
    this.usersDB = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DATABASE_PREFIX}${DATABASE_NAMES.USERS}`)
    this.coursesDB = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DATABASE_PREFIX}${DATABASE_NAMES.COURSES}`)
    this.sessionsDB = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DATABASE_PREFIX}${DATABASE_NAMES.SESSIONS}`)
    this.eventsDB = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DATABASE_PREFIX}${DATABASE_NAMES.EVENTS}`)
    this.metricsDB = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DATABASE_PREFIX}${DATABASE_NAMES.METRICS}`)
    this.settingsDB = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DATABASE_PREFIX}${DATABASE_NAMES.SETTINGS}`)
  }

  // Initialize database
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing CouchDB databases...')
      
      // Create databases if they don't exist
      await Promise.all([
        this.createDatabaseIfNotExists(this.usersDB),
        this.createDatabaseIfNotExists(this.coursesDB),
        this.createDatabaseIfNotExists(this.sessionsDB),
        this.createDatabaseIfNotExists(this.eventsDB),
        this.createDatabaseIfNotExists(this.metricsDB),
        this.createDatabaseIfNotExists(this.settingsDB)
      ])

      // Create indexes for better query performance
      await this.createIndexes()
      
      // Initialize default settings
      await this.initializeDefaultSettings()
      
      this.isInitialized = true
      console.log('CouchDB databases initialized successfully')
    } catch (error) {
      console.error('Failed to initialize CouchDB databases:', error)
      throw error
    }
  }

  // Create database if it doesn't exist
  private async createDatabaseIfNotExists(db: PouchDB.Database): Promise<void> {
    try {
      await db.info()
    } catch (error: any) {
      if (error.status === 404) {
        await (db as any).create()
        console.log(`Created database: ${db.name}`)
      } else {
        throw error
      }
    }
  }

  // Create indexes for better query performance
  private async createIndexes(): Promise<void> {
    try {
      // Users indexes
      await this.usersDB.createIndex({
        index: { fields: ['username'] }
      })
      await this.usersDB.createIndex({
        index: { fields: ['role'] }
      })
      await this.usersDB.createIndex({
        index: { fields: ['teacherId'] }
      })

      // Courses indexes
      await this.coursesDB.createIndex({
        index: { fields: ['teacherId'] }
      })
      await this.coursesDB.createIndex({
        index: { fields: ['studentIds'] }
      })
      await this.coursesDB.createIndex({
        index: { fields: ['isActive'] }
      })

      // Sessions indexes
      await this.sessionsDB.createIndex({
        index: { fields: ['userId'] }
      })
      await this.sessionsDB.createIndex({
        index: { fields: ['startedAt'] }
      })

      // Events indexes
      await this.eventsDB.createIndex({
        index: { fields: ['sessionId'] }
      })
      await this.eventsDB.createIndex({
        index: { fields: ['userId'] }
      })
      await this.eventsDB.createIndex({
        index: { fields: ['timestamp'] }
      })

      // Metrics indexes
      await this.metricsDB.createIndex({
        index: { fields: ['userId'] }
      })
      await this.metricsDB.createIndex({
        index: { fields: ['sessionId'] }
      })

      console.log('Database indexes created successfully')
    } catch (error) {
      console.error('Failed to create indexes:', error)
      // Don't throw error, continue with app
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
      const doc = await this.settingsDB.get('app_settings')
      return doc as SettingsDocument
    } catch (error: any) {
      if (error.status === 404) {
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
    try {
      console.log('Clearing all CouchDB data...')
      await Promise.all([
        this.usersDB.destroy(),
        this.coursesDB.destroy(),
        this.sessionsDB.destroy(),
        this.eventsDB.destroy(),
        this.metricsDB.destroy(),
        this.settingsDB.destroy()
      ])
      console.log('All CouchDB databases destroyed')
      // Re-initialize after destruction
      this.isInitialized = false
      await this.initialize()
    } catch (error) {
      console.error('Failed to clear CouchDB data:', error)
      throw error
    }
  }

  // Clear only courses data
  async clearAllCourses(): Promise<void> {
    try {
      console.log('Clearing all courses...')
      await this.coursesDB.destroy()
      // Re-create courses database
      await (this.coursesDB as any).create()
      await this.coursesDB.createIndex({
        index: { fields: ['teacherId'] }
      })
      await this.coursesDB.createIndex({
        index: { fields: ['studentIds'] }
      })
      await this.coursesDB.createIndex({
        index: { fields: ['isActive'] }
      })
      console.log('All courses cleared successfully')
    } catch (error) {
      console.error('Failed to clear courses:', error)
      throw error
    }
  }

  // Close all databases
  async closeAllDatabases(): Promise<void> {
    await Promise.all([
      this.usersDB.close(),
      this.coursesDB.close(),
      this.sessionsDB.close(),
      this.eventsDB.close(),
      this.metricsDB.close(),
      this.settingsDB.close()
    ])
    console.log('All CouchDB databases closed')
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
      type: 'user'
    }

    const result = await this.usersDB.put(userDoc)
    return { ...userDoc, _rev: result.rev }
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    try {
      const doc = await this.usersDB.get(userId)
      return doc as UserDocument
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  async getUserByUsername(username: string): Promise<UserDocument | null> {
    try {
      const result = await this.usersDB.find({
        selector: { username },
        limit: 1
      })
      return result.docs.length > 0 ? result.docs[0] as UserDocument : null
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
    const result = await this.usersDB.put(updated)
    return { ...updated, _rev: result.rev } as any
  }

  async getAllUsers(): Promise<UserDocument[]> {
    try {
      const result = await this.usersDB.find({
        selector: { type: 'user' }
      })
      return result.docs as UserDocument[]
    } catch (error) {
      return []
    }
  }

  async getUsersByRole(role: 'teacher' | 'student'): Promise<UserDocument[]> {
    try {
      const result = await this.usersDB.find({
        selector: { role, type: 'user' }
      })
      return result.docs as UserDocument[]
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
      type: 'course'
    }

    const result = await this.coursesDB.put(courseDoc)
    return { ...courseDoc, _rev: result.rev }
  }

  async getCourseById(courseId: string): Promise<CourseDocument | null> {
    try {
      const doc = await this.coursesDB.get(courseId)
      return doc as CourseDocument
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  async updateCourse(courseId: string, updates: Partial<CourseDocument>): Promise<CourseDocument> {
    const existing = await this.coursesDB.get(courseId)
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    const result = await this.coursesDB.put(updated)
    return { ...updated, _rev: result.rev } as any
  }

  async getCoursesByTeacher(teacherId: string): Promise<CourseDocument[]> {
    try {
      const result = await this.coursesDB.find({
        selector: { teacherId, type: 'course' }
      })
      return result.docs as CourseDocument[]
    } catch (error) {
      console.error('Error in getCoursesByTeacher:', error)
      return []
    }
  }

  async getCoursesByStudent(studentId: string): Promise<CourseDocument[]> {
    try {
      const result = await this.coursesDB.find({
        selector: { 
          studentIds: { $in: [studentId] },
          isActive: true,
          type: 'course'
        }
      })
      return result.docs as CourseDocument[]
    } catch (error) {
      return []
    }
  }

  async getAllCourses(): Promise<CourseDocument[]> {
    try {
      const result = await this.coursesDB.find({
        selector: { type: 'course' }
      })
      return result.docs as CourseDocument[]
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
      const result = await this.coursesDB.put(updatedCourse)
      return { ...updatedCourse, _rev: result.rev }
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
    const result = await this.coursesDB.put(updatedCourse)
    return { ...updatedCourse, _rev: result.rev }
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
      const result = await this.usersDB.put(updatedUser)
      return { ...updatedUser, _rev: result.rev }
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
    const result = await this.usersDB.put(updatedUser)
    return { ...updatedUser, _rev: result.rev }
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

    const result = await this.sessionsDB.put(sessionDoc)
    return { ...sessionDoc, _rev: result.rev }
  }

  async getSessionById(sessionId: string): Promise<SessionDocument | null> {
    try {
      const doc = await this.sessionsDB.get(sessionId)
      return doc as SessionDocument
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionDocument>): Promise<SessionDocument> {
    const existing = await this.sessionsDB.get(sessionId)
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    const result = await this.sessionsDB.put(updated)
    return { ...updated, _rev: result.rev } as any
  }

  async getAllSessions(): Promise<SessionDocument[]> {
    try {
      const result = await this.sessionsDB.find({
        selector: { type: 'session' }
      })
      return result.docs as SessionDocument[]
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

    const result = await this.eventsDB.put(eventDoc)
    return { ...eventDoc, _rev: result.rev }
  }

  async getEventsBySession(sessionId: string): Promise<EventDocument[]> {
    try {
      const result = await this.eventsDB.find({
        selector: { sessionId }
      })
      return result.docs as EventDocument[]
    } catch (error) {
      return []
    }
  }

  async getAllEvents(): Promise<EventDocument[]> {
    try {
      const result = await this.eventsDB.find({
        selector: { type: 'event' }
      })
      return result.docs as EventDocument[]
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

    const result = await this.metricsDB.put(metricsDoc)
    return { ...metricsDoc, _rev: result.rev }
  }

  async getMetricsByUser(userId: string): Promise<MetricsDocument[]> {
    try {
      const result = await this.metricsDB.find({
        selector: { userId }
      })
      return result.docs as MetricsDocument[]
    } catch (error) {
      return []
    }
  }

  async getAllMetrics(): Promise<MetricsDocument[]> {
    try {
      const result = await this.metricsDB.find({
        selector: { type: 'metrics' }
      })
      return result.docs as MetricsDocument[]
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
      const result = await this.metricsDB.find({
        selector: { sessionId }
      })
      return result.docs as MetricsDocument[]
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
    const result = await this.metricsDB.put(updated)
    return { ...updated, _rev: result.rev } as any
  }

  async getRecentSessions(limit: number = 10): Promise<SessionDocument[]> {
    try {
      const result = await this.sessionsDB.find({
        selector: { type: 'session' },
        sort: [{ startedAt: 'desc' }],
        limit
      })
      return result.docs as SessionDocument[]
    } catch (error) {
      return []
    }
  }

  async getRecentEvents(limit: number = 100): Promise<EventDocument[]> {
    try {
      const result = await this.eventsDB.find({
        selector: { type: 'event' },
        sort: [{ timestamp: 'desc' }],
        limit
      })
      return result.docs as EventDocument[]
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
export const zoomiesDB = new CouchDBDatabase()
export default zoomiesDB
