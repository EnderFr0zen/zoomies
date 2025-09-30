import { useState, useEffect, useCallback, useRef } from 'react'

export interface SessionContext {
  subject: string
  taskTimer: {
    isRunning: boolean
    elapsedTime: number
    startTime: number | null
  }
  muteState: boolean
  sessionId: string
  startTime: number
}

export const useSessionContext = () => {
  const [subject, setSubject] = useState<string>('Mathematics')
  const [muteState, setMuteState] = useState<boolean>(false)
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`)
  const [startTime] = useState<number>(Date.now())
  
  const [taskTimer, setTaskTimer] = useState({
    isRunning: false,
    elapsedTime: 0,
    startTime: null as number | null
  })
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start task timer
  const startTaskTimer = useCallback(() => {
    if (!taskTimer.isRunning) {
      const now = Date.now()
      setTaskTimer(prev => ({
        ...prev,
        isRunning: true,
        startTime: now
      }))
    }
  }, [taskTimer.isRunning])

  // Stop task timer
  const stopTaskTimer = useCallback(() => {
    if (taskTimer.isRunning) {
      setTaskTimer(prev => ({
        ...prev,
        isRunning: false,
        startTime: null
      }))
    }
  }, [taskTimer.isRunning])

  // Reset task timer
  const resetTaskTimer = useCallback(() => {
    setTaskTimer({
      isRunning: false,
      elapsedTime: 0,
      startTime: null
    })
  }, [])

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setMuteState(prev => !prev)
  }, [])

  // Update subject
  const updateSubject = useCallback((newSubject: string) => {
    setSubject(newSubject)
  }, [])

  // Timer effect
  useEffect(() => {
    if (taskTimer.isRunning && taskTimer.startTime) {
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - taskTimer.startTime!) / 1000)
        setTaskTimer(prev => ({
          ...prev,
          elapsedTime: elapsed
        }))
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [taskTimer.isRunning, taskTimer.startTime])

  // Load session data from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('zoomies_session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed.subject) {
          setSubject(parsed.subject)
        }
        if (typeof parsed.muteState === 'boolean') {
          setMuteState(parsed.muteState)
        }
        if (parsed.taskTimer) {
          setTaskTimer(prev => ({
            ...prev,
            ...parsed.taskTimer,
            isRunning: false // Don't auto-resume timer
          }))
        }
      } catch (error) {
        console.warn('Failed to load session data:', error)
      }
    }
  }, [])

  // Save session data to localStorage
  useEffect(() => {
    const sessionData = {
      subject,
      muteState,
      taskTimer: {
        ...taskTimer,
        isRunning: false // Don't save running state
      },
      sessionId,
      startTime
    }
    
    localStorage.setItem('zoomies_session', JSON.stringify(sessionData))
  }, [subject, muteState, taskTimer, sessionId, startTime])

  // Format elapsed time as MM:SS
  const formatElapsedTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    sessionContext: {
      subject,
      taskTimer,
      muteState,
      sessionId,
      startTime
    },
    actions: {
      startTaskTimer,
      stopTaskTimer,
      resetTaskTimer,
      toggleMute,
      updateSubject
    },
    utils: {
      formatElapsedTime
    }
  }
}
