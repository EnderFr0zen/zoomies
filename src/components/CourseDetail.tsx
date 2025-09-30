import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.tsx'
import { useCourses } from '../hooks/useCourses'
import FileUpload from './FileUpload'
import InlineFileViewer from './InlineFileViewer'
import GazeCamera from './GazeCamera'
import { useCourseAttentionTracking } from '../hooks/useCourseAttentionTracking'
import './CourseDetail.css'

interface CourseDetailProps {
  courseId: string
  onBack: () => void
}

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onBack }) => {
  const { user, isTeacher } = useAuth()
  const { getCourseById, updateCourseContent, addReadingFromFile, isLoading } = useCourses(user?._id, user?.role)
  const [isEditing, setIsEditing] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [viewingFile, setViewingFile] = useState<{
    id: string
    title: string
    type: string
    url: string
  } | null>(null)

  const course = getCourseById(courseId)
  useCourseAttentionTracking(!isTeacher && course ? courseId : null, { courseTitle: course?.title })

  // Initialize instructions when course loads
  useEffect(() => {
    if (course) {
      setInstructions(course.content.instructions)
    }
  }, [course])

  // Show loading state while courses are being loaded
  if (isLoading) {
    return (
      <div className="course-detail-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading course...</p>
        </div>
      </div>
    )
  }

  // Only show "Course Not Found" after loading is complete
  if (!course) {
    return (
      <div className="course-detail-container">
        <div className="error-message">
          <h2>Course Not Found</h2>
          <p>Could not find the specified course. Please return to the course list.</p>
          <button onClick={onBack} className="back-button">Back to Course List</button>
        </div>
      </div>
    )
  }

  const handleSaveInstructions = async () => {
    if (!isTeacher) return

    try {
      const updatedContent = {
        ...course.content,
        instructions,
        lastModified: new Date().toISOString(),
        modifiedBy: user?._id || ''
      }

      await updateCourseContent(courseId, updatedContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save instructions:', error)
      alert('Failed to save instructions. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    // Reset instructions to original content
    if (course) {
      setInstructions(course.content.instructions)
    }
    setIsEditing(false)
  }



  const handleFileUpload = async (file: File): Promise<string> => {
    if (!isTeacher || !user?._id) {
      throw new Error('Not authorized to upload files')
    }

    const success = await addReadingFromFile(courseId, file, user._id)
    if (!success) {
      throw new Error('Failed to upload file')
    }

    // Return a success message or file URL
    return `File "${file.name}" uploaded successfully`
  }

  const handleViewFile = (reading: { id: string; title: string; type: string; url: string }) => {
    setViewingFile(reading)
  }

  const handleCloseViewer = () => {
    setViewingFile(null)
  }

  return (
    <div className="course-detail-container">
      <div className="course-detail-header">
        <button onClick={onBack} className="back-button">
          ← Back to Course List
        </button>
        <div className="course-title-section">
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
        {isTeacher && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="edit-button"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Course'}
            </button>
        )}
      </div>

      <div className="course-content">
        {/* Course Instructions */}
        <section className="instructions-section">
          <h2>Course Instructions</h2>
          {isEditing ? (
            <div className="edit-section">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="instructions-textarea"
                placeholder="Enter course instructions..."
                rows={10}
              />
              <div className="edit-actions">
                <button onClick={handleSaveInstructions} className="save-button">
                  Save
                </button>
                <button onClick={handleCancelEdit} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="instructions-content">
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ 
                  __html: course.content.instructions
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                }}
              />
            </div>
          )}
        </section>


        {/* Reading Materials */}
        <section className="readings-section">
          <h2>Reading Materials</h2>
          {course.content.readings.length === 0 ? (
            <p className="no-content">No reading materials available</p>
          ) : (
            <div className="readings-list">
              {course.content.readings.map((reading) => (
                <div key={reading.id}>
                  <div className="reading-item">
                    <div className="reading-icon">📄</div>
                    <div className="reading-info">
                      <h3>{reading.title}</h3>
                      <p className="reading-type">PDF File</p>
                    </div>
                    <div className="reading-actions">
                      <button 
                        onClick={() => handleViewFile(reading)}
                        className="view-button"
                      >
                        👁️ View
                      </button>
                      <a 
                        href={reading.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="download-button"
                      >
                        ⬇️ Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isTeacher && (
            <div className="add-content-section">
              <h3>Add Reading Material</h3>
              <div className="file-upload-section">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  disabled={!isTeacher}
                />
              </div>
            </div>
          )}
        </section>
      </div>
      
      {/* File Viewer Modal */}
      {viewingFile && (
        <InlineFileViewer
          file={viewingFile}
          onClose={handleCloseViewer}
        />
      )}
      
      {/* Gaze Detection Camera - Only for students */}
      {!isTeacher && (
        <GazeCamera courseId={courseId} />
      )}
    </div>
  )
}

export default CourseDetail


