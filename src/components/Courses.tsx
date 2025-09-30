import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import CourseDetail from './CourseDetail'
import './Courses.css'

const Courses: React.FC = () => {
  const { user, isTeacher } = useAuth()
  const { courses, isLoading } = useCourses(user?._id, user?.role)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

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
        <h1>Courses</h1>
        <p>{isTeacher ? 'Manage your courses' : 'Your study courses'}</p>
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
            <div 
              key={course._id} 
              className="course-card"
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
                <span className="course-subject">{course.metadata.subject}</span>
              </div>
              
              <p className="course-description">{course.description}</p>
              
              <div className="course-meta">
                <div className="course-grade">
                  <span className="meta-label">Grade:</span>
                  <span>{course.metadata.grade}</span>
                </div>
                <div className="course-semester">
                  <span className="meta-label">Semester:</span>
                  <span>{course.metadata.semester}</span>
                </div>
              </div>

              <div className="course-content-preview">
                <div className="content-item">
                  <span className="content-icon">🎥</span>
                  <span>{course.content.videos.length} videos</span>
                </div>
                <div className="content-item">
                  <span className="content-icon">📄</span>
                  <span>{course.content.readings.length} readings</span>
                </div>
              </div>

              <div className="course-footer">
                <span className="last-modified">
                  Last updated: {new Date(course.updatedAt).toLocaleDateString('en-US')}
                </span>
                <div className="course-arrow">→</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Courses
