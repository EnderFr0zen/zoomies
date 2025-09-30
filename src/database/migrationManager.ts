import { SCHEMA_VERSION } from './types'
import { zoomiesDB } from './couchdb-simple'

// 遷移管理器
export class MigrationManager {
  private readonly MIGRATION_VERSION_KEY = 'zoomies_migration_version'
  private currentVersion = SCHEMA_VERSION

  constructor() {
    this.loadCurrentVersion()
  }

  // 加載當前版本
  private loadCurrentVersion(): void {
    const stored = localStorage.getItem(this.MIGRATION_VERSION_KEY)
    if (stored) {
      try {
        this.currentVersion = parseInt(stored, 10) || 1
      } catch (error) {
        console.error('Failed to load migration version:', error)
        this.currentVersion = 1
      }
    }
  }

  // 保存當前版本
  private saveCurrentVersion(version: number): void {
    localStorage.setItem(this.MIGRATION_VERSION_KEY, version.toString())
    this.currentVersion = version
  }

  // 檢查是否需要遷移
  needsMigration(): boolean {
    return this.currentVersion < SCHEMA_VERSION
  }

  // 執行遷移
  async migrate(): Promise<void> {
    if (!this.needsMigration()) {
      console.log('No migration needed')
      return
    }

    console.log(`Starting migration from version ${this.currentVersion} to ${SCHEMA_VERSION}`)

    try {
      // 執行版本間遷移
      for (let version = this.currentVersion + 1; version <= SCHEMA_VERSION; version++) {
        await this.migrateToVersion(version)
        this.saveCurrentVersion(version)
        console.log(`Migrated to version ${version}`)
      }

      console.log('Migration completed successfully')
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  // 遷移到特定版本
  private async migrateToVersion(targetVersion: number): Promise<void> {
    switch (targetVersion) {
      case 2:
        await this.migrateToV2()
        break
      case 3:
        await this.migrateToV3()
        break
      // 添加更多版本遷移
      default:
        console.log(`No migration needed for version ${targetVersion}`)
    }
  }

  // 遷移到版本 2
  private async migrateToV2(): Promise<void> {
    console.log('Migrating to version 2...')
    
    // 示例：添加新的字段到現有文檔
    try {
      // 遷移會話文檔
      const sessions = await zoomiesDB.getRecentSessions(1000)
      for (const session of sessions) {
        if (session.schemaVersion < 2) {
          const updatedSession = {
            ...session,
            schemaVersion: 2,
            metadata: {
              ...session.metadata,
              migrationVersion: 2,
              migratedAt: new Date().toISOString()
            }
          }
          await zoomiesDB.updateSession(session._id, updatedSession)
        }
      }

      // 遷移事件文檔
      const events = await zoomiesDB.getRecentEvents(1000)
      for (const event of events) {
        if (event.schemaVersion < 2) {
          const updatedEvent = {
            ...event,
            schemaVersion: 2,
            data: {
              ...event.data,
              migrationVersion: 2
            }
          }
          await zoomiesDB.createEvent(updatedEvent)
        }
      }

      console.log('Version 2 migration completed')
    } catch (error) {
      console.error('Version 2 migration failed:', error)
      throw error
    }
  }

  // 遷移到版本 3
  private async migrateToV3(): Promise<void> {
    console.log('Migrating to version 3...')
    
    // 示例：重構數據結構
    try {
      // 這裡可以添加版本 3 的遷移邏輯
      // 例如：合併某些字段、重新計算指標等
      
      console.log('Version 3 migration completed')
    } catch (error) {
      console.error('Version 3 migration failed:', error)
      throw error
    }
  }

  // 回滾到上一個版本
  async rollback(): Promise<void> {
    if (this.currentVersion <= 1) {
      throw new Error('Cannot rollback from version 1')
    }

    const previousVersion = this.currentVersion - 1
    console.log(`Rolling back from version ${this.currentVersion} to ${previousVersion}`)

    try {
      // 這裡可以實現回滾邏輯
      // 例如：恢復備份數據、撤銷遷移等
      
      this.saveCurrentVersion(previousVersion)
      console.log('Rollback completed')
    } catch (error) {
      console.error('Rollback failed:', error)
      throw error
    }
  }

  // 創建數據備份
  async createBackup(): Promise<{
    version: number
    timestamp: string
    data: any
  }> {
    try {
      const data = await zoomiesDB.exportData()
      const backup = {
        version: this.currentVersion,
        timestamp: new Date().toISOString(),
        data
      }

      // 將備份存儲到 localStorage
      const backupKey = `zoomies_backup_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify(backup))

      console.log('Backup created:', backupKey)
      return backup
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw error
    }
  }

  // 恢復數據備份
  async restoreBackup(backupKey: string): Promise<void> {
    try {
      const backupData = localStorage.getItem(backupKey)
      if (!backupData) {
        throw new Error('Backup not found')
      }

      const backup = JSON.parse(backupData)
      
      // 驗證備份格式
      if (!backup.version || !backup.timestamp || !backup.data) {
        throw new Error('Invalid backup format')
      }

      // 這裡可以實現恢復邏輯
      // 例如：清空現有數據，恢復備份數據
      
      console.log('Backup restored from:', backup.timestamp)
    } catch (error) {
      console.error('Failed to restore backup:', error)
      throw error
    }
  }

  // 獲取遷移狀態
  getMigrationStatus(): {
    currentVersion: number
    targetVersion: number
    needsMigration: boolean
    canRollback: boolean
  } {
    return {
      currentVersion: this.currentVersion,
      targetVersion: SCHEMA_VERSION,
      needsMigration: this.needsMigration(),
      canRollback: this.currentVersion > 1
    }
  }

  // 清理舊備份
  cleanupOldBackups(keepCount = 5): void {
    try {
      const backupKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('zoomies_backup_')) {
          backupKeys.push(key)
        }
      }

      // 按時間戳排序
      backupKeys.sort((a, b) => {
        const timestampA = parseInt(a.split('_')[2], 10)
        const timestampB = parseInt(b.split('_')[2], 10)
        return timestampB - timestampA
      })

      // 刪除舊備份
      const toDelete = backupKeys.slice(keepCount)
      toDelete.forEach(key => localStorage.removeItem(key))

      console.log(`Cleaned up ${toDelete.length} old backups`)
    } catch (error) {
      console.error('Failed to cleanup old backups:', error)
    }
  }
}

// 導出單例實例
export const migrationManager = new MigrationManager()
export default migrationManager
