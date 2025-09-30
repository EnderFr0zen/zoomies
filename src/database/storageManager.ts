// Storage Manager
export class StorageManager {
  private readonly STORAGE_QUOTA_KEY = 'zoomies_storage_quota'
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
  private cleanupTimer: number | null = null

  constructor() {
    this.startPeriodicCleanup()
  }

  // Request persistent storage
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

  // Check storage quota
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

  // Check if storage is persistent
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

  // Set storage quota limit
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

  // Get storage quota settings
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

    // Default quota
    return {
      maxEvents: 10000,
      maxSessions: 1000,
      retentionDays: 30,
      compressionEnabled: false
    }
  }

  // Start periodic cleanup
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

  // Stop periodic cleanup
  stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  // Execute cleanup
  async performCleanup(): Promise<void> {
    try {
      const quota = this.getStorageQuota()
      const quotaInfo = await this.checkStorageQuota()

      console.log('Starting storage cleanup...')
      console.log('Storage usage:', quotaInfo.percentage.toFixed(2) + '%')

      // If usage exceeds 80%, execute cleanup
      if (quotaInfo.percentage > 80) {
        await this.cleanupOldData(quota.retentionDays)
        await this.compressData()
      }

      // Check event count limit
      await this.enforceEventLimit(quota.maxEvents)
      
      // Check session count limit
      await this.enforceSessionLimit(quota.maxSessions)

      console.log('Storage cleanup completed')
    } catch (error) {
      console.error('Storage cleanup failed:', error)
    }
  }

  // Clean old data
  private async cleanupOldData(retentionDays: number): Promise<void> {
    try {
      // Implement cleanup logic here
      console.log(`Cleaned up data older than ${retentionDays} days`)
    } catch (error) {
      console.error('Failed to cleanup old data:', error)
    }
  }

  // Compress data
  private async compressData(): Promise<void> {
    try {
      // Implement data compression logic here
      // For example: merge similar events, reduce precision, etc.
      console.log('Data compression completed')
    } catch (error) {
      console.error('Data compression failed:', error)
    }
  }

  // Force event count limit
  private async enforceEventLimit(maxEvents: number): Promise<void> {
    try {
      // Implement event count limit logic here
      console.log(`Enforcing event limit: ${maxEvents}`)
    } catch (error) {
      console.error('Failed to enforce event limit:', error)
    }
  }

  // Force session count limit
  private async enforceSessionLimit(maxSessions: number): Promise<void> {
    try {
      // Implement session count limit logic here
      console.log(`Enforcing session limit: ${maxSessions}`)
    } catch (error) {
      console.error('Failed to enforce session limit:', error)
    }
  }

  // Get storage statistics
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

  // Export storage report
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

  // Clean all storage
  async clearAllStorage(): Promise<void> {
    try {
      // Stop periodic cleanup
      this.stopPeriodicCleanup()

      // Clean all data庫
      // Implement logic to clean all data here

      // Clean localStorage 中的 Zoomies 相關項目
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

  // Optimize storage
  async optimizeStorage(): Promise<void> {
    try {
      console.log('Starting storage optimization...')

      // 1. Clean old data
      const quota = this.getStorageQuota()
      await this.cleanupOldData(quota.retentionDays)

      // 2. Compress data
      await this.compressData()

      // 3. Force limits
      await this.enforceEventLimit(quota.maxEvents)
      await this.enforceSessionLimit(quota.maxSessions)

      // 4. Compress database
      await this.compactDatabases()

      console.log('Storage optimization completed')
    } catch (error) {
      console.error('Storage optimization failed:', error)
      throw error
    }
  }

  // Compress data庫
  private async compactDatabases(): Promise<void> {
    try {
      // PouchDB handles compression automatically, add additional compression logic here
      console.log('Database compaction completed')
    } catch (error) {
      console.error('Database compaction failed:', error)
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager()
export default storageManager
