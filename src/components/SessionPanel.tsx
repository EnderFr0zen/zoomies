import React from 'react'
import { useSessionContext } from '../hooks/useSessionContext'
import './SessionPanel.css'

const SessionPanel: React.FC = () => {
  const { sessionContext, actions, utils } = useSessionContext()

  const subjects = [
    'Mathematics',
    'Science',
    'English',
    'History',
    'Geography',
    'Art',
    'Physical Education',
    'Music'
  ]

  return (
    <div className="session-panel">
      <div className="session-header">
        <h3>Study Session</h3>
        <div className="session-id">ID: {sessionContext.sessionId.slice(-8)}</div>
      </div>

      <div className="session-content">
        {/* Subject Selection */}
        <div className="session-field">
          <label htmlFor="subject-select">Subject:</label>
          <select
            id="subject-select"
            value={sessionContext.subject}
            onChange={(e) => actions.updateSubject(e.target.value)}
            className="subject-select"
            aria-label="Select subject"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Task Timer */}
        <div className="session-field">
          <label htmlFor="timer-display">Task Timer:</label>
          <div className="timer-controls" id="timer-display">
            <div className="timer-display">
              {utils.formatElapsedTime(sessionContext.taskTimer.elapsedTime)}
            </div>
            <div className="timer-buttons">
              <button
                onClick={sessionContext.taskTimer.isRunning ? actions.stopTaskTimer : actions.startTaskTimer}
                className={`timer-btn ${sessionContext.taskTimer.isRunning ? 'stop' : 'start'}`}
              >
                {sessionContext.taskTimer.isRunning ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={actions.resetTaskTimer}
                className="timer-btn reset"
                disabled={sessionContext.taskTimer.isRunning}
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* Mute State */}
        <div className="session-field">
          <label htmlFor="mute-btn">Audio:</label>
          <button
            id="mute-btn"
            onClick={actions.toggleMute}
            className={`mute-btn ${sessionContext.muteState ? 'muted' : 'unmuted'}`}
          >
            {sessionContext.muteState ? '🔇 Muted' : '🔊 Unmuted'}
          </button>
        </div>

        {/* Session Info */}
        <div className="session-info">
          <div className="session-duration">
            Session Duration: {utils.formatElapsedTime(Math.floor((Date.now() - sessionContext.startTime) / 1000))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionPanel
