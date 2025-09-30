// File Storage Service
// In a real application, this would integrate with cloud storage (AWS S3, Google Cloud, etc.)
// For this demo, we'll use localStorage to simulate file storage

export interface StoredFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
  uploadedBy: string
}

class FileStorageService {
  private readonly STORAGE_KEY = 'zoomies_files'

  private getStoredFiles(): StoredFile[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading stored files:', error)
      return []
    }
  }

  private saveStoredFiles(files: StoredFile[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
      console.error('Error saving files:', error)
      throw new Error('Failed to save file')
    }
  }

  async uploadFile(file: File, uploadedBy: string): Promise<StoredFile> {
    return new Promise((resolve, reject) => {
      // Check file size (localStorage has ~5-10MB limit, but we'll try 20MB)
      const maxSize = 20 * 1024 * 1024 // 20MB
      if (file.size > maxSize) {
        reject(new Error(`File too large. Maximum size is ${this.formatFileSize(maxSize)}. Your file is ${this.formatFileSize(file.size)}.`))
        return
      }

      console.log(`Uploading file: ${file.name}, size: ${this.formatFileSize(file.size)}, type: ${file.type}`)

      const reader = new FileReader()
      
      reader.onload = () => {
        try {
          const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          const storedFile: StoredFile = {
            id: fileId,
            name: file.name,
            type: file.type || this.getFileTypeFromExtension(file.name),
            size: file.size,
            url: reader.result as string, // In real app, this would be a cloud URL
            uploadedAt: new Date().toISOString(),
            uploadedBy
          }

          console.log(`File converted to base64, size: ${this.formatFileSize((reader.result as string).length)}`)

          const existingFiles = this.getStoredFiles()
          existingFiles.push(storedFile)
          this.saveStoredFiles(existingFiles)

          console.log(`File uploaded successfully: ${file.name}`)
          resolve(storedFile)
        } catch (error) {
          console.error('Error processing file:', error)
          reject(new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }

      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        reject(new Error('Failed to read file. The file may be corrupted or too large.'))
      }

      try {
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error starting file read:', error)
        reject(new Error('Failed to start reading file. The file may be corrupted.'))
      }
    })
  }

  getFile(fileId: string): StoredFile | null {
    const files = this.getStoredFiles()
    return files.find(file => file.id === fileId) || null
  }

  getFilesByUploader(uploadedBy: string): StoredFile[] {
    const files = this.getStoredFiles()
    return files.filter(file => file.uploadedBy === uploadedBy)
  }

  deleteFile(fileId: string): boolean {
    try {
      const files = this.getStoredFiles()
      const filteredFiles = files.filter(file => file.id !== fileId)
      
      if (filteredFiles.length === files.length) {
        return false // File not found
      }

      this.saveStoredFiles(filteredFiles)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  private getFileTypeFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    // Only PDF files are supported
    if (extension === 'pdf') {
      return 'application/pdf'
    }

    return 'application/octet-stream'
  }

  // Get file size in human readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Check if file type is supported (only PDF)
  isSupportedFileType(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension === 'pdf'
  }
}

export const fileStorageService = new FileStorageService()
