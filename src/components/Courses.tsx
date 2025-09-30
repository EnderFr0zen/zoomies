import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth.tsx'
import { useCourses } from '../hooks/useCourses'
import { databaseSystem } from '../database'
import CourseDetail from './CourseDetail'
import StudentManagement from './StudentManagement'
import type { CourseDocument } from '../database/types'
import './Courses.css'

const Courses: React.FC = () => {
  const { user, isTeacher } = useAuth()
  const { courses, isLoading } = useCourses(user?._id, user?.role)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [showStudentManagement, setShowStudentManagement] = useState(false)
  const [selectedCourseForManagement, setSelectedCourseForManagement] = useState<CourseDocument | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  
  // Course creation form state
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: ''
  })

  // Course creation function
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?._id) return

    try {
      await databaseSystem.createCourse({
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

      console.log('✅ Course created successfully!')

      // Reset form
      setNewCourse({
        title: '',
        description: ''
      })
      setShowCreateCourse(false)
      
      // Force refresh of courses by reloading the page
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Failed to create course:', error)
      alert('Failed to create course. Please try again.')
    }
  }

  // Student management functions
  const handleManageStudents = (course: CourseDocument) => {
    setSelectedCourseForManagement(course)
    setShowStudentManagement(true)
  }

  const handleCloseStudentManagement = () => {
    setShowStudentManagement(false)
    setSelectedCourseForManagement(null)
  }

  const handleStudentManagementUpdate = () => {
    // Refresh the courses list
    window.location.reload()
  }

  // Clear all courses function
  const handleClearAllCourses = async () => {
    try {
      await databaseSystem.clearAllCourses()
      console.log('✅ All courses cleared successfully!')
      setShowClearConfirm(false)
      // Force refresh of courses by reloading the page
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Failed to clear courses:', error)
      alert('Failed to clear courses. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="courses-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    )
  }

  if (selectedCourseId) {
    return (
      <CourseDetail 
        courseId={selectedCourseId} 
        onBack={() => setSelectedCourseId(null)}
      />
    )
  }

  return (
    <div className="courses-container">
              <div className="courses-header">
                <div className="header-content">
                  <h1>Courses</h1>
                  <p>{isTeacher ? 'Manage your courses' : 'Your study courses'}</p>
                </div>
                {isTeacher && (
                  <div className="header-actions">
                    <button 
                      className="clear-courses-btn"
                      onClick={() => setShowClearConfirm(true)}
                      disabled={courses.length === 0}
                      title={courses.length === 0 ? 'No courses to clear' : 'Clear all courses'}
                    >
                      🗑️ Clear All Courses
                    </button>
                    <button 
                      className="create-course-btn"
                      onClick={() => setShowCreateCourse(true)}
                    >
                      ➕ Create New Course
                    </button>
                  </div>
                )}
              </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="no-courses">
            <div className="no-courses-icon">📚</div>
            <h3>No Courses</h3>
            <p>{isTeacher ? 'You haven\'t created any courses yet' : 'You haven\'t enrolled in any courses yet'}</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course._id} className="course-card">
              <div 
                className="course-content"
                onClick={() => setSelectedCourseId(course._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedCourseId(course._id)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="course-header">
                  <h3>{course.title}</h3>
                </div>
                
                <p className="course-description">{course.description}</p>

                <div className="course-content-preview">
                  <div className="content-item">
                    <span className="content-icon">📄</span>
                    <span>{course.content.readings.length} readings</span>
                  </div>
                  <div className="content-item">
                    <span className="content-icon">👥</span>
                    <span>{course.studentIds.length} students</span>
                  </div>
                </div>

                <div className="course-footer">
                  <span className="last-modified">
                    Last updated: {new Date(course.updatedAt).toLocaleDateString('en-US')}
                  </span>
                  <div className="course-arrow">→</div>
                </div>
              </div>
              
              {isTeacher && (
                <div className="course-actions">
                  <button
                    className="manage-students-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleManageStudents(course)
                    }}
                    title="Manage students"
                  >
                    👥 Manage Students
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

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

              {/* Student Management Modal */}
              {showStudentManagement && selectedCourseForManagement && (
                <StudentManagement
                  course={selectedCourseForManagement}
                  onClose={handleCloseStudentManagement}
                  onUpdate={handleStudentManagementUpdate}
                />
              )}

              {/* Clear Courses Confirmation Modal */}
              {showClearConfirm && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>⚠️ Clear All Courses</h3>
                      <button 
                        className="close-btn"
                        onClick={() => setShowClearConfirm(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="modal-body">
                      <p>Are you sure you want to clear <strong>ALL courses</strong>?</p>
                      <p>This action cannot be undone. All course data, including:</p>
                      <ul>
                        <li>Course content and materials</li>
                        <li>Student enrollments</li>
                        <li>Course settings and metadata</li>
                      </ul>
                      <p>will be permanently deleted.</p>
                    </div>
                    <div className="form-actions">
                      <button 
                        type="button" 
                        onClick={() => setShowClearConfirm(false)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={handleClearAllCourses}
                        className="danger-btn"
                      >
                        🗑️ Clear All Courses
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        }

        export default Courses
