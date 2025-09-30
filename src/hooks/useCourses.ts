import { useState, useEffect } from 'react'
import type { CourseDocument, CourseContent, VideoItem, ReadingItem } from '../database/types'

// Mock course data
const MOCK_COURSES: CourseDocument[] = [
  {
    _id: 'course1',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'course',
    title: 'History',
    description: 'Ancient Chinese History Study',
    teacherId: 'teacher1',
    studentIds: ['student1', 'student2', 'student3'],
    isActive: true,
    content: {
      instructions: `# History - Qin Dynasty Unification

## Course Objectives
Understand how the Qin Dynasty unified the six states and established the first centralized state in Chinese history.

## Key Learning Points
1. The rise of the Qin state
2. The order and reasons for the fall of the six states
3. Qin Shi Huang's ruling policies
4. Institutional construction after unification

## Classroom Activities
- Watch related video materials
- Read historical documents
- Discuss the impact of unification on later generations

Please study carefully and take notes!`,
      videos: [
        {
          id: 'video1',
          title: 'Qin Dynasty Unification Process',
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order: 1
        }
      ],
      readings: [
        {
          id: 'reading1',
          title: 'Qin Dynasty Historical Materials',
          type: 'pdf',
          url: '/sample.pdf',
          order: 1
        }
      ],
      lastModified: new Date().toISOString(),
      modifiedBy: 'teacher1'
    },
    metadata: {
      subject: 'History',
      grade: 'Middle School',
      semester: 'Fall Semester'
    }
  },
  {
    _id: 'course2',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'course',
    title: 'Mathematics',
    description: 'Algebra Fundamentals',
    teacherId: 'teacher1',
    studentIds: ['student1', 'student2', 'student3'],
    isActive: true,
    content: {
      instructions: `# Mathematics - Quadratic Equations

## Course Objectives
Master the methods of solving quadratic equations, including factoring, completing the square, and the quadratic formula.

## Key Learning Points
1. Standard form of quadratic equations
2. Application of discriminant
3. Relationship between roots and coefficients
4. Application to real-world problems

## Practice Exercises
Complete exercises on pages 85-90 of the textbook`,
      videos: [
        {
          id: 'video2',
          title: 'Quadratic Equation Solutions',
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order: 1
        }
      ],
      readings: [
        {
          id: 'reading2',
          title: 'Algebra Fundamentals Handout',
          type: 'pdf',
          url: '/sample.pdf',
          order: 1
        }
      ],
      lastModified: new Date().toISOString(),
      modifiedBy: 'teacher1'
    },
    metadata: {
      subject: 'Mathematics',
      grade: 'Middle School',
      semester: 'Fall Semester'
    }
  },
  {
    _id: 'course3',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'course',
    title: 'Literature',
    description: 'Modern Literature Appreciation',
    teacherId: 'teacher1',
    studentIds: ['student1', 'student2', 'student3'],
    isActive: true,
    content: {
      instructions: `# Literature - Modern Poetry Appreciation

## Course Objectives
Learn the expression techniques and artistic characteristics of modern poetry, improve literary appreciation skills.

## Key Learning Points
1. Characteristics of modern poetry
2. Use of imagery
3. Language expression techniques
4. Ways of expressing emotions

## Reading Materials
Please carefully read the provided poetry works`,
      videos: [
        {
          id: 'video3',
          title: 'Modern Poetry Recitation',
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order: 1
        }
      ],
      readings: [
        {
          id: 'reading3',
          title: 'Modern Poetry Collection',
          type: 'pdf',
          url: '/sample.pdf',
          order: 1
        }
      ],
      lastModified: new Date().toISOString(),
      modifiedBy: 'teacher1'
    },
    metadata: {
      subject: 'Literature',
      grade: 'Middle School',
      semester: 'Fall Semester'
    }
  },
  {
    _id: 'course4',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'course',
    title: 'Science',
    description: 'Physics Fundamentals',
    teacherId: 'teacher1',
    studentIds: ['student1', 'student2', 'student3'],
    isActive: true,
    content: {
      instructions: `# Science - Newton's Laws of Motion

## Course Objectives
Understand Newton's three laws of motion and master the basic concepts of mechanics.

## Key Learning Points
1. First Law: Law of Inertia
2. Second Law: F=ma
3. Third Law: Action and Reaction
4. Real-world application examples

## Laboratory Activities
Complete related experiments from the textbook`,
      videos: [
        {
          id: 'video4',
          title: 'Newton\'s Laws Experiment',
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order: 1
        }
      ],
      readings: [
        {
          id: 'reading4',
          title: 'Physics Fundamentals Handout',
          type: 'pdf',
          url: '/sample.pdf',
          order: 1
        }
      ],
      lastModified: new Date().toISOString(),
      modifiedBy: 'teacher1'
    },
    metadata: {
      subject: 'Science',
      grade: 'Middle School',
      semester: 'Fall Semester'
    }
  }
]

export const useCourses = (userId?: string, userRole?: string) => {
  const [courses, setCourses] = useState<CourseDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 模擬API調用
    const loadCourses = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (userRole === 'teacher') {
        // 教師看到自己創建的所有課程
        setCourses(MOCK_COURSES.filter(course => course.teacherId === userId))
      } else if (userRole === 'student') {
        // 學生看到自己註冊的課程
        setCourses(MOCK_COURSES.filter(course => 
          course.studentIds.includes(userId || '') && course.isActive
        ))
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
    // 模擬API調用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course._id === courseId 
          ? { ...course, content, updatedAt: new Date().toISOString() }
          : course
      )
    )
    
    return true
  }

  const addVideo = async (courseId: string, video: Omit<VideoItem, 'id'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300))
    
    const newVideo: VideoItem = {
      ...video,
      id: `video_${Date.now()}`
    }
    
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course._id === courseId 
          ? {
              ...course,
              content: {
                ...course.content,
                videos: [...course.content.videos, newVideo].sort((a, b) => a.order - b.order)
              },
              updatedAt: new Date().toISOString()
            }
          : course
      )
    )
    
    return true
  }

  const addReading = async (courseId: string, reading: Omit<ReadingItem, 'id'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300))
    
    const newReading: ReadingItem = {
      ...reading,
      id: `reading_${Date.now()}`
    }
    
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course._id === courseId 
          ? {
              ...course,
              content: {
                ...course.content,
                readings: [...course.content.readings, newReading].sort((a, b) => a.order - b.order)
              },
              updatedAt: new Date().toISOString()
            }
          : course
      )
    )
    
    return true
  }

  return {
    courses,
    isLoading,
    getCourseById,
    updateCourseContent,
    addVideo,
    addReading
  }
}
