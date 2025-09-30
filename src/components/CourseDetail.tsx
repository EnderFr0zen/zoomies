import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import VideoPlayer from './VideoPlayer'
import './CourseDetail.css'

interface CourseDetailProps {
  courseId: string
  onBack: () => void
}

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onBack }) => {
  const { user, isTeacher } = useAuth()
  const { getCourseById, updateCourseContent, addVideo, addReading } = useCourses(user?._id, user?.role)
  const [isEditing, setIsEditing] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [newReadingTitle, setNewReadingTitle] = useState('')
  const [newReadingUrl, setNewReadingUrl] = useState('')
  const [newReadingType, setNewReadingType] = useState<'pdf' | 'ppt' | 'pptx'>('pdf')

  const course = getCourseById(courseId)

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

    const updatedContent = {
      ...course.content,
      instructions,
      lastModified: new Date().toISOString(),
      modifiedBy: user?._id || ''
    }

    await updateCourseContent(courseId, updatedContent)
    setIsEditing(false)
  }

  const handleAddVideo = async () => {
    if (!isTeacher || !newVideoUrl || !newVideoTitle) return

    await addVideo(courseId, {
      title: newVideoTitle,
      type: 'youtube',
      url: newVideoUrl,
      order: course.content.videos.length + 1
    })

    setNewVideoUrl('')
    setNewVideoTitle('')
  }

  const handleAddReading = async () => {
    if (!isTeacher || !newReadingUrl || !newReadingTitle) return

    await addReading(courseId, {
      title: newReadingTitle,
      type: newReadingType,
      url: newReadingUrl,
      order: course.content.readings.length + 1
    })

    setNewReadingUrl('')
    setNewReadingTitle('')
    setNewReadingType('pdf')
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
                value={instructions || course.content.instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="instructions-textarea"
                placeholder="Enter course instructions..."
                rows={10}
              />
              <div className="edit-actions">
                <button onClick={handleSaveInstructions} className="save-button">
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="instructions-content">
              <pre>{course.content.instructions}</pre>
            </div>
          )}
        </section>

        {/* Video Content */}
        <section className="videos-section">
          <h2>Video Materials</h2>
          {course.content.videos.length === 0 ? (
            <p className="no-content">No video materials available</p>
          ) : (
            <div className="videos-list">
              {course.content.videos.map((video) => (
                <div key={video.id} className="video-item">
                  <h3>{video.title}</h3>
                  <VideoPlayer video={video} />
                </div>
              ))}
            </div>
          )}
          
          {isTeacher && (
            <div className="add-content-section">
              <h3>Add Video</h3>
              <div className="add-content-form">
                <input
                  type="text"
                  placeholder="Video Title"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  className="form-input"
                />
                <input
                  type="url"
                  placeholder="YouTube Link"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="form-input"
                />
                <button onClick={handleAddVideo} className="add-button">
                  Add Video
                </button>
              </div>
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
                <div key={reading.id} className="reading-item">
                  <div className="reading-icon">
                    {reading.type === 'pdf' ? '📄' : '📊'}
                  </div>
                  <div className="reading-info">
                    <h3>{reading.title}</h3>
                    <p className="reading-type">{reading.type.toUpperCase()} File</p>
                  </div>
                    <a 
                      href={reading.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="download-button"
                    >
                      Download
                    </a>
                </div>
              ))}
            </div>
          )}
          
          {isTeacher && (
            <div className="add-content-section">
              <h3>Add Reading Material</h3>
              <div className="add-content-form">
                <input
                  type="text"
                  placeholder="Material Title"
                  value={newReadingTitle}
                  onChange={(e) => setNewReadingTitle(e.target.value)}
                  className="form-input"
                />
                <select
                  value={newReadingType}
                  onChange={(e) => setNewReadingType(e.target.value as 'pdf' | 'ppt' | 'pptx')}
                  className="form-select"
                >
                  <option value="pdf">PDF</option>
                  <option value="ppt">PPT</option>
                  <option value="pptx">PPTX</option>
                </select>
                <input
                  type="url"
                  placeholder="File Link"
                  value={newReadingUrl}
                  onChange={(e) => setNewReadingUrl(e.target.value)}
                  className="form-input"
                />
                <button onClick={handleAddReading} className="add-button">
                  Add Material
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CourseDetail
