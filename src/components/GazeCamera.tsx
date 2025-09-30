import React from 'react'
import { useCompleteGazeDetection } from '../hooks/useCompleteGazeDetection'
import './GazeCamera.css'

interface GazeCameraProps {
  courseId: string
}

const GazeCamera: React.FC<GazeCameraProps> = ({ courseId }) => {
  const {
    isActive,
    isPermissionGranted,
    isDetecting,
    distractionCount,
    focusTime,
    videoRef,
    canvasRef,
    toggleDetection
  } = useCompleteGazeDetection(courseId)

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="gaze-camera-container">
      <div className="gaze-camera-header">
        <h3>注意力監測</h3>
        <button 
          className={`gaze-toggle-btn ${isActive ? 'active' : ''}`}
          onClick={toggleDetection}
        >
          {isActive ? '停止監測' : '開始監測'}
        </button>
      </div>

      <div className="gaze-camera-content">
        {isActive ? (
          <div className="camera-view">
            <video
              ref={videoRef}
              className="gaze-video"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="gaze-canvas"
              width={320}
              height={240}
            />
            
            {!isPermissionGranted && (
              <div className="permission-overlay">
                <div className="camera-icon">📹</div>
                <p>正在請求攝像頭權限...</p>
              </div>
            )}
            
            {isPermissionGranted && isDetecting && (
              <div className="detection-indicator">
                <div className="pulse-dot"></div>
                <span>監測中...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="camera-placeholder">
            <div className="camera-icon">📹</div>
            <p>點擊開始監測以啟用攝像頭</p>
          </div>
        )}

        <div className="gaze-stats">
          <div className="stat-item">
            <span className="stat-label">分心次數:</span>
            <span className="stat-value">{distractionCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">專注時間:</span>
            <span className="stat-value">{formatTime(focusTime)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GazeCamera
