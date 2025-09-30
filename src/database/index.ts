// Zoomies Database System Main Entry Point
import { zoomiesDB } from './database'
import { eventLogger } from './eventLogger'
import { metricsCalculator } from './metricsCalculator'
import { multiTabManager } from './multiTabManager'
import { privacyManager } from './privacyManager'
import { migrationManager } from './migrationManager'
import { storageManager } from './storageManager'

// Export all modules
export { zoomiesDB, eventLogger, metricsCalculator, multiTabManager, privacyManager, migrationManager, storageManager }

// Export types
export * from './types'

// Database system initializer
export class DatabaseSystem {
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing Zoomies database system...')

      // 1. 請求隱私同意
      const consentGiven = await privacyManager.requestConsent()
      if (!consentGiven) {
        throw new Error('User consent required for database initialization')
      }

      // 2. 初始化隱私管理器
      await privacyManager.initializeEncryption()

      // 3. 初始化數據庫
      await zoomiesDB.initialize()

      // 4. 執行數據遷移
      if (migrationManager.needsMigration()) {
        await migrationManager.migrate()
      }

      // 5. 請求持久存儲
      await storageManager.requestPersistentStorage()

      // 6. 設置存儲配額
      storageManager.setStorageQuota({
        maxEvents: 10000,
        maxSessions: 1000,
        retentionDays: 30,
        compressionEnabled: true
      })

      // 7. 開始定期清理
      storageManager.startPeriodicCleanup()

      this.isInitialized = true
      console.log('Zoomies database system initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database system:', error)
      throw error
    }
  }

  // 創建新會話
  async createSession(subject: string, duration?: number): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    const sessionId = zoomiesDB.generateId('session')
    
    await zoomiesDB.createSession({
      type: 'session',
      sessionId,
      userId: 'default-user', // 臨時用戶ID，實際應用中應該從認證系統獲取
      subject,
      startedAt: new Date().toISOString(),
      duration: duration || 0,
      isActive: true,
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })

    // 設置事件記錄器的會話 ID
    eventLogger.setCurrentSession(sessionId)

    // 通知多標籤頁管理器
    multiTabManager.notifySessionStart(sessionId, subject)

    // 記錄會話開始事件
    await eventLogger.logSessionStart(subject, duration)

    // 開始實時指標更新
    metricsCalculator.startRealTimeUpdates(sessionId)

    return sessionId
  }

  // 結束會話
  async endSession(sessionId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    try {
      const session = await zoomiesDB.getSession(sessionId)
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      const endTime = new Date().toISOString()
      const duration = Math.floor((new Date(endTime).getTime() - new Date(session.startedAt).getTime()) / 1000)

      // 更新會話
      await zoomiesDB.updateSession(sessionId, {
        endedAt: endTime,
        duration,
        isActive: false
      })

      // 記錄會話結束事件
      await eventLogger.logSessionEnd(session.subject, duration)

      // 停止實時指標更新
      metricsCalculator.stopRealTimeUpdates()

      // 計算最終指標
      await metricsCalculator.updateSessionMetrics(sessionId)

      // 通知多標籤頁管理器
      multiTabManager.notifySessionEnd(sessionId, session.subject, duration)

      // 強制刷新事件緩衝區
      await eventLogger.forceFlush()

      console.log(`Session ${sessionId} ended successfully`)
    } catch (error) {
      console.error('Failed to end session:', error)
      throw error
    }
  }

  // 記錄注意力事件
  async logAttentionEvent(
    type: 'present' | 'lost',
    data: {
      attentionLevel?: number
      reason?: 'no_face' | 'yaw' | 'pitch' | 'tab_hidden' | 'input_idle' | 'window_blur'
      confidence?: number
    }
  ): Promise<void> {
    if (!this.isInitialized) return

    try {
      if (type === 'present') {
        await eventLogger.logAttentionPresent(
          data.attentionLevel || 1,
          data.confidence
        )
      } else {
        await eventLogger.logAttentionLost(
          data.reason || 'input_idle'
        )
      }

      // 通知多標籤頁管理器
      multiTabManager.notifyEventLog(`attention:${type}`, eventLogger.getBufferStatus().eventCount.toString())
    } catch (error) {
      console.error('Failed to log attention event:', error)
    }
  }

  // 記錄提醒事件
  async logNudgeEvent(
    nudgeType: 'nudge1' | 'nudge2',
    soundPlayed = false
  ): Promise<void> {
    if (!this.isInitialized) return

    try {
      await eventLogger.logNudgeShown(nudgeType, soundPlayed)
      
      // 通知多標籤頁管理器
      multiTabManager.notifyEventLog(`${nudgeType}:shown`, eventLogger.getBufferStatus().eventCount.toString())
    } catch (error) {
      console.error('Failed to log nudge event:', error)
    }
  }

  // 記錄恢復事件
  async logFocusRegained(responseTime?: number): Promise<void> {
    if (!this.isInitialized) return

    try {
      await eventLogger.logFocusRegained(responseTime)
      
      // 通知多標籤頁管理器
      multiTabManager.notifyEventLog('focus:regained', eventLogger.getBufferStatus().eventCount.toString())
    } catch (error) {
      console.error('Failed to log focus regained event:', error)
    }
  }

  // 獲取會話統計
  async getSessionStats(sessionId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    try {
      const metrics = await zoomiesDB.getMetricsBySession(sessionId)
      if (!metrics) {
        return null
      }

      return {
        focusPercentage: metrics.focusPercentage,
        totalNudges: metrics.totalNudges,
        averageResponseTime: metrics.averageResponseTime,
        sessionDuration: metrics.totalSessionTime,
        recommendations: metricsCalculator.generateLearningRecommendations(metrics)
      }
    } catch (error) {
      console.error('Failed to get session stats:', error)
      return null
    }
  }

  // 獲取總體統計
  async getOverallStats(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    try {
      return await metricsCalculator.calculateOverallStats()
    } catch (error) {
      console.error('Failed to get overall stats:', error)
      return null
    }
  }

  // 獲取存儲狀態
  async getStorageStatus(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    try {
      return await storageManager.getStorageStats()
    } catch (error) {
      console.error('Failed to get storage status:', error)
      return null
    }
  }

  // 清理所有數據
  async clearAllData(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    try {
      await privacyManager.clearAllData()
      await storageManager.clearAllStorage()
      eventLogger.clearBuffer()
      console.log('All data cleared successfully')
    } catch (error) {
      console.error('Failed to clear all data:', error)
      throw error
    }
  }

  // 導出數據
  async exportData(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Database system not initialized')
    }

    try {
      return await zoomiesDB.exportData()
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }

  // 關閉系統
  async shutdown(): Promise<void> {
    try {
      // 停止所有定時器
      metricsCalculator.stopRealTimeUpdates()
      storageManager.stopPeriodicCleanup()
      
      // 刷新事件緩衝區
      await eventLogger.forceFlush()
      
      // 關閉數據庫連接
      await zoomiesDB.close()
      
      // 清理多標籤頁管理器
      multiTabManager.destroy()
      
      this.isInitialized = false
      console.log('Database system shutdown completed')
    } catch (error) {
      console.error('Failed to shutdown database system:', error)
    }
  }

  // 檢查是否已初始化
  getInitializationStatus(): boolean {
    return this.isInitialized
  }
}

// 導出單例實例
export const databaseSystem = new DatabaseSystem()
export default databaseSystem
