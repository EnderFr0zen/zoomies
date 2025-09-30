import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.tsx'
import { useCourses } from '../hooks/useCourses'
import { zoomiesDB } from '../database'
import type { CourseDocument, UserDocument } from '../database/types'
import './TeacherDashboard.css'

interface StudentAttentionSummary {
  studentId: string
  studentName: string
  courseIds: string[]
  courseNames: string[]
  lastCourseTitle?: string
  status: 'focused' | 'distracted' | 'idle'
  focusMs: number
  distractedMs: number
  attentionLostCount: number
  attentionPresentCount: number
  gazeDistractionCount: number
  timeline: number[]
  lastEventAt: number | null
  lastReason?: string
}

const REFRESH_INTERVAL_MS = 15_000
const RECENT_ATTENTION_THRESHOLD_MS = 120_000
const TIMELINE_BUCKETS = 12
const TIMELINE_BUCKET_MS = 5 * 60 * 1000

const resolveTimestamp = (value: any): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

const formatRelativeTime = (timestamp: number | null): string => {
  if (!timestamp) {
    return 'No activity'
  }
  const diff = Date.now() - timestamp
  if (diff < 15_000) return 'just now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatReason = (reason?: string): string => {
  switch (reason) {
    case 'tab_hidden':
      return 'Browser tab hidden'
    case 'tab_visible':
      return 'Tab visible'
    case 'window_blur':
      return 'Window not focused'
    case 'window_focus':
      return 'Window focused'
    case 'course_focus':
      return 'Viewing course material'
    case 'course_exit':
      return 'Left course page'
    case 'tab_navigation':
      return 'Navigated away'
    default:
      return reason ? reason.replace(/_/g, ' ') : '—'
  }
}

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  if (data.length === 0) {
    return <div className="sparkline-empty">No distractions yet</div>
  }

  const width = 120
  const height = 40
  const max = Math.max(...data, 1)
  const points = data.map((value, index) => {
    const x = data.length === 1 ? width : (index / (data.length - 1)) * width
    const y = height - (value / max) * height
    return `${x},${y}`
  }).join(' ')

  const fillPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="presentation" aria-hidden="true">
      <polyline className="sparkline-fill" points={fillPoints} />
      <polyline className="sparkline-path" points={points} />
    </svg>
  )
}

interface MutableSummary extends StudentAttentionSummary {
  attentionState: 'focused' | 'distracted'
  attentionTransition: number | null
  firstEventAt: number | null
}

