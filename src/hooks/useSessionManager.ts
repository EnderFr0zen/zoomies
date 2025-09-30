import { useEffect, useState, useCallback } from 'react'
import { databaseSystem } from '../database'

export interface SessionManagerState {
  currentSessionId: string | null
  isSessionActive: boolean
  sessionStartTime: string | null
  sessionDuration: number // 秒
}

export interface SessionManagerActions {
  startSession: (subject: string, duration?: number) => Promise<string>
  endSession: () => Promise<void>
  getSessionStats: () => Promise<any>
}

export const useSessionManager = () => {
  const [state, setState] = useState<SessionManagerState>({
    currentSessionId: null,
    isSessionActive: false,
    sessionStartTime: null,
    sessionDuration: 0
  })

  // 初始化數據庫系統
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await databaseSystem.initialize()
        console.log('Database system initialized for session manager')
      } catch (error) {
        console.error('Failed to initialize database system:', error)
      }
    }

    initializeDatabase()
  }, [])

  // 開始會話
  const startSession = useCallback(async (subject: string, duration?: number): Promise<string> => {
    try {
      const sessionId = await databaseSystem.createSession(subject, duration)
      
      setState(prev => ({
        ...prev,
        currentSessionId: sessionId,
        isSessionActive: true,
        sessionStartTime: new Date().toISOString(),
        sessionDuration: 0
      }))

      // 開始會話計時器
      const timer = setInterval(() => {
        setState(prev => {
          if (prev.sessionStartTime) {
            const duration = Math.floor((Date.now() - new Date(prev.sessionStartTime).getTime()) / 1000)
            return {
              ...prev,
              sessionDuration: duration
            }
          }
          return prev
        })
      }, 1000)

      // 存儲計時器 ID 以便清理
      ;(window as any).sessionTimer = timer

      console.log(`Session started: ${sessionId} for subject: ${subject}`)
      return sessionId
    } catch (error) {
      console.error('Failed to start session:', error)
      throw error
    }
  }, [])

  // 結束會話
  const endSession = useCallback(async (): Promise<void> => {
    if (!state.currentSessionId) {
      console.warn('No active session to end')
      return
    }

    try {
      await databaseSystem.endSession(state.currentSessionId)
      
      // 清理計時器
      if ((window as any).sessionTimer) {
        clearInterval((window as any).sessionTimer)
        delete (window as any).sessionTimer
      }

      setState(prev => ({
        ...prev,
        currentSessionId: null,
        isSessionActive: false,
        sessionStartTime: null,
        sessionDuration: 0
      }))

      console.log(`Session ended: ${state.currentSessionId}`)
    } catch (error) {
      console.error('Failed to end session:', error)
      throw error
    }
  }, [state.currentSessionId])

  // 獲取會話統計
  const getSessionStats = useCallback(async (): Promise<any> => {
    if (!state.currentSessionId) {
      return null
    }

    try {
      return await databaseSystem.getSessionStats(state.currentSessionId)
    } catch (error) {
      console.error('Failed to get session stats:', error)
      return null
    }
  }, [state.currentSessionId])

  // 頁面卸載時結束會話
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.isSessionActive && state.currentSessionId) {
        // 同步結束會話
        databaseSystem.endSession(state.currentSessionId).catch(console.error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [state.isSessionActive, state.currentSessionId])

  return {
    state,
    actions: {
      startSession,
      endSession,
      getSessionStats
    }
  }
}
