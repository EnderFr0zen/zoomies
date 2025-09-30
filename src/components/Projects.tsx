import React from 'react'
import './Projects.css'

const Projects: React.FC = () => {
  return (
    <div className="projects">
      <h3 className="projects-title">Projects</h3>
      
      <div className="project-card">
        <div className="project-header">
          <div className="project-teacher">
            <div className="teacher-avatar">👩‍🏫</div>
            <span className="teacher-name">Ms. Taylor's English Class</span>
          </div>
          <div className="project-stats">
            <span className="participants">100 Participants</span>
            <div className="participant-avatars">
              <div className="participant-avatar">👨</div>
              <div className="participant-avatar">👩</div>
              <div className="participant-avatar">👦</div>
            </div>
            <div className="project-progress">
              <div className="progress-circle">
                <span className="progress-text">50%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="project-description">
          <p>
            Build the skills that are useful for creating innovative solutions that shape the future...{' '}
            <span className="read-more">Read More</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Projects
