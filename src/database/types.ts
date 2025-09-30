// Zoomies 數據庫類型定義
export const SCHEMA_VERSION = 1

// 基礎文檔接口
export interface BaseDocument {
  _id: string
  _rev?: string
  schemaVersion: number
  createdAt: string // ISO8601
  updatedAt: string // ISO8601
}

// 會話文檔
export interface SessionDocument extends BaseDocument {
  type: 'session'
  sessionId: string
  subject: string
  startedAt: string // ISO8601
  endedAt?: string // ISO8601
  duration: number // 秒
  isActive: boolean
  metadata: {
    userAgent: string
    screenResolution: string
    timezone: string
  }
}

// 事件文檔
export interface EventDocument extends BaseDocument {
  type: 'event'
  sessionId: string
  eventType: EventType
  timestamp: string // ISO8601
  data: EventData
  confidence?: number // 0-1
}

// 事件類型
export type EventType = 
  // 注意力事件
  | 'attention:present'
  | 'attention:lost'
  // 提醒事件
  | 'nudge1:shown'
  | 'nudge2:shown'
  | 'nudge:sound_played'
  // 恢復事件
  | 'focus:regained'
  // 會話生命週期
  | 'session:start'
  | 'session:end'
  // 可選 UX 事件
  | 'koala:dragged'
  | 'koala:clicked'
  | 'settings:changed'

// 事件數據
export interface EventData {
  // 注意力相關
  reason?: 'no_face' | 'yaw' | 'pitch' | 'tab_hidden' | 'input_idle' | 'window_blur'
  attentionLevel?: number // 0-1
  
  // 提醒相關
  nudgeType?: 'nudge1' | 'nudge2'
  soundPlayed?: boolean
  
  // 會話相關
  subject?: string
  duration?: number
  
  // 設置相關
  settingName?: string
  settingValue?: any
  
  // 通用
  message?: string
  metadata?: Record<string, any>
}

// 指標文檔
export interface MetricsDocument extends BaseDocument {
  type: 'metrics'
  sessionId: string
  sessionStartTime: string // ISO8601
  sessionEndTime?: string // ISO8601
  
  // 核心指標
  focusPercentage: number // 0-100
  totalNudges: number
  nudge1Count: number
  nudge2Count: number
  averageResponseTime: number // 秒
  
  // 時間分佈
  totalSessionTime: number // 秒
  focusedTime: number // 秒
  distractedTime: number // 秒
  
  // 詳細統計
  attentionEvents: {
    present: number
    lost: number
    regained: number
  }
  
  // 歷史數據（可選）
  focusHistory?: Array<{
    timestamp: string
    focusLevel: number
  }>
  
  // 聚合數據
  hourlyBreakdown?: Array<{
    hour: number
    focusPercentage: number
    nudgeCount: number
  }>
}

// 設置文檔
export interface SettingsDocument extends BaseDocument {
  type: 'settings'
  userId?: string // 可選用戶 ID
  isDefault: boolean
  
  // 考拉設置
  koala: {
    position: {
      x: number
      y: number
    }
    isMuted: boolean
    reducedMotion: boolean
  }
  
  // 隱私設置
  privacy: {
    consentGiven: boolean
    consentDate?: string
    dataRetentionDays: number
    allowAnalytics: boolean
  }
  
  // 學習設置
  learning: {
    defaultSubject: string
    sessionDuration: number // 分鐘
    nudgeSensitivity: 'low' | 'medium' | 'high'
    breakReminders: boolean
  }
  
  // 通知設置
  notifications: {
    soundEnabled: boolean
    visualEnabled: boolean
    vibrationEnabled: boolean
  }
}

// 數據庫名稱
export const DATABASE_NAMES = {
  SESSIONS: 'zoomies-sessions',
  EVENTS: 'zoomies-events',
  METRICS: 'zoomies-metrics',
  SETTINGS: 'zoomies-settings'
} as const

// 查詢選項
export interface QueryOptions {
  limit?: number
  skip?: number
  include_docs?: boolean
  descending?: boolean
  startkey?: any
  endkey?: any
}

// 事件緩衝
export interface EventBuffer {
  events: EventDocument[]
  lastFlush: number
  maxBufferSize: number
  flushInterval: number
}

// 存儲配額
export interface StorageQuota {
  maxEvents: number
  maxSessions: number
  retentionDays: number
  compressionEnabled: boolean
}
