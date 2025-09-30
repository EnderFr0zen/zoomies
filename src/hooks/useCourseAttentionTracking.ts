import { useEffect, useRef } from 'react'
import { zoomiesDB } from '../database'
import type { EventData, EventType } from '../database/types'
import { useAuth } from './useAuth'

interface AttentionOptions {
  courseTitle?: string
}

const IDLE_THRESHOLD_MS = 60_000

const LOST_EVENT: Extract<EventType, 'attention:lost'> = 'attention:lost'
const PRESENT_EVENT: Extract<EventType, 'attention:present'> = 'attention:present'

export const useCourseAttentionTracking = (courseId: string | null, options?: AttentionOptions) => {
  const courseTitle = options?.courseTitle
  const { user } = useAuth()
  const lastStateRef = useRef<'present' | 'lost' | null>(null)
  const lastTransitionRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!user || user.role !== 'student' || !courseId) {
      return
    }

    let disposed = false

    const logEvent = async (eventType: EventType, reason: NonNullable<EventData['reason']>) => {
      try {
        await zoomiesDB.createEvent({
          type: 'event',
          eventType,
          userId: user._id,
          courseId,
          timestamp: Date.now(),
          data: {
            reason,
            metadata: {
              source: 'course-attention',
              courseId,
              courseTitle,
              userAgent: navigator.userAgent
            }
          }
        })
      } catch (error) {
        if (!disposed) {
          console.error('Error recording attention event', error)
        }
      }
    }

    const switchState = (state: 'present' | 'lost', reason: NonNullable<EventData['reason']>) => {
      if (lastStateRef.current === state) {
        return
      }
      lastStateRef.current = state
      lastTransitionRef.current = Date.now()
      void logEvent(state === 'present' ? PRESENT_EVENT : LOST_EVENT, reason)
    }

    switchState('present', 'course_focus')

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        switchState('lost', 'tab_hidden')
      } else if (document.visibilityState === 'visible') {
        switchState('present', 'tab_visible')
      }
    }

    const handleWindowBlur = () => {
      switchState('lost', 'window_blur')
    }

    const handleWindowFocus = () => {
      switchState('present', 'window_focus')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    const idleCheck = window.setInterval(() => {
      if (lastStateRef.current === 'present') {
        const elapsed = Date.now() - lastTransitionRef.current
        if (elapsed > IDLE_THRESHOLD_MS) {
          switchState('lost', 'tab_navigation')
        }
      }
    }, 30_000)

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      window.clearInterval(idleCheck)
      if (lastStateRef.current !== 'lost') {
        switchState('lost', 'course_exit')
      }
    }
  }, [user?._id, user?.role, courseId, courseTitle])
}
