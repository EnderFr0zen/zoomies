// Simple CouchDB client using fetch API instead of PouchDB
import type {
  UserDocument,
  CourseDocument
} from './types'

const COUCHDB_URL = '/api/couchdb'
const DATABASE_PREFIX = 'zoomies_'

class SimpleCouchDBClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = COUCHDB_URL
  }

  // Generic HTTP methods
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('admin:password'),
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Database management
  async createDatabase(dbName: string): Promise<void> {
    try {
      await this.request(`/${DATABASE_PREFIX}${dbName}`, { method: 'PUT' })
    } catch (error: any) {
      if (error.message.includes('412')) {
        // Database already exists
        return
      }
      throw error
    }
  }

  async getDocument(dbName: string, docId: string): Promise<any> {
    return this.request(`/${DATABASE_PREFIX}${dbName}/${docId}`)
  }

  async putDocument(dbName: string, doc: any): Promise<any> {
    return this.request(`/${DATABASE_PREFIX}${dbName}/${doc._id}`, {
      method: 'PUT',
      body: JSON.stringify(doc)
    })
  }

  async findDocuments(dbName: string, selector: any, limit?: number): Promise<any[]> {
    const query = {
      selector,
      limit: limit || 100
    }
    
    const result = await this.request(`/${DATABASE_PREFIX}${dbName}/_find`, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    
    return result.docs || []
  }

  // User management
  async createUser(user: Omit<UserDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'type'> & { _id?: string }): Promise<UserDocument> {
    const now = new Date().toISOString()
    const userDoc: UserDocument = {
      ...user,
      _id: user._id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      type: 'user'
    }

    const result = await this.putDocument('users', userDoc)
    return { ...userDoc, _rev: result.rev }
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    try {
      return await this.getDocument('users', userId)
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async getUserByUsername(username: string): Promise<UserDocument | null> {
    try {
      const docs = await this.findDocuments('users', { username, type: 'user' }, 1)
      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error('Error finding user by username:', error)
      return null
    }
  }

  async getAllUsers(): Promise<UserDocument[]> {
    try {
      return await this.findDocuments('users', { type: 'user' })
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  }

  async getUsersByIds(userIds: string[]): Promise<UserDocument[]> {
    if (!userIds || userIds.length === 0) {
      return []
    }

    try {
      const selector = {
        type: 'user',
        _id: { '$in': userIds }
      }
      return await this.findDocuments('users', selector, userIds.length)
    } catch (error) {
      console.error('Error getting users by IDs:', error)
      return []
    }
  }

  async updateUser(userId: string, updates: Partial<UserDocument>): Promise<UserDocument> {
    const existing = await this.getUserById(userId)
    if (!existing) {
      throw new Error('User not found')
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const result = await this.putDocument('users', updated)
    return { ...updated, _rev: result.rev }
  }

  // Course management
  async createCourse(course: Omit<CourseDocument, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'type'>): Promise<CourseDocument> {
    const now = new Date().toISOString()
    const courseDoc: CourseDocument = {
      ...course,
      _id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      type: 'course'
    }

    const result = await this.putDocument('courses', courseDoc)
    return { ...courseDoc, _rev: result.rev }
  }

  async getCourseById(courseId: string): Promise<CourseDocument | null> {
    try {
      return await this.getDocument('courses', courseId)
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async getCoursesByTeacher(teacherId: string): Promise<CourseDocument[]> {
    try {
      return await this.findDocuments('courses', { teacherId, type: 'course' })
    } catch (error) {
      console.error('Error getting courses by teacher:', error)
      return []
    }
  }

  async getCoursesByStudent(studentId: string): Promise<CourseDocument[]> {
    try {
      return await this.findDocuments('courses', { 
        studentIds: { $in: [studentId] },
        isActive: true,
        type: 'course'
      })
    } catch (error) {
      console.error('Error getting courses by student:', error)
      return []
    }
  }

  async getAllCourses(): Promise<CourseDocument[]> {
    try {
      return await this.findDocuments('courses', { type: 'course' })
    } catch (error) {
      console.error('Error getting all courses:', error)
      return []
    }
  }

  async updateCourse(courseId: string, updates: Partial<CourseDocument>): Promise<CourseDocument> {
    const existing = await this.getCourseById(courseId)
    if (!existing) {
      throw new Error('Course not found')
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const result = await this.putDocument('courses', updated)
    return { ...updated, _rev: result.rev }
  }

  // Student enrollment
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
      const result = await this.putDocument('courses', updatedCourse)
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
    const result = await this.putDocument('courses', updatedCourse)
    return { ...updatedCourse, _rev: result.rev }
  }

  // Initialize databases
  async initialize(): Promise<void> {
    try {
      console.log('Initializing CouchDB databases...')
      
      // Create all databases
      await Promise.all([
        this.createDatabase('users'),
        this.createDatabase('courses'),
        this.createDatabase('sessions'),
        this.createDatabase('events'),
        this.createDatabase('metrics'),
        this.createDatabase('settings')
      ])

      console.log('CouchDB databases initialized successfully')
    } catch (error) {
      console.error('Failed to initialize CouchDB databases:', error)
      throw error
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      console.log('Clearing all CouchDB data...')
      
      const dbNames = ['users', 'courses', 'sessions', 'events', 'metrics', 'settings']
      
      for (const dbName of dbNames) {
        try {
          // Delete the database
          await this.request(`/zoomies_${dbName}`, { method: 'DELETE' })
          console.log(`Deleted database: zoomies_${dbName}`)
          
          // Recreate the database
          await this.request(`/zoomies_${dbName}`, { method: 'PUT' })
          console.log(`Recreated database: zoomies_${dbName}`)
        } catch (error) {
          console.error(`Failed to clear/recreate database zoomies_${dbName}:`, error)
        }
      }
      
      console.log('All CouchDB data cleared and databases recreated')
    } catch (error) {
      console.error('Failed to clear all data:', error)
      throw error
    }
  }

  async clearAllCourses(): Promise<void> {
    try {
      console.log('Clearing all courses...')
      
      // Get all courses first
      const allCourses = await this.getAllCourses()
      console.log(`Found ${allCourses.length} courses to delete`)
      
      // Delete each course document
      for (const course of allCourses) {
        try {
          await this.request(`/zoomies_courses/${course._id}?rev=${course._rev}`, {
            method: 'DELETE'
          })
          console.log(`Deleted course: ${course.title}`)
        } catch (error) {
          console.error(`Failed to delete course ${course.title}:`, error)
        }
      }
      
      console.log('All courses cleared successfully')
    } catch (error) {
      console.error('Failed to clear courses:', error)
      throw error
    }
  }

  // Additional methods for compatibility
  generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Placeholder methods for other functionality
  async createSession(session: any): Promise<any> {
    const now = new Date().toISOString()
    const sessionDoc = {
      ...session,
      _id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now
    }

    const result = await this.putDocument('sessions', sessionDoc)
    return { ...sessionDoc, _rev: result.rev }
  }

  async getSessionById(sessionId: string): Promise<any> {
    try {
      return await this.getDocument('sessions', sessionId)
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async updateSession(sessionId: string, updates: any): Promise<any> {
    const existing = await this.getSessionById(sessionId)
    if (!existing) {
      throw new Error('Session not found')
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const result = await this.putDocument('sessions', updated)
    return { ...updated, _rev: result.rev }
  }

  async createEvent(event: any): Promise<any> {
    const now = new Date().toISOString()
    const eventDoc = {
      ...event,
      _id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now
    }

    const result = await this.putDocument('events', eventDoc)
    return { ...eventDoc, _rev: result.rev }
  }

  async getSettings(): Promise<any> {
    try {
      return await this.getDocument('settings', 'app_settings')
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async updateSettings(updates: any): Promise<any> {
    const existing = await this.getSettings()
    if (!existing) {
      throw new Error('Settings document not found')
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const result = await this.putDocument('settings', updated)
    return { ...updated, _rev: result.rev }
  }

  // Get users by role
  async getUsersByRole(role: 'teacher' | 'student'): Promise<UserDocument[]> {
    try {
      return await this.findDocuments('users', { role, type: 'user' })
    } catch (error) {
      console.error('Error getting users by role:', error)
      return []
    }
  }

  // Student enrollment methods
  async enrollStudentInCourse(studentId: string, courseId: string): Promise<UserDocument> {
    const student = await this.getUserById(studentId)
    if (!student) {
      throw new Error('Student not found')
    }

    if (!student.enrolledCourses.includes(courseId)) {
      const updatedStudent = {
        ...student,
        enrolledCourses: [...student.enrolledCourses, courseId],
        updatedAt: new Date().toISOString()
      }
      const result = await this.putDocument('users', updatedStudent)
      return { ...updatedStudent, _rev: result.rev }
    }

    return student
  }

  async unenrollStudentFromCourse(studentId: string, courseId: string): Promise<UserDocument> {
    const student = await this.getUserById(studentId)
    if (!student) {
      throw new Error('Student not found')
    }

    const updatedStudent = {
      ...student,
      enrolledCourses: student.enrolledCourses.filter(id => id !== courseId),
      updatedAt: new Date().toISOString()
    }
    const result = await this.putDocument('users', updatedStudent)
    return { ...updatedStudent, _rev: result.rev }
  }

  // Additional methods for compatibility with existing code
  
  // Get events by session
  async getEventsBySession(sessionId: string): Promise<any[]> {
    try {
      return await this.findDocuments('events', { sessionId, type: 'event' })
    } catch (error) {
      console.error('Error getting events by session:', error)
      return []
    }
  }

  // Get session (alias for getSessionById)
  async getSession(sessionId: string): Promise<any> {
    return this.getSessionById(sessionId)
  }

  async getEventsByUsers(userIds: string[], options?: { limit?: number; since?: number; eventTypes?: string[]; courseIds?: string[] }): Promise<any[]> {
    if (!userIds || userIds.length === 0) {
      return []
    }

    try {
      const selector: any = {
        type: 'event',
        userId: { '$in': userIds }
      }

      if (options?.since) {
        selector.timestamp = { '$gte': options.since }
      }

      if (options?.eventTypes && options.eventTypes.length > 0) {
        selector.eventType = { '$in': options.eventTypes }
      }

      if (options?.courseIds && options.courseIds.length > 0) {
        selector.courseId = { '$in': options.courseIds }
      }

      const limit = options?.limit ?? 500
      return await this.findDocuments('events', selector, limit)
    } catch (error) {
      console.error('Error getting events by users:', error)
      return []
    }
  }

  // Get metrics by session
  async getMetricsBySession(sessionId: string): Promise<any[]> {
    try {
      return await this.findDocuments('metrics', { sessionId, type: 'metrics' })
    } catch (error) {
      console.error('Error getting metrics by session:', error)
      return []
    }
  }

  // Update metrics
  async updateMetrics(sessionId: string, metrics: any): Promise<any> {
    try {
      const existingMetrics = await this.getMetricsBySession(sessionId)
      if (existingMetrics.length > 0) {
        const existing = existingMetrics[0]
        const updated = { ...existing, ...metrics, updatedAt: new Date().toISOString() }
        const result = await this.putDocument('metrics', updated)
        return { ...updated, _rev: result.rev }
      } else {
        return await this.createMetrics(metrics)
      }
    } catch (error) {
      console.error('Error updating metrics:', error)
      throw error
    }
  }

  // Get recent sessions
  async getRecentSessions(limit: number = 100): Promise<any[]> {
    try {
      return await this.findDocuments('sessions', { type: 'session' }, limit)
    } catch (error) {
      console.error('Error getting recent sessions:', error)
      return []
    }
  }

  // Get recent events
  async getRecentEvents(limit: number = 100): Promise<any[]> {
    try {
      return await this.findDocuments('events', { type: 'event' }, limit)
    } catch (error) {
      console.error('Error getting recent events:', error)
      return []
    }
  }

  // Create metrics
  async createMetrics(metrics: Omit<any, '_id' | '_rev' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'type'> & { _id?: string }): Promise<any> {
    const now = new Date().toISOString()
    const metricsDoc = {
      ...metrics,
      _id: metrics._id || `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      type: 'metrics'
    }
    return await this.putDocument('metrics', metricsDoc)
  }

  // Export data
  async exportData(): Promise<any> {
    try {
      const [users, courses, sessions, events, metrics, settings] = await Promise.all([
        this.getAllUsers(),
        this.getAllCourses(),
        this.getRecentSessions(1000),
        this.getRecentEvents(1000),
        this.findDocuments('metrics', { type: 'metrics' }, 1000),
        this.getSettings()
      ])

      return {
        users,
        courses,
        sessions,
        events,
        metrics,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  // Close method for compatibility
  async close(): Promise<void> {
    console.log('SimpleCouchDBClient closed')
  }
}

// Export singleton instance
export const zoomiesDB = new SimpleCouchDBClient()
export default zoomiesDB
