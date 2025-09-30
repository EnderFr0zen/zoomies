import { useEffect, useCallback, useRef } from 'react'

export interface AttentionEvent {
  type: 'inattentive_5s' | 'inattentive_10s' | 'focused_2s' | 'distracted' | 'refocused'
  timestamp: number
  confidence?: number
}

export const useAttentionDetection = (onAttentionEvent: (event: AttentionEvent) => void) => {
  const inattentiveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const focusedTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isPageVisibleRef = useRef<boolean>(true)
  const isDistractedRef = useRef<boolean>(false)

  const resetInattentiveTimer = useCallback(() => {
    if (inattentiveTimerRef.current) {
      clearTimeout(inattentiveTimerRef.current)
    }
    
    inattentiveTimerRef.current = setTimeout(() => {
      onAttentionEvent({
        type: 'inattentive_5s',
        timestamp: Date.now()
      })
    }, 5000)

    // Set up 10s timer
    setTimeout(() => {
      onAttentionEvent({
        type: 'inattentive_10s',
        timestamp: Date.now()
      })
    }, 10000)
  }, [onAttentionEvent])

  const resetFocusedTimer = useCallback(() => {
    if (focusedTimerRef.current) {
      clearTimeout(focusedTimerRef.current)
    }
    
    focusedTimerRef.current = setTimeout(() => {
      onAttentionEvent({
        type: 'focused_2s',
        timestamp: Date.now()
      })
    }, 2000)
  }, [onAttentionEvent])

  const handleActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now

    // Clear inattentive timers
    if (inattentiveTimerRef.current) {
      clearTimeout(inattentiveTimerRef.current)
      inattentiveTimerRef.current = null
    }

    // Start focused timer
    resetFocusedTimer()

    // Start inattentive timer after a delay
    setTimeout(() => {
      if (Date.now() - lastActivityRef.current >= 3000) {
        resetInattentiveTimer()
      }
    }, 3000)
  }, [resetFocusedTimer, resetInattentiveTimer])

  // Function to handle computer vision events
  const handleComputerVisionEvent = useCallback((event: AttentionEvent) => {
    switch (event.type) {
      case 'distracted':
        if (!isDistractedRef.current) {
          isDistractedRef.current = true
          onAttentionEvent({
            type: 'inattentive_5s',
            timestamp: Date.now(),
            confidence: event.confidence
          })
        }
        break
      case 'refocused':
        if (isDistractedRef.current) {
          isDistractedRef.current = false
          onAttentionEvent({
            type: 'focused_2s',
            timestamp: Date.now(),
            confidence: event.confidence
          })
        }
        break
      default:
        break
    }
  }, [onAttentionEvent])

  const handleVisibilityChange = useCallback(() => {
    isPageVisibleRef.current = !document.hidden
    
    if (isPageVisibleRef.current) {
      handleActivity()
    } else {
      // Clear timers when page is hidden
      if (inattentiveTimerRef.current) {
        clearTimeout(inattentiveTimerRef.current)
        inattentiveTimerRef.current = null
      }
      if (focusedTimerRef.current) {
        clearTimeout(focusedTimerRef.current)
        focusedTimerRef.current = null
      }
    }
  }, [handleActivity])

  // Mouse and keyboard activity detection
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [handleActivity])

  // Page visibility detection
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  // Initial setup
  useEffect(() => {
    handleActivity()
  }, [handleActivity])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inattentiveTimerRef.current) {
        clearTimeout(inattentiveTimerRef.current)
      }
      if (focusedTimerRef.current) {
        clearTimeout(focusedTimerRef.current)
      }
    }
  }, [])

  return {
    isPageVisible: isPageVisibleRef.current,
    handleComputerVisionEvent
  }
}
