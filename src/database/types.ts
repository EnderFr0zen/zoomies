// Zoomies Database Type Definitions
export const SCHEMA_VERSION = 1

// Base Document Interface
export interface BaseDocument {
  _id: string
  _rev?: string
  schemaVersion: number
  createdAt: string // ISO8601
  updatedAt: string // ISO8601
}

// User Role Type
export type UserRole = 'teacher' | 'student'

// User Document
export interface UserDocument extends BaseDocument {
  type: 'user'
  username: string
  email: string
  role: UserRole
  displayName: string
  isActive: boolean
  teacherId?: string // Teacher ID for students
  enrolledCourses: string[] // List of course IDs
  preferences: {
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
  }
}

// Course Document
export interface CourseDocument extends BaseDocument {
  type: 'course'
  title: string
  description: string
  teacherId: string
  studentIds: string[]
  isActive: boolean
  content: CourseContent
}

// Course Content
export interface CourseContent {
  instructions: string // Course instructions in Markdown format
  readings: ReadingItem[]
  lastModified: string
  modifiedBy: string
}

// Reading Material Item
export interface ReadingItem {
  id: string
  title: string
  type: 'pdf'
  url: string
  size?: number
  order: number
}

// Session Document
export interface SessionDocument extends BaseDocument {
  type: 'session'
  sessionId: string
  userId: string
  courseId?: string
  subject: string
  startedAt: string // ISO8601
  endedAt?: string // ISO8601
  duration: number // seconds
  isActive: boolean
  metadata: {
    userAgent: string
    screenResolution: string
    timezone: string
  }
}

// Event Document
export interface EventDocument extends BaseDocument {
  type: 'event'
  sessionId: string
  userId: string
  eventType: EventType
  timestamp: string // ISO8601
  data: EventData
  confidence?: number // 0-1
}

// Event Type
export type EventType = 
  // Attention events
  | 'attention:present'
  | 'attention:lost'
  // Gaze detection events
  | 'gaze:focused'
  | 'gaze:distracted'
  | 'gaze:looking_away'
  | 'gaze:back_to_screen'
  // Nudge events
  | 'nudge1:shown'
  | 'nudge2:shown'
  | 'nudge:sound_played'
  // Recovery events
  | 'focus:regained'
  // Session lifecycle
  | 'session:start'
  | 'session:end'
  // Optional UX events
  | 'koala:dragged'
  | 'koala:clicked'
  | 'settings:changed'

// Event Data
export interface EventData {
  // Attention related
  reason?: 'no_face' | 'yaw' | 'pitch' | 'tab_hidden' | 'tab_visible' | 'input_idle' | 'window_blur' | 'window_focus' | 'course_focus' | 'course_exit' | 'tab_navigation'
  attentionLevel?: number // 0-1
  
  // Gaze detection related
  gazeConfidence?: number // 0-1
  gazeDuration?: number // milliseconds
  faceDetected?: boolean
  faceCenterX?: number
  faceCenterY?: number
  distanceFromCenter?: number
  
  // Nudge related
  nudgeType?: 'nudge1' | 'nudge2'
  soundPlayed?: boolean
  
  // Session related
  subject?: string
  duration?: number
  
  // Settings related
  settingName?: string
  settingValue?: any
  
  // General
  message?: string
  metadata?: Record<string, any>
}

// Metrics Document
export interface MetricsDocument extends BaseDocument {
  type: 'metrics'
  sessionId: string
  userId: string
  courseId?: string
  sessionStartTime: string // ISO8601
  sessionEndTime?: string // ISO8601
  
  // Core metrics
  focusPercentage: number // 0-100
  totalNudges: number
  nudge1Count: number
  nudge2Count: number
  averageResponseTime: number // seconds
  
  // Time distribution
  totalSessionTime: number // seconds
  focusedTime: number // seconds
  distractedTime: number // seconds
  
  // Detailed statistics
  attentionEvents: {
    present: number
    lost: number
    regained: number
  }
  
  // Historical data (optional)
  focusHistory?: Array<{
    timestamp: string
    focusLevel: number
  }>
  
  // Aggregated data
  hourlyBreakdown?: Array<{
    hour: number
    focusPercentage: number
    nudgeCount: number
  }>
}

// Settings Document
export interface SettingsDocument extends BaseDocument {
  type: 'settings'
  userId?: string // Optional user ID
  isDefault: boolean
  
  // Koala settings
  koala: {
    position: {
      x: number
      y: number
    }
    isMuted: boolean
    reducedMotion: boolean
  }
  
  // Privacy settings
  privacy: {
    consentGiven: boolean
    consentDate?: string
    dataRetentionDays: number
    allowAnalytics: boolean
  }
  
  // Learning settings
  learning: {
    defaultSubject: string
    sessionDuration: number // minutes
    nudgeSensitivity: 'low' | 'medium' | 'high'
    breakReminders: boolean
  }
  
  // Notification settings
  notifications: {
    soundEnabled: boolean
    visualEnabled: boolean
    vibrationEnabled: boolean
  }
}

// Database Names
export const DATABASE_NAMES = {
  USERS: 'zoomies-users',
  COURSES: 'zoomies-courses',
  SESSIONS: 'zoomies-sessions',
  EVENTS: 'zoomies-events',
  METRICS: 'zoomies-metrics',
  SETTINGS: 'zoomies-settings'
} as const

// Query Options
export interface QueryOptions {
  limit?: number
  skip?: number
  include_docs?: boolean
  descending?: boolean
  startkey?: any
  endkey?: any
}

// Event Buffer
export interface EventBuffer {
  events: EventDocument[]
  lastFlush: number
  maxBufferSize: number
  flushInterval: number
}

// Storage Quota
export interface StorageQuota {
  maxEvents: number
  maxSessions: number
  retentionDays: number
  compressionEnabled: boolean
}

// Gaze Detection Types
export interface GazeEvent {
  type: 'gaze:focused' | 'gaze:distracted' | 'gaze:looking_away' | 'gaze:back_to_screen'
  timestamp: number
  confidence: number
  duration: number
  gazeConfidence?: number
  gazeDuration?: number
  faceDetected?: boolean
  faceCenterX?: number
  faceCenterY?: number
  distanceFromCenter?: number
}

export interface GazeSession {
  sessionId: string
  userId: string
  courseId: string
  startTime: number
  endTime: number | null
  events: GazeEvent[]
  totalFocusTime: number
  totalDistractionTime: number
  distractionCount: number
  lastActivity: number
}
