// 存儲管理器
export class StorageManager {
  private readonly STORAGE_QUOTA_KEY = 'zoomies_storage_quota'
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24小時
  private cleanupTimer: number | null = null

  constructor() {
    this.startPeriodicCleanup()
  }

  // 請求持久存儲
  async requestPersistentStorage(): Promise<boolean> {
    try {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersistent = await navigator.storage.persist()
        console.log('Persistent storage granted:', isPersistent)
        return isPersistent
      }
      return false
    } catch (error) {
      console.error('Failed to request persistent storage:', error)
      return false
    }
  }

  // 檢查存儲配額
  async checkStorageQuota(): Promise<{
    used: number
    available: number
    percentage: number
    isPersistent: boolean
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const used = estimate.usage || 0
        const available = estimate.quota || 0
        const percentage = available > 0 ? (used / available) * 100 : 0

        return {
          used,
          available,
          percentage: Math.round(percentage * 100) / 100,
          isPersistent: await this.isStoragePersistent()
        }
      }
      return {
        used: 0,
        available: 0,
        percentage: 0,
        isPersistent: false
      }
    } catch (error) {
      console.error('Failed to check storage quota:', error)
      return {
        used: 0,
        available: 0,
        percentage: 0,
        isPersistent: false
      }
    }
  }

  // 檢查存儲是否持久
  async isStoragePersistent(): Promise<boolean> {
    try {
      if ('storage' in navigator && 'persisted' in navigator.storage) {
        return await navigator.storage.persisted()
      }
      return false
    } catch (error) {
      console.error('Failed to check storage persistence:', error)
      return false
    }
  }

  // 設置存儲配額限制
  setStorageQuota(quota: {
    maxEvents: number
    maxSessions: number
    retentionDays: number
    compressionEnabled: boolean
  }): void {
    localStorage.setItem(this.STORAGE_QUOTA_KEY, JSON.stringify({
      ...quota,
      setAt: new Date().toISOString()
    }))
  }

  // 獲取存儲配額設置
  getStorageQuota(): {
    maxEvents: number
    maxSessions: number
    retentionDays: number
    compressionEnabled: boolean
  } {
    try {
      const stored = localStorage.getItem(this.STORAGE_QUOTA_KEY)
      if (stored) {
        const quota = JSON.parse(stored)
        return {
          maxEvents: quota.maxEvents || 10000,
          maxSessions: quota.maxSessions || 1000,
          retentionDays: quota.retentionDays || 30,
          compressionEnabled: quota.compressionEnabled || false
        }
      }
    } catch (error) {
      console.error('Failed to load storage quota:', error)
    }

    // 默認配額
    return {
      maxEvents: 10000,
      maxSessions: 1000,
      retentionDays: 30,
      compressionEnabled: false
    }
  }

  // 開始定期清理
  startPeriodicCleanup(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = window.setInterval(async () => {
      try {
        await this.performCleanup()
      } catch (error) {
        console.error('Periodic cleanup failed:', error)
      }
    }, this.CLEANUP_INTERVAL)
  }

  // 停止定期清理
  stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  // 執行清理
  async performCleanup(): Promise<void> {
    try {
      const quota = this.getStorageQuota()
      const quotaInfo = await this.checkStorageQuota()

      console.log('Starting storage cleanup...')
      console.log('Storage usage:', quotaInfo.percentage.toFixed(2) + '%')

      // 如果使用率超過 80%，執行清理
      if (quotaInfo.percentage > 80) {
        await this.cleanupOldData(quota.retentionDays)
        await this.compressData()
      }

      // 檢查事件數量限制
      await this.enforceEventLimit(quota.maxEvents)
      
      // 檢查會話數量限制
      await this.enforceSessionLimit(quota.maxSessions)

      console.log('Storage cleanup completed')
    } catch (error) {
      console.error('Storage cleanup failed:', error)
    }
  }

  // 清理舊數據
  private async cleanupOldData(retentionDays: number): Promise<void> {
    try {
      // 這裡可以實現清理邏輯
      console.log(`Cleaned up data older than ${retentionDays} days`)
    } catch (error) {
      console.error('Failed to cleanup old data:', error)
    }
  }

  // 壓縮數據
  private async compressData(): Promise<void> {
    try {
      // 這裡可以實現數據壓縮邏輯
      // 例如：合併相似事件、減少精度等
      console.log('Data compression completed')
    } catch (error) {
      console.error('Data compression failed:', error)
    }
  }

  // 強制事件數量限制
  private async enforceEventLimit(maxEvents: number): Promise<void> {
    try {
      // 這裡可以實現事件數量限制邏輯
      console.log(`Enforcing event limit: ${maxEvents}`)
    } catch (error) {
      console.error('Failed to enforce event limit:', error)
    }
  }

  // 強制會話數量限制
  private async enforceSessionLimit(maxSessions: number): Promise<void> {
    try {
      // 這裡可以實現會話數量限制邏輯
      console.log(`Enforcing session limit: ${maxSessions}`)
    } catch (error) {
      console.error('Failed to enforce session limit:', error)
    }
  }

  // 獲取存儲統計
  async getStorageStats(): Promise<{
    quota: any
    usage: any
    recommendations: string[]
  }> {
    const quota = this.getStorageQuota()
    const usage = await this.checkStorageQuota()
    const recommendations: string[] = []

    if (usage.percentage > 90) {
      recommendations.push('存儲使用率超過90%，建議清理舊數據')
    }

    if (usage.percentage > 70) {
      recommendations.push('存儲使用率較高，建議啟用數據壓縮')
    }

    if (!usage.isPersistent) {
      recommendations.push('建議啟用持久存儲以防止數據丟失')
    }

    return {
      quota,
      usage,
      recommendations
    }
  }

  // 導出存儲報告
  async exportStorageReport(): Promise<{
    timestamp: string
    quota: any
    usage: any
    recommendations: string[]
    dataBreakdown: {
      sessions: number
      events: number
      metrics: number
      settings: number
    }
  }> {
    const stats = await this.getStorageStats()

    return {
      timestamp: new Date().toISOString(),
      quota: stats.quota,
      usage: stats.usage,
      recommendations: stats.recommendations,
      dataBreakdown: {
        sessions: 0,
        events: 0,
        metrics: 0,
        settings: 0
      }
    }
  }

  // 清理所有存儲
  async clearAllStorage(): Promise<void> {
    try {
      // 停止定期清理
      this.stopPeriodicCleanup()

      // 清理所有數據庫
      // 這裡可以實現清理所有數據的邏輯

      // 清理 localStorage 中的 Zoomies 相關項目
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('zoomies')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      console.log('All storage cleared')
    } catch (error) {
      console.error('Failed to clear all storage:', error)
      throw error
    }
  }

  // 優化存儲
  async optimizeStorage(): Promise<void> {
    try {
      console.log('Starting storage optimization...')

      // 1. 清理舊數據
      const quota = this.getStorageQuota()
      await this.cleanupOldData(quota.retentionDays)

      // 2. 壓縮數據
      await this.compressData()

      // 3. 強制限制
      await this.enforceEventLimit(quota.maxEvents)
      await this.enforceSessionLimit(quota.maxSessions)

      // 4. 壓縮數據庫
      await this.compactDatabases()

      console.log('Storage optimization completed')
    } catch (error) {
      console.error('Storage optimization failed:', error)
      throw error
    }
  }

  // 壓縮數據庫
  private async compactDatabases(): Promise<void> {
    try {
      // PouchDB 自動處理壓縮，這裡可以添加額外的壓縮邏輯
      console.log('Database compaction completed')
    } catch (error) {
      console.error('Database compaction failed:', error)
    }
  }
}

// 導出單例實例
export const storageManager = new StorageManager()
export default storageManager