const buildStudentSummaries = (
  students: UserDocument[],
  courses: CourseDocument[],
  events: any[]
): StudentAttentionSummary[] => {
  const courseMap = new Map<string, CourseDocument>(courses.map(course => [course._id, course]))
  const now = Date.now()

  const summaries = new Map<string, MutableSummary>()

  students.forEach(student => {
    const enrolledCourseIds = Array.from(new Set(student.enrolledCourses || []))
    const courseNames = enrolledCourseIds
      .map(id => courseMap.get(id)?.title)
      .filter((title): title is string => Boolean(title))

    summaries.set(student._id, {
      studentId: student._id,
      studentName: student.displayName || student.username || student._id,
      courseIds: enrolledCourseIds,
      courseNames,
      lastCourseTitle: courseNames[0],
      status: 'idle',
      focusMs: 0,
      distractedMs: 0,
      attentionLostCount: 0,
      attentionPresentCount: 0,
      gazeDistractionCount: 0,
      timeline: new Array(TIMELINE_BUCKETS).fill(0),
      lastEventAt: null,
      lastReason: undefined,
      attentionState: 'distracted',
      attentionTransition: null,
      firstEventAt: null
    })
  })

  const sortedEvents = [...events].sort((a, b) => {
    const aTs = resolveTimestamp(a.timestamp) ?? 0
    const bTs = resolveTimestamp(b.timestamp) ?? 0
    return aTs - bTs
  })

  for (const event of sortedEvents) {
    const summary = summaries.get(event.userId)
    if (!summary) continue

    const timestamp = resolveTimestamp(event.timestamp)
    if (timestamp === null) continue

    const eventType = (event.eventType || event.type) as string | undefined
    if (!eventType) continue

    const data = event.data || {}
    const reason = data.reason as string | undefined
    const metadata = (data.metadata || {}) as Record<string, any>
    const courseIdFromEvent = event.courseId || metadata.courseId

    if (courseIdFromEvent) {
      if (!summary.courseIds.includes(courseIdFromEvent)) {
        summary.courseIds.push(courseIdFromEvent)
        const course = courseMap.get(courseIdFromEvent)
        if (course && !summary.courseNames.includes(course.title)) {
          summary.courseNames.push(course.title)
        }
      }
      if (courseMap.get(courseIdFromEvent)?.title) {
        summary.lastCourseTitle = courseMap.get(courseIdFromEvent)?.title
      } else if (typeof metadata.courseTitle === 'string') {
        summary.lastCourseTitle = metadata.courseTitle
      }
    } else if (typeof metadata.courseTitle === 'string') {
      summary.lastCourseTitle = metadata.courseTitle
    }

    summary.lastEventAt = summary.lastEventAt ? Math.max(summary.lastEventAt, timestamp) : timestamp
    if (reason) {
      summary.lastReason = reason
    }

    if (!summary.firstEventAt) {
      summary.firstEventAt = timestamp
    }

    if (eventType === 'attention:lost' || eventType === 'gaze:looking_away') {
      const diff = now - timestamp
      if (diff >= 0 && diff <= TIMELINE_BUCKETS * TIMELINE_BUCKET_MS) {
        const bucketIndex = Math.min(
          TIMELINE_BUCKETS - 1,
          TIMELINE_BUCKETS - 1 - Math.floor(diff / TIMELINE_BUCKET_MS)
        )
        summary.timeline[bucketIndex] += 1
      }
    }

    switch (eventType) {
      case 'attention:present': {
        summary.attentionPresentCount += 1
        if (summary.attentionState === 'distracted' && summary.attentionTransition !== null) {
          summary.distractedMs += Math.max(0, timestamp - summary.attentionTransition)
        }
        summary.attentionState = 'focused'
        summary.attentionTransition = timestamp
        break
      }
      case 'attention:lost': {
        summary.attentionLostCount += 1
        if (summary.attentionState === 'focused' && summary.attentionTransition !== null) {
          summary.focusMs += Math.max(0, timestamp - summary.attentionTransition)
        }
        summary.attentionState = 'distracted'
        summary.attentionTransition = timestamp
        break
      }
      case 'gaze:looking_away': {
        summary.gazeDistractionCount += 1
        if (typeof data.gazeDuration === 'number') {
          summary.distractedMs += data.gazeDuration
        }
        break
      }
      case 'gaze:back_to_screen': {
        if (typeof data.gazeDuration === 'number') {
          summary.focusMs += data.gazeDuration
        }
        break
      }
      default:
        break
    }
  }

  const results: StudentAttentionSummary[] = []

  summaries.forEach(summary => {
    if (summary.attentionTransition !== null) {
      const elapsed = Math.max(0, now - summary.attentionTransition)
      if (summary.attentionState === 'focused') {
        summary.focusMs += elapsed
      } else {
        summary.distractedMs += elapsed
      }
    }

    const courseNames = summary.courseIds
      .map(id => courseMap.get(id)?.title)
      .filter((title): title is string => Boolean(title))

    const status: StudentAttentionSummary['status'] = (() => {
      if (!summary.lastEventAt) return 'idle'
      const sinceLast = now - summary.lastEventAt
      if (summary.attentionState === 'focused' && sinceLast < RECENT_ATTENTION_THRESHOLD_MS) {
        return 'focused'
      }
      if (summary.attentionState === 'distracted' && sinceLast < RECENT_ATTENTION_THRESHOLD_MS) {
        return 'distracted'
      }
      return 'idle'
    })()

    results.push({
      studentId: summary.studentId,
      studentName: summary.studentName,
      courseIds: summary.courseIds,
      courseNames,
      lastCourseTitle: summary.lastCourseTitle,
      status,
      focusMs: summary.focusMs,
      distractedMs: summary.distractedMs,
      attentionLostCount: summary.attentionLostCount,
      attentionPresentCount: summary.attentionPresentCount,
      gazeDistractionCount: summary.gazeDistractionCount,
      timeline: summary.timeline,
      lastEventAt: summary.lastEventAt,
      lastReason: summary.lastReason
    })
  })

  return results.sort((a, b) => {
    const statusOrder = { distracted: 0, focused: 1, idle: 2 }
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }
    return (b.lastEventAt ?? 0) - (a.lastEventAt ?? 0)
  })
}

