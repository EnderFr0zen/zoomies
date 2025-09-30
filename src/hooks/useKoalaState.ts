import { useState, useEffect, useCallback, useRef } from 'react'

export type KoalaState = 'IDLE' | 'NUDGE_1' | 'NUDGE_2' | 'HAPPY'

export interface KoalaStateMachine {
  currentState: KoalaState
  isAnimating: boolean
  lastNudgeTime: number
  cooldownDuration: number
  isMuted: boolean
}

export interface KoalaEvent {
  type: 'inattentive_5s' | 'inattentive_10s' | 'focused_2s'
  timestamp: number
}

const COOLDOWN_DURATION = 10000 // 10 seconds

export const useKoalaState = () => {
  const [state, setState] = useState<KoalaStateMachine>({
    currentState: 'IDLE',
    isAnimating: false,
    lastNudgeTime: 0,
    cooldownDuration: COOLDOWN_DURATION,
    isMuted: false
  })

  const animationTimeoutRef = useRef<number | null>(null)
  const cooldownTimeoutRef = useRef<number | null>(null)

  const canTriggerNudge = useCallback(() => {
    const now = Date.now()
    return now - state.lastNudgeTime >= state.cooldownDuration
  }, [state.lastNudgeTime, state.cooldownDuration])

  const triggerState = useCallback((newState: KoalaState, duration: number) => {
    if (state.isAnimating && newState !== 'IDLE') {
      // If already animating, queue the next state or fall back to IDLE
      return
    }

    setState(prev => ({
      ...prev,
      currentState: newState,
      isAnimating: newState !== 'IDLE',
      lastNudgeTime: newState !== 'IDLE' ? Date.now() : prev.lastNudgeTime
    }))

    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

    // Set timeout to return to IDLE after animation
    if (newState !== 'IDLE') {
      animationTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentState: 'IDLE',
          isAnimating: false
        }))
      }, duration)
    }
  }, [state.isAnimating])

  const handleEvent = useCallback((event: KoalaEvent) => {
    switch (event.type) {
      case 'inattentive_5s':
        if (canTriggerNudge()) {
          triggerState('NUDGE_1', 1000) // 1 second animation
        }
        break
        
      case 'inattentive_10s':
        if (canTriggerNudge()) {
          triggerState('NUDGE_2', 1500) // 1.5 second animation
        }
        break
        
      case 'focused_2s':
        triggerState('HAPPY', 2000) // 2 second celebration
        break
        
      default:
        break
    }
  }, [canTriggerNudge, triggerState])

  const toggleMute = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }))
  }, [])

  const resetCooldown = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastNudgeTime: 0
    }))
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current)
      }
    }
  }, [])

  return {
    state,
    handleEvent,
    toggleMute,
    resetCooldown,
    canTriggerNudge
  }
}
