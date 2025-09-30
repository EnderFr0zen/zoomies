// 多標籤頁管理器
export class MultiTabManager {
  private readonly channel: BroadcastChannel
  private isLeader = false
  private readonly leaderId: string
  private heartbeatInterval: number | null = null
  private readonly HEARTBEAT_INTERVAL = 5000 // 5秒心跳
  private readonly LEADER_TIMEOUT = 10000 // 10秒超時

  constructor() {
    this.leaderId = this.generateTabId()
    this.channel = new BroadcastChannel('zoomies-tab-coordination')
    this.setupEventListeners()
    this.startLeaderElection()
  }

  // 生成標籤頁 ID
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  // 設置事件監聽器
  private setupEventListeners(): void {
    this.channel.addEventListener('message', (event) => {
      this.handleMessage(event.data)
    })

    // 頁面卸載時通知其他標籤頁
    window.addEventListener('beforeunload', () => {
      this.broadcastMessage({
        type: 'tab_closing',
        tabId: this.leaderId
      })
    })

    // 頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.broadcastMessage({
          type: 'tab_hidden',
          tabId: this.leaderId
        })
      } else {
        this.broadcastMessage({
          type: 'tab_visible',
          tabId: this.leaderId
        })
      }
    })
  }

  // 處理消息
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'leader_election':
        this.handleLeaderElection(data)
        break
      case 'leader_heartbeat':
        this.handleLeaderHeartbeat(data)
        break
      case 'tab_closing':
        this.handleTabClosing(data)
        break
      case 'session_start':
        this.handleSessionStart(data)
        break
      case 'session_end':
        this.handleSessionEnd(data)
        break
      case 'event_log':
        this.handleEventLog(data)
        break
    }
  }

  // 開始領導者選舉
  private startLeaderElection(): void {
    this.broadcastMessage({
      type: 'leader_election',
      tabId: this.leaderId,
      timestamp: Date.now()
    })

    // 等待一段時間後檢查是否成為領導者
    setTimeout(() => {
      this.checkLeadership()
    }, 1000)
  }

  // 處理領導者選舉
  private handleLeaderElection(data: any): void {
    if (data.tabId !== this.leaderId && data.timestamp < Date.now() - 1000) {
      // 其他標籤頁發起選舉，如果我們是較新的標籤頁，則回應
      this.broadcastMessage({
        type: 'leader_election',
        tabId: this.leaderId,
        timestamp: Date.now()
      })
    }
  }

  // 檢查領導者狀態
  private checkLeadership(): void {
    // 簡單的領導者選舉：ID 最小的標籤頁成為領導者
    this.broadcastMessage({
      type: 'leader_check',
      tabId: this.leaderId
    })

    setTimeout(() => {
      this.broadcastMessage({
        type: 'leader_claim',
        tabId: this.leaderId
      })
      this.becomeLeader()
    }, 500)
  }

  // 成為領導者
  private becomeLeader(): void {
    this.isLeader = true
    this.startHeartbeat()
    console.log('Became leader tab for Zoomies')
  }

  // 開始心跳
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return

    this.heartbeatInterval = window.setInterval(() => {
      this.broadcastMessage({
        type: 'leader_heartbeat',
        tabId: this.leaderId,
        timestamp: Date.now()
      })
    }, this.HEARTBEAT_INTERVAL)
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 處理領導者心跳
  private handleLeaderHeartbeat(data: any): void {
    if (data.tabId !== this.leaderId && this.isLeader) {
      // 有其他標籤頁聲稱是領導者，檢查時間戳
      if (data.timestamp > Date.now() - this.LEADER_TIMEOUT) {
        this.isLeader = false
        this.stopHeartbeat()
        console.log('Stepped down from leadership')
      }
    }
  }

  // 處理標籤頁關閉
  private handleTabClosing(data: any): void {
    if (data.tabId === this.leaderId && this.isLeader) {
      // 領導者標籤頁關閉，重新選舉
      this.isLeader = false
      this.stopHeartbeat()
      setTimeout(() => {
        this.startLeaderElection()
      }, 1000)
    }
  }

  // 處理會話開始
  private handleSessionStart(data: any): void {
    if (!this.isLeader) {
      console.log('Session started in another tab:', data.sessionId)
    }
  }

  // 處理會話結束
  private handleSessionEnd(data: any): void {
    if (!this.isLeader) {
      console.log('Session ended in another tab:', data.sessionId)
    }
  }

  // 處理事件記錄
  private handleEventLog(data: any): void {
    if (!this.isLeader) {
      console.log('Event logged in another tab:', data.eventType)
    }
  }

  // 廣播消息
  private broadcastMessage(message: any): void {
    try {
      this.channel.postMessage(message)
    } catch (error) {
      console.error('Failed to broadcast message:', error)
    }
  }

  // 檢查是否為領導者
  isLeaderTab(): boolean {
    return this.isLeader
  }

  // 獲取標籤頁 ID
  getTabId(): string {
    return this.leaderId
  }

  // 通知會話開始
  notifySessionStart(sessionId: string, subject: string): void {
    if (this.isLeader) {
      this.broadcastMessage({
        type: 'session_start',
        sessionId,
        subject,
        tabId: this.leaderId
      })
    }
  }

  // 通知會話結束
  notifySessionEnd(sessionId: string, subject: string, duration: number): void {
    if (this.isLeader) {
      this.broadcastMessage({
        type: 'session_end',
        sessionId,
        subject,
        duration,
        tabId: this.leaderId
      })
    }
  }

  // 通知事件記錄
  notifyEventLog(eventType: string, sessionId: string): void {
    if (this.isLeader) {
      this.broadcastMessage({
        type: 'event_log',
        eventType,
        sessionId,
        tabId: this.leaderId
      })
    }
  }

  // 清理資源
  destroy(): void {
    this.stopHeartbeat()
    this.channel.close()
  }
}

// 導出單例實例
export const multiTabManager = new MultiTabManager()
export default multiTabManager
