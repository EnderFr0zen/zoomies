import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.tsx'
import { useCourses } from '../hooks/useCourses'
import { zoomiesDB } from '../database'
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
  const { user } = useAuth()
  const { courses } = useCourses(user?._id, user?.role)
  const [students, setStudents] = useState<StudentMetrics[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students'>('overview')
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [showAddStudents, setShowAddStudents] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  
  // Course creation form state
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: ''
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load all students
        const studentsData = await zoomiesDB.getUsersByRole('student')
        setAllStudents(studentsData)
        
        // Convert to StudentMetrics format
        const studentMetrics: StudentMetrics[] = studentsData.map(student => ({
          studentId: student._id,
          studentName: student.displayName,
          focusPercentage: Math.floor(Math.random() * 40) + 60, // Mock data for now
          totalSessions: Math.floor(Math.random() * 20) + 5,
          averageSessionTime: Math.floor(Math.random() * 30) + 30,
          lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          currentStatus: Math.random() > 0.7 ? 'in-session' : Math.random() > 0.5 ? 'online' : 'offline'
        }))
        
        setStudents(studentMetrics)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
      setIsLoading(false)
    }

    loadData()
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

  // Course management functions
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?._id) return

    try {
      await zoomiesDB.createCourse({
        title: newCourse.title,
        description: newCourse.description,
        teacherId: user._id,
        studentIds: [],
        isActive: true,
        content: {
          instructions: `# ${newCourse.title}\n\nWelcome to this course! Please follow the instructions below.`,
          readings: [],
          lastModified: new Date().toISOString(),
          modifiedBy: user._id
        }
      })

      // Reset form
      setNewCourse({
        title: '',
        description: ''
      })
      setShowCreateCourse(false)
      
      // Refresh courses (this will trigger a re-render)
      window.location.reload()
    } catch (error) {
      console.error('Failed to create course:', error)
      alert('Failed to create course. Please try again.')
    }
  }

  const handleAddStudentsToCourse = async (studentIds: string[]) => {
    if (!selectedCourse) return

    try {
      const course = await zoomiesDB.getCourseById(selectedCourse)
      if (!course) return

      const updatedStudentIds = [...new Set([...course.studentIds, ...studentIds])]
      await zoomiesDB.updateCourse(selectedCourse, {
        studentIds: updatedStudentIds
      })

      setShowAddStudents(false)
      setSelectedCourse(null)
      window.location.reload()
    } catch (error) {
      console.error('Failed to add students to course:', error)
      alert('Failed to add students to course. Please try again.')
    }
  }


  const getAvailableStudents = (courseId: string) => {
    const course = courses.find(c => c._id === courseId)
    if (!course) return allStudents
    return allStudents.filter(student => !course.studentIds.includes(student._id))
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
        <h1>Teacher Dashboard</h1>
        <p>Manage courses, students, and monitor learning progress</p>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses
        </button>
        <button 
          className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Students
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
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
                <h3>{courses.length}</h3>
                <p>Total Courses</p>
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
        </>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="courses-section">
          <div className="section-header">
            <h2>Course Management</h2>
            <button 
              className="create-course-btn"
              onClick={() => setShowCreateCourse(true)}
            >
              ➕ Create New Course
            </button>
          </div>

          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course._id} className="course-card">
                <div className="course-header">
                  <h3>{course.title}</h3>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <span>Students: {course.studentIds.length}</span>
                </div>
                <div className="course-actions">
                  <button 
                    className="manage-students-btn"
                    onClick={() => {
                      setSelectedCourse(course._id)
                      setShowAddStudents(true)
                    }}
                  >
                    👥 Manage Students
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="students-management">
          <h2>Student Management</h2>
          <div className="students-list">
            {allStudents.map((student) => (
              <div key={student._id} className="student-item">
                <div className="student-info">
                  <div className="student-avatar">{student.displayName.charAt(0)}</div>
                  <div>
                    <h4>{student.displayName}</h4>
                    <p>{student.email}</p>
                  </div>
                </div>
                <div className="student-courses">
                  <span>Enrolled in {student.enrolledCourses?.length || 0} courses</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Course</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateCourse(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="course-form">
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  rows={3}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateCourse(false)}>
                  Cancel
                </button>
                <button type="submit">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Students Modal */}
      {showAddStudents && selectedCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Students to Course</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddStudents(false)
                  setSelectedCourse(null)
                }}
              >
                ✕
              </button>
            </div>
            <div className="students-selection">
              <h4>Available Students</h4>
              <div className="students-checkbox-list">
                {getAvailableStudents(selectedCourse).map((student) => (
                  <label key={student._id} className="student-checkbox-item">
                    <input
                      type="checkbox"
                      value={student._id}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleAddStudentsToCourse([student._id])
                        }
                      }}
                    />
                    <span>{student.displayName} ({student.email})</span>
                  </label>
                ))}
              </div>
              {getAvailableStudents(selectedCourse).length === 0 && (
                <p>All students are already enrolled in this course.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard
