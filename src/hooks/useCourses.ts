import { useState, useEffect } from 'react'
import type { CourseDocument, CourseContent, ReadingItem } from '../database/types'
import { zoomiesDB } from '../database'
import { fileStorageService, type StoredFile } from '../services/fileStorage'

export const useCourses = (userId?: string, userRole?: string) => {
  const [courses, setCourses] = useState<CourseDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load courses from database
    const loadCourses = async () => {
      setIsLoading(true)
      
      try {
        let coursesData: CourseDocument[] = []
        
        if (userRole === 'teacher') {
          // Teacher sees all courses they created
          coursesData = await zoomiesDB.getCoursesByTeacher(userId || '')
        } else if (userRole === 'student') {
          // Student sees courses they are enrolled in
          coursesData = await zoomiesDB.getCoursesByStudent(userId || '')
        }
        
        setCourses(coursesData)
      } catch (error) {
        console.error('Failed to load courses:', error)
        setCourses([])
      }
      
      setIsLoading(false)
    }

    if (userId && userRole) {
      loadCourses()
    }
  }, [userId, userRole])

  const getCourseById = (courseId: string): CourseDocument | undefined => {
    return courses.find(course => course._id === courseId)
  }

  const updateCourseContent = async (courseId: string, content: CourseContent): Promise<boolean> => {
    try {
      await zoomiesDB.updateCourse(courseId, { content })
      
      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course._id === courseId 
            ? { ...course, content, updatedAt: new Date().toISOString() }
            : course
        )
      )
      
      return true
    } catch (error) {
      console.error('Failed to update course content:', error)
      return false
    }
  }


  const addReading = async (courseId: string, reading: Omit<ReadingItem, 'id'>): Promise<boolean> => {
    try {
      const course = await zoomiesDB.getCourseById(courseId)
      if (!course) return false

      const newReading: ReadingItem = {
        ...reading,
        id: `reading_${Date.now()}`
      }

      const updatedContent = {
        ...course.content,
        readings: [...course.content.readings, newReading].sort((a, b) => a.order - b.order)
      }

      await zoomiesDB.updateCourse(courseId, { content: updatedContent })
      
      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course._id === courseId 
            ? {
                ...course,
                content: updatedContent,
                updatedAt: new Date().toISOString()
              }
            : course
        )
      )
      
      return true
    } catch (error) {
      console.error('Failed to add reading:', error)
      return false
    }
  }

  const uploadFile = async (file: File, uploadedBy: string): Promise<string> => {
    try {
      const storedFile = await fileStorageService.uploadFile(file, uploadedBy)
      return storedFile.url
    } catch (error) {
      console.error('File upload failed:', error)
      throw new Error('File upload failed')
    }
  }

  const addReadingFromFile = async (courseId: string, file: File, uploadedBy: string): Promise<boolean> => {
    try {
      const fileUrl = await uploadFile(file, uploadedBy)

      const reading: Omit<ReadingItem, 'id'> = {
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension from title
        type: 'pdf', // Only PDF files are supported
        url: fileUrl,
        order: courses.find(c => c._id === courseId)?.content.readings.length || 0
      }

      return await addReading(courseId, reading)
    } catch (error) {
      console.error('Failed to add reading from file:', error)
      return false
    }
  }

  const getFileInfo = (fileId: string): StoredFile | null => {
    return fileStorageService.getFile(fileId)
  }

  const deleteFile = (fileId: string): boolean => {
    return fileStorageService.deleteFile(fileId)
  }

  return {
    courses,
    isLoading,
    getCourseById,
    updateCourseContent,
    addReading,
    uploadFile,
    addReadingFromFile,
    getFileInfo,
    deleteFile
  }
}