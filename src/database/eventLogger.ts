import type { EventDocument, EventType, EventData, EventBuffer } from './types'
import { zoomiesDB } from './database'

// 事件記錄器類
export class EventLogger {
  private buffer: EventBuffer
  private flushTimer: number | null = null
  private isFlushing = false
  private currentSessionId: string | null = null

  constructor() {
    this.buffer = {
      events: [],
      lastFlush: Date.now(),
      maxBufferSize: 50, // 最大緩衝事件數
      flushInterval: 5000 // 5秒刷新間隔
    }

    // 設置頁面隱藏時強制刷新
    this.setupPageHideHandler()
  }

  // 設置頁面隱藏處理器
  private setupPageHideHandler(): void {
    const handlePageHide = () => {
      this.flushBuffer()
    }

    const handleBeforeUnload = () => {
      this.flushBuffer()
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handlePageHide()
      }
    })

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
  }

  // 設置當前會話 ID
  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId
  }

  // 記錄事件
  async logEvent(
    eventType: EventType, 
    data: EventData, 
    confidence?: number
  ): Promise<void> {
    if (!this.currentSessionId) {
      console.warn('No active session, event not logged:', eventType)
      return
    }

    const event: EventDocument = {
      _id: '', // 將由數據庫生成
      schemaVersion: 1,
      type: 'event',
      sessionId: this.currentSessionId,
      userId: 'default-user', // 臨時用戶ID，實際應用中應該從認證系統獲取
      eventType,
      timestamp: new Date().toISOString(),
      data,
      confidence,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 添加到緩衝區
    this.buffer.events.push(event)

    // 檢查是否需要刷新
    if (this.buffer.events.length >= this.buffer.maxBufferSize) {
      await this.flushBuffer()
    } else if (!this.flushTimer) {
      this.scheduleFlush()
    }
  }

  // 記錄注意力事件
  async logAttentionPresent(attentionLevel: number, confidence?: number): Promise<void> {
    await this.logEvent('attention:present', {
      attentionLevel,
      reason: 'input_idle'
    }, confidence)
  }

  async logAttentionLost(reason: 'no_face' | 'yaw' | 'pitch' | 'tab_hidden' | 'input_idle' | 'window_blur'): Promise<void> {
    await this.logEvent('attention:lost', {
      reason
    })
  }

  // 記錄提醒事件
  async logNudgeShown(nudgeType: 'nudge1' | 'nudge2', soundPlayed = false): Promise<void> {
    const eventType = nudgeType === 'nudge1' ? 'nudge1:shown' : 'nudge2:shown'
    await this.logEvent(eventType, {
      nudgeType,
      soundPlayed
    })

    if (soundPlayed) {
      await this.logEvent('nudge:sound_played', {
        nudgeType
      })
    }
  }

  // 記錄恢復事件
  async logFocusRegained(responseTime?: number): Promise<void> {
    await this.logEvent('focus:regained', {
      metadata: { responseTime }
    })
  }

  // 記錄會話事件
  async logSessionStart(subject: string, duration?: number): Promise<void> {
    await this.logEvent('session:start', {
      subject,
      duration
    })
  }

  async logSessionEnd(subject: string, duration: number): Promise<void> {
    await this.logEvent('session:end', {
      subject,
      duration
    })
  }

  // 記錄考拉互動事件
  async logKoalaInteraction(interactionType: 'dragged' | 'clicked', position?: { x: number; y: number }): Promise<void> {
    await this.logEvent('koala:dragged', {
      metadata: {
        interactionType,
        position
      }
    })
  }

  // 記錄設置變更事件
  async logSettingsChanged(settingName: string, settingValue: any): Promise<void> {
    await this.logEvent('settings:changed', {
      settingName,
      settingValue
    })
  }

  // 安排刷新
  private scheduleFlush(): void {
    if (this.flushTimer) return

    this.flushTimer = window.setTimeout(async () => {
      await this.flushBuffer()
    }, this.buffer.flushInterval)
  }

  // 刷新緩衝區
  async flushBuffer(): Promise<void> {
    if (this.isFlushing || this.buffer.events.length === 0) return

    this.isFlushing = true

    try {
      // 清除定時器
      if (this.flushTimer) {
        clearTimeout(this.flushTimer)
        this.flushTimer = null
      }

      // 批量寫入事件
      const eventsToFlush = [...this.buffer.events]
      this.buffer.events = []

      for (const event of eventsToFlush) {
        try {
          await zoomiesDB.createEvent(event)
        } catch (error) {
          console.error('Failed to log event:', error, event)
          // 重新添加到緩衝區以便重試
          this.buffer.events.push(event)
        }
      }

      this.buffer.lastFlush = Date.now()
      console.log(`Flushed ${eventsToFlush.length} events to database`)

    } catch (error) {
      console.error('Failed to flush event buffer:', error)
    } finally {
      this.isFlushing = false
    }
  }

  // 強制刷新
  async forceFlush(): Promise<void> {
    await this.flushBuffer()
  }

  // 獲取緩衝區狀態
  getBufferStatus(): {
    eventCount: number
    lastFlush: number
    isFlushing: boolean
  } {
    return {
      eventCount: this.buffer.events.length,
      lastFlush: this.buffer.lastFlush,
      isFlushing: this.isFlushing
    }
  }

  // 清理緩衝區
  clearBuffer(): void {
    this.buffer.events = []
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }
}

// 導出單例實例
export const eventLogger = new EventLogger()
export default eventLogger
