import React, { useState, useEffect } from 'react'
import './TeacherDashboard.css'

interface StudentMetrics {
  studentId: string
  studentName: string
  focusPercentage: number
  totalSessions: number
  averageSessionTime: number
  lastActive: string
  currentStatus: 'online' | 'offline' | 'in-session'
}

const TeacherDashboard: React.FC = () => {
  const [students, setStudents] = useState<StudentMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  useEffect(() => {
    // Simulate loading student data
    const loadStudentData = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock student data
      const mockStudents: StudentMetrics[] = [
        {
          studentId: 'student1',
          studentName: 'Alice',
          focusPercentage: 85,
          totalSessions: 12,
          averageSessionTime: 45,
          lastActive: new Date().toISOString(),
          currentStatus: 'in-session'
        },
        {
          studentId: 'student2',
          studentName: 'Bob',
          focusPercentage: 72,
          totalSessions: 8,
          averageSessionTime: 38,
          lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          currentStatus: 'online'
        },
        {
          studentId: 'student3',
          studentName: 'Carol',
          focusPercentage: 91,
          totalSessions: 15,
          averageSessionTime: 52,
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          currentStatus: 'offline'
        }
      ]
      
      setStudents(mockStudents)
      setIsLoading(false)
    }

    loadStudentData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-session': return '#28a745'
      case 'online': return '#17a2b8'
      case 'offline': return '#6c757d'
      default: return '#6c757d'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-session': return 'Learning'
      case 'online': return 'Online'
      case 'offline': return 'Offline'
      default: return 'Unknown'
    }
  }

  const getFocusLevel = (percentage: number) => {
    if (percentage >= 80) return { level: 'Excellent', color: '#28a745' }
    if (percentage >= 60) return { level: 'Good', color: '#ffc107' }
    return { level: 'Needs Improvement', color: '#dc3545' }
  }

  if (isLoading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading student data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h1>Student Focus Monitoring</h1>
        <p>Real-time tracking of student learning status and focus performance</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{students.length}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{students.filter(s => s.currentStatus === 'in-session').length}</h3>
            <p>Currently Learning</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{Math.round(students.reduce((acc, s) => acc + s.focusPercentage, 0) / students.length)}%</h3>
            <p>Average Focus</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{Math.round(students.reduce((acc, s) => acc + s.averageSessionTime, 0) / students.length)}</h3>
            <p>Avg Study Time (min)</p>
          </div>
        </div>
      </div>

      <div className="students-section">
        <h2>Student List</h2>
        <div className="students-grid">
          {students.map((student) => {
            const focusLevel = getFocusLevel(student.focusPercentage)
            return (
              <div 
                key={student.studentId} 
                className={`student-card ${selectedStudent === student.studentId ? 'selected' : ''}`}
                onClick={() => setSelectedStudent(selectedStudent === student.studentId ? null : student.studentId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedStudent(selectedStudent === student.studentId ? null : student.studentId)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="student-header">
                  <div className="student-avatar">
                    {student.studentName.charAt(0)}
                  </div>
                  <div className="student-info">
                    <h3>{student.studentName}</h3>
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(student.currentStatus) }}
                    >
                      {getStatusText(student.currentStatus)}
                    </div>
                  </div>
                </div>

                  <div className="student-metrics">
                    <div className="metric">
                      <span className="metric-label">Focus</span>
                      <div className="metric-value">
                        <span 
                          className="focus-percentage"
                          style={{ color: focusLevel.color }}
                        >
                          {student.focusPercentage}%
                        </span>
                        <span className="focus-level" style={{ color: focusLevel.color }}>
                          {focusLevel.level}
                        </span>
                      </div>
                    </div>

                    <div className="metric">
                      <span className="metric-label">Study Sessions</span>
                      <span className="metric-value">{student.totalSessions}</span>
                    </div>

                    <div className="metric">
                      <span className="metric-label">Avg Duration</span>
                      <span className="metric-value">{student.averageSessionTime} min</span>
                    </div>
                  </div>

                <div className="student-footer">
                  <span className="last-active">
                    Last Active: {new Date(student.lastActive).toLocaleString('en-US')}
                  </span>
                </div>

                {selectedStudent === student.studentId && (
                  <div className="student-details">
                    <h4>Details</h4>
                    <div className="detail-item">
                      <span>Student ID:</span>
                      <span>{student.studentId}</span>
                    </div>
                    <div className="detail-item">
                      <span>Total Study Time:</span>
                      <span>{student.totalSessions * student.averageSessionTime} min</span>
                    </div>
                    <div className="detail-item">
                      <span>Study Efficiency:</span>
                      <span style={{ color: focusLevel.color }}>
                        {focusLevel.level}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
