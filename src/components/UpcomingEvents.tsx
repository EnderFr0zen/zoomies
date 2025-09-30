import React from 'react'
import './UpcomingEvents.css'

const UpcomingEvents: React.FC = () => {
  return (
    <div className="upcoming-events">
      <h3 className="events-title">Upcoming events</h3>
      
      <div className="calendar-nav">
        <button className="nav-arrow">‹</button>
        <div className="month-year">Feb, 2023</div>
        <button className="nav-arrow">›</button>
      </div>
      
      <div className="events-list">
        <div className="event-item green">
          <div className="event-date">
            <span className="date-icon">📅</span>
            <span className="date-text">3rd</span>
          </div>
          <span className="event-text">Webinar Accessibility</span>
        </div>
        
        <div className="event-item green">
          <div className="event-date">
            <span className="date-icon">📅</span>
            <span className="date-text">5th</span>
          </div>
          <span className="event-text">Group Project meet</span>
        </div>
        
        <div className="event-item pink">
          <div className="event-date">
            <span className="date-icon">📅</span>
            <span className="date-text">6th</span>
          </div>
          <span className="event-text">Live class</span>
        </div>
        
        <div className="event-item orange">
          <div className="event-date">
            <span className="date-icon">📅</span>
            <span className="date-text">7th</span>
          </div>
          <span className="event-text">Live class</span>
        </div>
      </div>
    </div>
  )
}

export default UpcomingEvents
