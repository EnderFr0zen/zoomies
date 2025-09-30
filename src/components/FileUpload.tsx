import React, { useState, useRef } from 'react'
import './FileUpload.css'

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<string>
  disabled?: boolean
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  disabled = false 
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type - only PDF allowed
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (fileExtension !== 'pdf') {
      return 'Only PDF files are allowed'
    }

    // Check file size (20MB limit)
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > 20) {
      return 'File too large. Maximum size: 20MB'
    }

    return null
  }

  const handleFileSelect = async (file: File) => {
    setError('')
    
    console.log(`File selected: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type}`)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    try {
      console.log(`Starting upload for: ${file.name}`)
      await onFileUpload(file)
      console.log(`Upload successful for: ${file.name}`)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        
        <div className="upload-content">
          {isUploading ? (
            <div className="uploading">
              <div className="upload-spinner"></div>
              <p>Uploading...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="upload-hint">
                PDF files only (max 20MB)
              </p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}
    </div>
  )
}

export default FileUpload
