import React from 'react'
import './Classes.css'

const Classes: React.FC = () => {
  return (
    <div className="classes">
      <div className="classes-header">
        <h3 className="classes-title">Classes</h3>
        <button className="view-all-btn">View all</button>
      </div>
      
      <div className="classes-grid">
        <div className="class-card grammar">
          <div className="class-content">
            <h4 className="class-name">Introduction to Grammars</h4>
            <div className="class-profiles">
              <div className="profile-avatar">👨</div>
              <div className="profile-avatar">👩</div>
            </div>
            <div className="class-progress">
              <div className="progress-circle">
                <span className="progress-text">7/10</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="class-card vowel">
          <div className="class-content">
            <h4 className="class-name">Vowel Fundamentals</h4>
            <div className="class-profiles">
              <div className="profile-avatar">👨</div>
              <div className="profile-avatar">👩</div>
            </div>
            <div className="class-progress">
              <div className="progress-circle">
                <span className="progress-text">7/10</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="class-card vocabulary">
          <div className="class-content">
            <h4 className="class-name">Vocabulary 101</h4>
            <div className="class-profiles">
              <div className="profile-avatar">👨</div>
              <div className="profile-avatar">👩</div>
            </div>
            <div className="class-progress">
              <div className="progress-circle">
                <span className="progress-text">7/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Classes