const TeacherDashboard: React.FC = () => {
  const { user, isTeacher } = useAuth()
  const { courses, isLoading } = useCourses(user?._id, user?.role)
  const [studentSummaries, setStudentSummaries] = useState<StudentAttentionSummary[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const trackedStudentIds = useMemo(() => {
    if (!isTeacher) return []
    const ids = new Set<string>()
    courses.forEach(course => {
      course.studentIds.forEach(id => ids.add(id))
    })
    return Array.from(ids)
  }, [courses, isTeacher])

  const trackedCourseIds = useMemo(() => courses.map(course => course._id), [courses])

  const loadAttentionData = useCallback(async () => {
    if (!user?._id || !isTeacher || trackedStudentIds.length === 0) {
      setStudentSummaries([])
      setLastUpdated(Date.now())
      return
    }

    setIsFetching(true)
    try {
      const [students, events] = await Promise.all([
        zoomiesDB.getUsersByIds(trackedStudentIds),
        zoomiesDB.getEventsByUsers(trackedStudentIds, {
          limit: 1500,
          courseIds: trackedCourseIds
        })
      ])

      const summaries = buildStudentSummaries(students, courses, events)
      setStudentSummaries(summaries)
      setLastUpdated(Date.now())
      setErrorMessage(null)
    } catch (error) {
      console.error('Failed to load attention analytics', error)
      setErrorMessage('Unable to load attention analytics right now.')
    } finally {
      setIsFetching(false)
    }
  }, [courses, isTeacher, trackedCourseIds, trackedStudentIds, user?._id])

  useEffect(() => {
    if (!isTeacher || isLoading) return
    loadAttentionData()
    const interval = window.setInterval(loadAttentionData, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [isTeacher, isLoading, loadAttentionData])

  if (!isTeacher) {
    return (
      <div className="teacher-dashboard">
        <div className="empty-state">
          <h3>Teacher dashboard unavailable</h3>
          <p>Sign in with a teacher account to monitor student attention.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading">
          <div className="loading-spinner" />
          <p>Loading your courses…</p>
        </div>
      </div>
    )
  }

  const focusedNow = studentSummaries.filter(summary => summary.status === 'focused').length
  const distractedNow = studentSummaries.filter(summary => summary.status === 'distracted').length
  const totalDistractions = studentSummaries.reduce((acc, summary) => acc + summary.attentionLostCount + summary.gazeDistractionCount, 0)
  const aggregateFocusMs = studentSummaries.reduce((acc, summary) => acc + summary.focusMs, 0)

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Attention Overview</h1>
          <p>Live pulse of every student across your courses.</p>
        </div>
        <div className="dashboard-actions">
          {lastUpdated && (
            <span className="refresh-indicator">Updated {formatRelativeTime(lastUpdated)}</span>
          )}
          <button
            type="button"
            className="refresh-button"
            onClick={loadAttentionData}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="error-banner">{errorMessage}</div>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Students focused now</span>
          <span className="summary-value">{focusedNow}</span>
          <span className="summary-sub">out of {studentSummaries.length}</span>
        </div>
        <div className="summary-card distracted">
          <span className="summary-label">Currently distracted</span>
          <span className="summary-value">{distractedNow}</span>
          <span className="summary-sub">needs nudge</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Distraction events (today)</span>
          <span className="summary-value">{totalDistractions}</span>
          <span className="summary-sub">gaze + attention</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Aggregate focus time</span>
          <span className="summary-value">{formatDuration(aggregateFocusMs)}</span>
          <span className="summary-sub">since first log</span>
        </div>
      </div>

      {studentSummaries.length === 0 ? (
        <div className="empty-state">
          <h3>No student activity yet</h3>
          <p>Once learners join your courses, their focus metrics will appear here.</p>
        </div>
      ) : (
        <div className="student-grid">
          {studentSummaries.map(summary => (
            <div key={summary.studentId} className="student-card">
              <header>
                <div>
                  <div className="student-name">{summary.studentName}</div>
                  <div className="student-meta">
                    {summary.lastCourseTitle && (
                      <span>Latest course: {summary.lastCourseTitle}</span>
                    )}
                    <span>Last activity: {formatRelativeTime(summary.lastEventAt)}</span>
                    <span>Reason: {formatReason(summary.lastReason)}</span>
                  </div>
                </div>
                <span className={`status-chip ${summary.status}`}>
                  {summary.status === 'focused' && 'Focused'}
                  {summary.status === 'distracted' && 'Distracted'}
                  {summary.status === 'idle' && 'Idle'}
                </span>
              </header>

              <div className="student-stats">
                <div className="stat-pill">
                  <span className="label">Focus time</span>
                  <span className="value">{formatDuration(summary.focusMs)}</span>
                </div>
                <div className="stat-pill">
                  <span className="label">Distracted time</span>
                  <span className="value">{formatDuration(summary.distractedMs)}</span>
                </div>
                <div className="stat-pill">
                  <span className="label">Distractions</span>
                  <span className="value">{summary.attentionLostCount + summary.gazeDistractionCount}</span>
                </div>
              </div>

              <div className="student-trend">
                <label>Recent distraction trend (last hour)</label>
                <Sparkline data={summary.timeline} />
                <div className="timeline-scale">
                  <span>Older</span>
                  <span>Now</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard