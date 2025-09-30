import React, { useState, useEffect } from 'react'
import './FileViewer.css'

interface FileViewerProps {
  file: {
    id: string
    title: string
    type: string
    url: string
  }
  onClose: () => void
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setError('')
  }, [file.id])

  const getFileType = (url: string, mimeType: string): string => {
    if (mimeType) {
      if (mimeType.includes('pdf')) return 'pdf'
      if (mimeType.includes('image')) return 'image'
      if (mimeType.includes('text')) return 'text'
    }
    
    const extension = url.split('.').pop()?.toLowerCase()
    if (extension === 'pdf') return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image'
    if (['txt', 'md'].includes(extension || '')) return 'text'
    
    return 'unknown'
  }

  const fileType = getFileType(file.url, file.type)

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

    switch (fileType) {
      case 'pdf':
        return (
          <iframe
            src={file.url}
            className="file-iframe"
            onLoad={handleLoad}
            onError={handleError}
            title={file.title}
          />
        )
      
      case 'image':
        return (
          <div className="image-container">
            <img
              src={file.url}
              alt={file.title}
              className="file-image"
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        )
      
      case 'text':
        return (
          <div className="text-container">
            <iframe
              src={file.url}
              className="file-iframe text-iframe"
              onLoad={handleLoad}
              onError={handleError}
              title={file.title}
            />
          </div>
        )
      
      default:
        return (
          <div className="unsupported-file">
            <div className="file-icon">📄</div>
            <h3>Preview not available</h3>
            <p>This file type cannot be previewed in the browser.</p>
            <a 
              href={file.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="download-fallback"
            >
              Download file
            </a>
          </div>
        )
    }
  }

  return (
    <div className="file-viewer-overlay">
      <div className="file-viewer-container">
        <div className="file-viewer-header">
          <div className="file-info">
            <div className="file-icon">
              {fileType === 'pdf' ? '📄' : 
               fileType === 'image' ? '🖼️' : 
               fileType === 'text' ? '📝' : '📄'}
            </div>
            <div className="file-details">
              <h2>{file.title}</h2>
              <span className="file-type">{file.type.toUpperCase()}</span>
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
              ⬇️
            </a>
            <button 
              onClick={onClose} 
              className="close-btn"
              title="Close viewer"
            >
              ✕
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
    </div>
  )
}

export default FileViewer
