import React from 'react'
import './KeyMetrics.css'

const KeyMetrics: React.FC = () => {
  return (
    <div className="key-metrics">
      <h3 className="metrics-title">Key Metrics</h3>
      
      <div className="metrics-list">
        <div className="metric-item">
          <span className="metric-bullet">•</span>
          <span className="metric-text">Class Attendance</span>
        </div>
        <div className="metric-item">
          <span className="metric-bullet">•</span>
          <span className="metric-text">Projects</span>
        </div>
        <div className="metric-item">
          <span className="metric-bullet">•</span>
          <span className="metric-text">Homework submissions</span>
        </div>
      </div>
      
      <div className="progress-container">
        <div className="progress-circle">
          <div className="progress-text">73.5</div>
        </div>
      </div>
    </div>
  )
}

export default KeyMetrics
