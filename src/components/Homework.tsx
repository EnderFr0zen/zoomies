import React from 'react'
import './Homework.css'

const Homework: React.FC = () => {
  return (
    <div className="homework">
      <div className="homework-header">
        <h3 className="homework-title">Homework</h3>
        <button className="view-all-btn">View all</button>
      </div>
      
      <div className="homework-list">
        <div className="homework-item completed">
          <div className="homework-icon">✓</div>
          <span className="homework-text">1. Create a Problem Statement</span>
        </div>
        <div className="homework-item pending">
          <div className="homework-icon">!</div>
          <span className="homework-text">2. Brainstorm</span>
        </div>
        <div className="homework-item pending">
          <div className="homework-icon">!</div>
          <span className="homework-text">3. Write an introduction</span>
        </div>
      </div>
    </div>
  )
}

export default Homework
