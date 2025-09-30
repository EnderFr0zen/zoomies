import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
import type { 
  BaseDocument, 
  SessionDocument, 
  EventDocument, 
  MetricsDocument, 
  SettingsDocument
} from './types'
import { DATABASE_NAMES, SCHEMA_VERSION } from './types'

// 註冊 PouchDB 插件
PouchDB.plugin(PouchDBFind)

// 數據庫實例
class ZoomiesDatabase {
  private readonly sessionsDB: PouchDB.Database<SessionDocument>
  private readonly eventsDB: PouchDB.Database<EventDocument>
  private readonly metricsDB: PouchDB.Database<MetricsDocument>
  private readonly settingsDB: PouchDB.Database<SettingsDocument>
  
  private isInitialized = false
  private indexesCreated = false

  constructor() {
    // 初始化數據庫實例
    this.sessionsDB = new PouchDB<SessionDocument>(DATABASE_NAMES.SESSIONS)
    this.eventsDB = new PouchDB<EventDocument>(DATABASE_NAMES.EVENTS)
    this.metricsDB = new PouchDB<MetricsDocument>(DATABASE_NAMES.METRICS)
    this.settingsDB = new PouchDB<SettingsDocument>(DATABASE_NAMES.SETTINGS)
  }

  // 初始化數據庫
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 請求持久存儲
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersistent = await navigator.storage.persist()
        console.log('Persistent storage granted:', isPersistent)
      }

      // 創建索引
      await this.createIndexes()
      
      // 初始化默認設置
      await this.initializeDefaultSettings()
      
      this.isInitialized = true
      console.log('Zoomies database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  // 創建數據庫索引
  private async createIndexes(): Promise<void> {
    if (this.indexesCreated) return

    try {
      // Events 數據庫索引
      await this.eventsDB.createIndex({
        index: {
          fields: ['sessionId', 'timestamp']
        }
      })

      await this.eventsDB.createIndex({
        index: {
          fields: ['timestamp']
        }
      })

      await this.eventsDB.createIndex({
        index: {
          fields: ['eventType', 'timestamp']
        }
      })

      // Sessions 數據庫索引
      await this.sessionsDB.createIndex({
        index: {
          fields: ['startedAt']
        }
      })

      await this.sessionsDB.createIndex({
        index: {
          fields: ['isActive']
        }
      })

      // Metrics 數據庫索引
      await this.metricsDB.createIndex({
        index: {
          fields: ['sessionId']
        }
      })

      await this.metricsDB.createIndex({
        index: {
          fields: ['sessionStartTime']
        }
      })

      // Settings 數據庫索引
      await this.settingsDB.createIndex({
        index: {
          fields: ['isDefault']
        }
      })

      this.indexesCreated = true
      console.log('Database indexes created successfully')
    } catch (error) {
      console.error('Failed to create indexes:', error)
      throw error
    }
  }

  // 初始化默認設置
  private async initializeDefaultSettings(): Promise<void> {
    try {
      const existingSettings = await this.settingsDB.find({
        selector: { isDefault: true },
        limit: 1
      })

      if (existingSettings.docs.length === 0) {
        const defaultSettings: SettingsDocument = {
          _id: 'settings:default',
          schemaVersion: SCHEMA_VERSION,
          type: 'settings',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          koala: {
            position: { x: window.innerWidth - 150, y: window.innerHeight - 150 },
            isMuted: false,
            reducedMotion: false
          },
          privacy: {
            consentGiven: false,
            dataRetentionDays: 30,
            allowAnalytics: false
          },
          learning: {
            defaultSubject: 'Mathematics',
            sessionDuration: 30,
            nudgeSensitivity: 'medium',
            breakReminders: true
          },
          notifications: {
            soundEnabled: true,
            visualEnabled: true,
            vibrationEnabled: false
          }
        }

        await this.settingsDB.put(defaultSettings)
        console.log('Default settings initialized')
      }
    } catch (error) {
      console.error('Failed to initialize default settings:', error)
    }
  }

  // 生成文檔 ID
  generateId(type: 'session' | 'event' | 'metrics' | 'settings', ...parts: string[]): string {
    const timestamp = new Date().toISOString()
    switch (type) {
      case 'session':
        return `session:${timestamp}`
      case 'event':
        return `evt:${parts[0]}:${Date.now()}`
      case 'metrics':
        return `metric:${parts[0]}`
      case 'settings':
        return parts[0] ? `settings:${parts[0]}` : 'settings:default'
      default:
        throw new Error(`Unknown document type: ${type}`)
    }
  }

  // 添加基礎文檔字段
  private addBaseFields<T extends BaseDocument>(doc: Omit<T, keyof BaseDocument>, id: string): T {
    const now = new Date().toISOString()
    return {
      ...doc,
      _id: id,
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now
    } as T
  }

  // Sessions 操作
  async createSession(sessionData: Omit<SessionDocument, keyof BaseDocument>): Promise<SessionDocument> {
    const id = this.generateId('session')
    const session = this.addBaseFields(sessionData, id)
    await this.sessionsDB.put(session)
    return session
  }

  async getSession(sessionId: string): Promise<SessionDocument | null> {
    try {
      const doc = await this.sessionsDB.get(sessionId)
      return doc
    } catch (error) {
      if ((error as any).status === 404) return null
      throw error
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionDocument>): Promise<SessionDocument> {
    const doc = await this.sessionsDB.get(sessionId)
    const updated = {
      ...doc,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await this.sessionsDB.put(updated)
    return updated
  }

  async getActiveSessions(): Promise<SessionDocument[]> {
    const result = await this.sessionsDB.find({
      selector: { isActive: true },
      sort: [{ startedAt: 'desc' }]
    })
    return result.docs
  }

  async getRecentSessions(limit = 10): Promise<SessionDocument[]> {
    const result = await this.sessionsDB.find({
      selector: {},
      sort: [{ startedAt: 'desc' }],
      limit
    })
    return result.docs
  }

  // Events 操作
  async createEvent(eventData: Omit<EventDocument, keyof BaseDocument>): Promise<EventDocument> {
    const id = this.generateId('event', eventData.sessionId)
    const event = this.addBaseFields(eventData, id)
    await this.eventsDB.put(event)
    return event
  }

  async getEventsBySession(sessionId: string, limit?: number): Promise<EventDocument[]> {
    const result = await this.eventsDB.find({
      selector: { sessionId },
      sort: [{ sessionId: 'asc' }, { timestamp: 'asc' }],
      limit
    })
    return result.docs
  }

  async getRecentEvents(limit = 100): Promise<EventDocument[]> {
    const result = await this.eventsDB.find({
      selector: {},
      sort: [{ timestamp: 'desc' }],
      limit
    })
    return result.docs
  }

  async getEventsByType(eventType: string, limit = 100): Promise<EventDocument[]> {
    const result = await this.eventsDB.find({
      selector: { eventType },
      sort: [{ eventType: 'asc' }, { timestamp: 'desc' }],
      limit
    })
    return result.docs
  }

  // Metrics 操作
  async createMetrics(metricsData: Omit<MetricsDocument, keyof BaseDocument>): Promise<MetricsDocument> {
    const id = this.generateId('metrics', metricsData.sessionId)
    const metrics = this.addBaseFields(metricsData, id)
    await this.metricsDB.put(metrics)
    return metrics
  }

  async getMetricsBySession(sessionId: string): Promise<MetricsDocument | null> {
    try {
      const result = await this.metricsDB.find({
        selector: { sessionId },
        limit: 1
      })
      return result.docs[0] || null
    } catch (error) {
      console.error('Failed to get metrics:', error)
      return null
    }
  }

  async updateMetrics(sessionId: string, updates: Partial<MetricsDocument>): Promise<MetricsDocument> {
    const existing = await this.getMetricsBySession(sessionId)
    if (!existing) {
      throw new Error(`Metrics not found for session: ${sessionId}`)
    }
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await this.metricsDB.put(updated)
    return updated
  }

  // Settings 操作
  async getSettings(userId?: string): Promise<SettingsDocument> {
    const id = userId ? `settings:${userId}` : 'settings:default'
    try {
      const doc = await this.settingsDB.get(id)
      return doc
    } catch (error) {
      if ((error as any).status === 404) {
        // 返回默認設置
        const defaultDoc = await this.settingsDB.get('settings:default')
        return defaultDoc
      }
      throw error
    }
  }

  async updateSettings(settings: Partial<SettingsDocument>, userId?: string): Promise<SettingsDocument> {
    const id = userId ? `settings:${userId}` : 'settings:default'
    const existing = await this.getSettings(userId)
    
    const updated = {
      ...existing,
      ...settings,
      _id: id,
      updatedAt: new Date().toISOString()
    }
    
    await this.settingsDB.put(updated)
    return updated
  }

  // 數據清理
  async cleanupOldData(retentionDays = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    const cutoffISO = cutoffDate.toISOString()

    try {
      // 清理舊事件
      const oldEvents = await this.eventsDB.find({
        selector: {
          timestamp: { $lt: cutoffISO }
        }
      })

      if (oldEvents.docs.length > 0) {
        const eventsToDelete = oldEvents.docs.map((doc: any) => ({
          ...doc,
          _deleted: true
        }))
        await this.eventsDB.bulkDocs(eventsToDelete as any)
        console.log(`Cleaned up ${oldEvents.docs.length} old events`)
      }

      // 清理舊會話
      const oldSessions = await this.sessionsDB.find({
        selector: {
          startedAt: { $lt: cutoffISO },
          isActive: false
        }
      })

      if (oldSessions.docs.length > 0) {
        const sessionsToDelete = oldSessions.docs.map((doc: any) => ({
          ...doc,
          _deleted: true
        }))
        await this.sessionsDB.bulkDocs(sessionsToDelete as any)
        console.log(`Cleaned up ${oldSessions.docs.length} old sessions`)
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error)
    }
  }

  // 導出數據
  async exportData(): Promise<{
    sessions: SessionDocument[]
    events: EventDocument[]
    metrics: MetricsDocument[]
    settings: SettingsDocument[]
  }> {
    const [sessions, events, metrics, settings] = await Promise.all([
      this.sessionsDB.allDocs({ include_docs: true }),
      this.eventsDB.allDocs({ include_docs: true }),
      this.metricsDB.allDocs({ include_docs: true }),
      this.settingsDB.allDocs({ include_docs: true })
    ])

    return {
      sessions: sessions.rows.map((row: any) => row.doc!).filter(Boolean),
      events: events.rows.map((row: any) => row.doc!).filter(Boolean),
      metrics: metrics.rows.map((row: any) => row.doc!).filter(Boolean),
      settings: settings.rows.map((row: any) => row.doc!).filter(Boolean)
    }
  }

  // 關閉數據庫連接
  async close(): Promise<void> {
    await Promise.all([
      this.sessionsDB.close(),
      this.eventsDB.close(),
      this.metricsDB.close(),
      this.settingsDB.close()
    ])
  }
}

// 導出單例實例
export const zoomiesDB = new ZoomiesDatabase()
export default zoomiesDB
