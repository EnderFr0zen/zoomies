import React, { useState, useEffect } from 'react'
import './InlineFileViewer.css'

interface InlineFileViewerProps {
  file: {
    id: string
    title: string
    type: string
    url: string
  }
  onClose: () => void
}

const InlineFileViewer: React.FC<InlineFileViewerProps> = ({ file, onClose }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setError('')
  }, [file.id, file.url, file.type])

  // Only PDF files are supported

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError('Failed to load file')
  }

  const renderFileContent = () => {
    if (error) {
      return (
        <div className="file-error">
          <div className="error-icon">⚠️</div>
          <h3>Unable to display file</h3>
          <p>{error}</p>
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="download-fallback"
          >
            Download file instead
          </a>
        </div>
      )
    }

    // Only PDF files are supported
    return (
      <iframe
        src={file.url}
        className="file-iframe"
        onLoad={handleLoad}
        onError={handleError}
        title={file.title}
      />
    )
  }

  return (
    <div className="inline-file-viewer">
      <div className="file-viewer-header">
        <div className="file-info">
          <div className="file-icon">📄</div>
          <div className="file-details">
            <h3>{file.title}</h3>
            <span className="file-type">PDF</span>
          </div>
        </div>
        <div className="file-actions">
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="download-btn"
            title="Download file"
          >
            ⬇️ Download
          </a>
          <button 
            onClick={onClose} 
            className="close-btn"
            title="Close viewer"
          >
            ✕ Close
          </button>
        </div>
      </div>
      
      <div className="file-viewer-content">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading file...</p>
          </div>
        )}
        {renderFileContent()}
      </div>
    </div>
  )
}

export default InlineFileViewer
