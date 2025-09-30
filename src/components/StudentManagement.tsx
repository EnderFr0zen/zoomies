import React, { useState, useEffect } from 'react'
import { zoomiesDB } from '../database'
import type { UserDocument, CourseDocument } from '../database/types'
import './StudentManagement.css'

interface StudentManagementProps {
  course: CourseDocument
  onClose: () => void
  onUpdate: () => void
}

const StudentManagement: React.FC<StudentManagementProps> = ({ course, onClose, onUpdate }) => {
  const [allStudents, setAllStudents] = useState<UserDocument[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<UserDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [course])

  const loadStudents = async () => {
    try {
      setIsLoading(true)
      
      // Get all students
      const students = await zoomiesDB.getUsersByRole('student')
      setAllStudents(students)

      // Get enrolled students for this course
      const enrolled = students.filter(student => 
        course.studentIds.includes(student._id)
      )
      setEnrolledStudents(enrolled)
    } catch (error) {
      console.error('Failed to load students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnrollStudent = async (studentId: string) => {
    try {
      // Add student to course
      await zoomiesDB.addStudentToCourse(course._id, studentId)
      
      // Update student's enrolled courses
      await zoomiesDB.enrollStudentInCourse(studentId, course._id)
      
      // Refresh data
      await loadStudents()
      onUpdate()
    } catch (error) {
      console.error('Failed to enroll student:', error)
      alert('Failed to enroll student. Please try again.')
    }
  }

  const handleUnenrollStudent = async (studentId: string) => {
    try {
      // Remove student from course
      await zoomiesDB.removeStudentFromCourse(course._id, studentId)
      
      // Update student's enrolled courses
      await zoomiesDB.unenrollStudentFromCourse(studentId, course._id)
      
      // Refresh data
      await loadStudents()
      onUpdate()
    } catch (error) {
      console.error('Failed to unenroll student:', error)
      alert('Failed to unenroll student. Please try again.')
    }
  }

  const availableStudents = allStudents.filter(student => 
    !course.studentIds.includes(student._id)
  )

  if (isLoading) {
    return (
      <div className="student-management-overlay">
        <div className="student-management-modal">
          <div className="loading-spinner"></div>
          <p>Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="student-management-overlay">
      <div className="student-management-modal">
        <div className="modal-header">
          <h3>Manage Students - {course.title}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="student-management-content">
          {/* Enrolled Students */}
          <div className="student-section">
            <h4>Enrolled Students ({enrolledStudents.length})</h4>
            {enrolledStudents.length === 0 ? (
              <p className="no-students">No students enrolled in this course</p>
            ) : (
              <div className="student-list">
                {enrolledStudents.map(student => (
                  <div key={student._id} className="student-item enrolled">
                    <div className="student-info">
                      <span className="student-name">{student.displayName}</span>
                      <span className="student-username">@{student.username}</span>
                    </div>
                    <button
                      className="unenroll-btn"
                      onClick={() => handleUnenrollStudent(student._id)}
                      title="Remove from course"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Students */}
          <div className="student-section">
            <h4>Available Students ({availableStudents.length})</h4>
            {availableStudents.length === 0 ? (
              <p className="no-students">All students are already enrolled</p>
            ) : (
              <div className="student-list">
                {availableStudents.map(student => (
                  <div key={student._id} className="student-item available">
                    <div className="student-info">
                      <span className="student-name">{student.displayName}</span>
                      <span className="student-username">@{student.username}</span>
                    </div>
                    <button
                      className="enroll-btn"
                      onClick={() => handleEnrollStudent(student._id)}
                      title="Add to course"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentManagement
