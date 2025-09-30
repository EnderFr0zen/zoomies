import { useEffect, useCallback, useRef, useState } from 'react'

export interface ScreenActivityEvent {
  type: 'page_visible' | 'page_hidden' | 'input_idle' | 'input_active' | 'screen_switch' | 'window_focus' | 'window_blur'
  timestamp: number
  data?: {
    idleTime?: number
    lastActivity?: number
    visibilityState?: string
    focusState?: boolean
  }
}

export interface ScreenActivityState {
  isPageVisible: boolean
  isWindowFocused: boolean
  lastActivityTime: number
  idleTime: number
  isIdle: boolean
  idleThreshold: number
}

export const useScreenActivity = (
  onActivityEvent?: (event: ScreenActivityEvent) => void,
  idleThreshold: number = 30000 // 30 seconds default
) => {
  const [state, setState] = useState<ScreenActivityState>({
    isPageVisible: !document.hidden,
    isWindowFocused: document.hasFocus(),
    lastActivityTime: Date.now(),
    idleTime: 0,
    isIdle: false,
    idleThreshold
  })

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update idle time
  const updateIdleTime = useCallback(() => {
    const now = Date.now()
    const idleTime = now - state.lastActivityTime
    const isIdle = idleTime >= idleThreshold

    setState(prev => ({
      ...prev,
      idleTime,
      isIdle
    }))

    // Emit idle event if threshold is reached
    if (isIdle && !state.isIdle) {
      onActivityEvent?.({
        type: 'input_idle',
        timestamp: now,
        data: {
          idleTime,
          lastActivity: state.lastActivityTime
        }
      })
    }
  }, [state.lastActivityTime, state.isIdle, idleThreshold, onActivityEvent])

  // Handle user activity
  const handleActivity = useCallback(() => {
    const now = Date.now()
    const wasIdle = state.isIdle

    setState(prev => ({
      ...prev,
      lastActivityTime: now,
      idleTime: 0,
      isIdle: false
    }))

    // Clear existing idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      updateIdleTime()
    }, idleThreshold)

    // Emit active event if was idle
    if (wasIdle) {
      onActivityEvent?.({
        type: 'input_active',
        timestamp: now,
        data: {
          idleTime: 0,
          lastActivity: now
        }
      })
    }
  }, [state.isIdle, idleThreshold, updateIdleTime, onActivityEvent])

  // Handle page visibility change
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden
    const now = Date.now()

    setState(prev => ({
      ...prev,
      isPageVisible: isVisible
    }))

    onActivityEvent?.({
      type: isVisible ? 'page_visible' : 'page_hidden',
      timestamp: now,
      data: {
        visibilityState: document.visibilityState
      }
    })

    if (isVisible) {
      handleActivity()
    }
  }, [handleActivity, onActivityEvent])

  // Handle window focus/blur
  const handleFocusChange = useCallback(() => {
    const isFocused = document.hasFocus()
    const now = Date.now()

    setState(prev => ({
      ...prev,
      isWindowFocused: isFocused
    }))

    onActivityEvent?.({
      type: isFocused ? 'window_focus' : 'window_blur',
      timestamp: now,
      data: {
        focusState: isFocused
      }
    })

    if (isFocused) {
      handleActivity()
    }
  }, [handleActivity, onActivityEvent])

  // Handle screen switch events (if available)
  const handleScreenSwitch = useCallback(() => {
    const now = Date.now()
    onActivityEvent?.({
      type: 'screen_switch',
      timestamp: now,
      data: {
        lastActivity: state.lastActivityTime
      }
    })
  }, [state.lastActivityTime, onActivityEvent])

  // Set up event listeners
  useEffect(() => {
    const activityEvents = [
      'mousedown', 'mousemove', 'keydown', 'keyup',
      'scroll', 'touchstart', 'touchend', 'click',
      'focus', 'blur'
    ]

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Add visibility and focus listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocusChange)
    window.addEventListener('blur', handleFocusChange)

    // Add screen switch detection (if available)
    if ('screen' in window && 'orientation' in window.screen) {
      window.screen.addEventListener('orientationchange', handleScreenSwitch)
    }

    // Start activity monitoring
    activityCheckIntervalRef.current = setInterval(updateIdleTime, 1000)

    return () => {
      // Remove activity listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })

      // Remove other listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocusChange)
      window.removeEventListener('blur', handleFocusChange)

      if ('screen' in window && 'orientation' in window.screen) {
        window.screen.removeEventListener('orientationchange', handleScreenSwitch)
      }

      // Clear timers
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current)
      }
    }
  }, [handleActivity, handleVisibilityChange, handleFocusChange, handleScreenSwitch, updateIdleTime])

  // Initial activity
  useEffect(() => {
    handleActivity()
  }, [handleActivity])

  return {
    state,
    actions: {
      resetIdleTimer: handleActivity,
      updateIdleThreshold: (threshold: number) => {
        setState(prev => ({ ...prev, idleThreshold: threshold }))
      }
    }
  }
}
