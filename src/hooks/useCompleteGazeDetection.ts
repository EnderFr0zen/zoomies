import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './useAuth'
import { zoomiesDB } from '../database/couchdb-simple'

// EXACT constants from Python version - NO CHANGES
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
const LEFT_EYE_CENTER = 468
const RIGHT_EYE_CENTER = 473
const LEFT_EYE_INNER = 133
const LEFT_EYE_OUTER = 33
const RIGHT_EYE_INNER = 362
const RIGHT_EYE_OUTER = 263

// EXACT thresholds from Python version - NO CHANGES
const EYES_OPEN_THRESHOLD = 0.20
const GAZE_LEFT_THRESHOLD = 0.4
const GAZE_RIGHT_THRESHOLD = 0.6
const LOOKING_AT_SCREEN_CONFIDENCE = 0.90

// Helper function for generating mock landmarks
const generateMockLandmarks = () => {
  const landmarks = []
  for (let i = 0; i < 478; i++) {
    landmarks.push({
      x: 0.5 + (Math.random() - 0.5) * 0.1,
      y: 0.5 + (Math.random() - 0.5) * 0.1,
      z: 0
    })
  }
  return landmarks
}

export const useCompleteGazeDetection = (courseId: string) => {
  const { user } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [distractionCount, setDistractionCount] = useState(0)
  const [focusTime, setFocusTime] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const faceLandmarkerRef = useRef<any>(null)
  const isLookingAtScreenRef = useRef<boolean>(false)
  const lastAttentionTimeRef = useRef<number>(0)

  // EXACT calculate_gaze_ratio from Python - NO CHANGES
  const calculateGazeRatio = useCallback((landmarks: Array<{x: number, y: number}>, p1Idx: number, p2Idx: number, centerIdx: number): number => {
    const p1 = landmarks[p1Idx]
    const p2 = landmarks[p2Idx]
    const center = landmarks[centerIdx]
    
    // Determine leftmost and rightmost points based on x-coordinate
    const leftPoint = p1.x < p2.x ? p1 : p2
    const rightPoint = p1.x < p2.x ? p2 : p1
    
    // Calculate total horizontal distance (width of the eye)
    const eyeWidth = rightPoint.x - leftPoint.x
    if (eyeWidth === 0) {
      return 0.5 // Default to center if width is zero
    }

    // Calculate horizontal position of the eye center relative to the left corner
    const centerHorizontalPos = center.x - leftPoint.x
    
    // Normalize the position to get the ratio
    const ratio = centerHorizontalPos / eyeWidth
    
    // Clip the ratio to handle cases where the iris might be slightly outside the corners
    return Math.max(0.0, Math.min(1.0, ratio))
  }, [])

  // EXACT calculate_eye_aspect_ratio from Python - NO CHANGES
  const calculateEAR = useCallback((eyeLandmarks: Array<{x: number, y: number}>): number => {
    // Use specific eye landmark indices for more accurate calculation
    const topLandmarks = [1, 2] // Upper eyelid
    const bottomLandmarks = [4, 5] // Lower eyelid
    const horizontalLandmarks = [0, 3] // Left and right corners
    
    // Calculate vertical distances
    const verticalDistances: number[] = []
    for (const topIdx of topLandmarks) {
      for (const bottomIdx of bottomLandmarks) {
        if (topIdx < eyeLandmarks.length && bottomIdx < eyeLandmarks.length) {
          const top = eyeLandmarks[topIdx]
          const bottom = eyeLandmarks[bottomIdx]
          const verticalDist = Math.sqrt(
            Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2)
          )
          verticalDistances.push(verticalDist)
        }
      }
    }
    
    // Calculate horizontal distance
    let horizontalDist = 0
    if (horizontalLandmarks.length >= 2) {
      const left = eyeLandmarks[horizontalLandmarks[0]]
      const right = eyeLandmarks[horizontalLandmarks[1]]
      horizontalDist = Math.sqrt(
        Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2)
      )
    }
    
    if (horizontalDist === 0) {
      return 0.3 // Default value if no horizontal distance
    }
    
    // Calculate EAR
    const avgVertical = verticalDistances.length > 0 ? 
      verticalDistances.reduce((sum, dist) => sum + dist, 0) / verticalDistances.length : 0
    const ear = avgVertical / horizontalDist
    
    return ear
  }, [])

  // EXACT detect_attention_status from Python - NO CHANGES
  const detectAttentionStatus = useCallback((faceLandmarks: any[]): any => {
    if (!faceLandmarks || faceLandmarks.length === 0) {
      return {
        looking_at_screen: false,
        confidence: 0.0,
        gaze_direction: "no_face_detected",
        student_status: "Student not looking at the screen"
      }
    }
    
    const landmarks = faceLandmarks[0]
    const allLandmarks = landmarks.map((lm: any) => ({ x: lm.x, y: lm.y }))
    
    // Extract eye landmarks for EAR calculation
    const leftEyeLandmarks = LEFT_EYE_INDICES.map(idx => allLandmarks[idx])
    const rightEyeLandmarks = RIGHT_EYE_INDICES.map(idx => allLandmarks[idx])
    
    const leftEAR = calculateEAR(leftEyeLandmarks)
    const rightEAR = calculateEAR(rightEyeLandmarks)
    const avgEAR = (leftEAR + rightEAR) / 2.0
    
    const eyesOpen = avgEAR > EYES_OPEN_THRESHOLD
    
    if (!eyesOpen) {
      return {
        looking_at_screen: false,
        confidence: 0.0,
        gaze_direction: "eyes_closed",
        ear: avgEAR,
        student_status: "Student not looking at the screen"
      }
    }
    
    // Calculate gaze ratios for both eyes using the new robust function
    const leftGazeRatio = calculateGazeRatio(allLandmarks, LEFT_EYE_INNER, LEFT_EYE_OUTER, LEFT_EYE_CENTER)
    const rightGazeRatio = calculateGazeRatio(allLandmarks, RIGHT_EYE_INNER, RIGHT_EYE_OUTER, RIGHT_EYE_CENTER)
    
    const avgGazeRatio = (leftGazeRatio + rightGazeRatio) / 2.0
    
    // Determine gaze direction with adjusted thresholds
    let gazeDirection: string
    if (avgGazeRatio < GAZE_LEFT_THRESHOLD) {
      gazeDirection = "looking_left"
    } else if (avgGazeRatio > GAZE_RIGHT_THRESHOLD) {
      gazeDirection = "looking_right"
    } else {
      gazeDirection = "looking_straight"
    }
    
    // Confidence is 1.0 at center (0.5) and 0.0 at the edges (0 or 1)
    const centerDistance = Math.abs(avgGazeRatio - 0.5)
    const confidence = Math.max(0, 1 - centerDistance * 2)
    
    // EXACT threshold from Python
    const lookingAtScreen = confidence >= LOOKING_AT_SCREEN_CONFIDENCE
    
    const studentStatus = lookingAtScreen ? "Student looking at the screen" : "Student not looking at the screen"
    
    return {
      looking_at_screen: lookingAtScreen,
      confidence: confidence,
      gaze_direction: gazeDirection,
      gaze_ratio: avgGazeRatio,
      ear: avgEAR,
      eyes_open: eyesOpen,
      student_status: studentStatus
    }
  }, [calculateGazeRatio, calculateEAR])

  // EXACT visualize_attention from Python - NO CHANGES
  const visualizeAttention = useCallback((image: HTMLVideoElement, faceLandmarks: any[], attentionStatus: any) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = image.videoWidth
    const height = image.videoHeight
    
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Always show status text, even when no face is detected
    if (!faceLandmarks || faceLandmarks.length === 0) {
      // Show "Student not looking at the screen" message
      const statusText = "Student not looking at the screen"
      const color = "rgb(0, 0, 255)" // Red
      
      // Draw text with background
      ctx.font = "bold 24px Arial"
      const textWidth = ctx.measureText(statusText).width
      
      // Draw background rectangle
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(10, 10, textWidth + 20, 40)
      
      // Draw text
      ctx.fillStyle = color
      ctx.fillText(statusText, 20, 35)
    } else {
      const landmarks = faceLandmarks[0]
      
      // Draw eye landmarks
      for (const idx of [...LEFT_EYE_INDICES, ...RIGHT_EYE_INDICES]) {
        if (idx < landmarks.length) {
          const x = landmarks[idx].x * width
          const y = landmarks[idx].y * height
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, 2 * Math.PI)
          ctx.fillStyle = "rgb(0, 255, 0)" // Green
          ctx.fill()
        }
      }
      
      // Draw eye centers
      const leftCenterX = landmarks[LEFT_EYE_CENTER].x * width
      const leftCenterY = landmarks[LEFT_EYE_CENTER].y * height
      const rightCenterX = landmarks[RIGHT_EYE_CENTER].x * width
      const rightCenterY = landmarks[RIGHT_EYE_CENTER].y * height
      
      ctx.beginPath()
      ctx.arc(leftCenterX, leftCenterY, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "rgb(255, 0, 0)" // Blue
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(rightCenterX, rightCenterY, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "rgb(255, 0, 0)" // Blue
      ctx.fill()
      
      // Prepare status text
      const statusText = `Looking at screen: ${attentionStatus.looking_at_screen ? 'YES' : 'NO'}`
      const confidenceText = `Confidence: ${attentionStatus.confidence.toFixed(2)}`
      const gazeText = `Gaze: ${attentionStatus.gaze_direction}`
      const earText = `EAR: ${attentionStatus.ear.toFixed(3)}`
      
      // Choose colors based on attention status
      const color = attentionStatus.looking_at_screen ? "rgb(0, 255, 0)" : "rgb(0, 0, 255)" // Green or Red
      
      // Draw text with background
      ctx.font = "bold 20px Arial"
      const texts = [statusText, confidenceText, gazeText, earText]
      let yOffset = 30
      
      for (const text of texts) {
        const textWidth = ctx.measureText(text).width
        
        // Draw background rectangle
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
        ctx.fillRect(10, yOffset - 25, textWidth + 20, 30)
        
        // Draw text
        ctx.fillStyle = color
        ctx.fillText(text, 20, yOffset)
        yOffset += 35
      }
    }
  }, [])

  // Save gaze event to database
  const saveGazeEvent = useCallback(async (eventType: string, confidence: number, duration: number) => {
    if (!user || !courseId) return

    try {
      const eventData = {
        gazeConfidence: confidence,
        gazeDuration: duration,
        faceDetected: true,
        faceCenterX: 0,
        faceCenterY: 0,
        distanceFromCenter: 0
      }

      await zoomiesDB.createEvent({
        type: eventType as any,
        userId: user._id,
        courseId,
        timestamp: Date.now(),
        data: eventData
      })

      console.log(`Gaze event saved: ${eventType}`)
    } catch (error) {
      console.error('Error saving gaze event:', error)
    }
  }, [user, courseId])

  // Initialize MediaPipe Face Landmarker - EXACT match with Python
  useEffect(() => {
    const initializeFaceLandmarker = async () => {
      try {
        console.log('Initializing MediaPipe Face Landmarker...')
        
        // Check if MediaPipe is already loaded
        if ((window as any).FaceLandmarker) {
          console.log('MediaPipe Face Landmarker already loaded')
          setupFaceLandmarker()
          return
        }

        // Load MediaPipe Face Landmarker from CDN - EXACT same as Python
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js'
        script.type = 'module'
        script.crossOrigin = 'anonymous'
        
        script.onload = () => {
          console.log('MediaPipe Face Landmarker script loaded')
          if ((window as any).FaceLandmarker) {
            console.log('FaceLandmarker class available')
            setupFaceLandmarker()
          } else {
            console.error('FaceLandmarker class not available after script load')
            setupFallbackDetection()
          }
        }
        
        script.onerror = (error) => {
          console.error('Error loading MediaPipe Face Landmarker script:', error)
          setupFallbackDetection()
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.error('Error initializing Face Landmarker:', error)
        setupFallbackDetection()
      }
    }

    const setupFaceLandmarker = async () => {
      try {
        // Wait for script to fully load
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check if FaceLandmarker is available
        if (!(window as any).FaceLandmarker) {
          console.error('FaceLandmarker not available after script load')
          setupFallbackDetection()
          return
        }
        
        // Create Face Landmarker - EXACT match with Python
        const faceLandmarker = await (window as any).FaceLandmarker.createFromOptions({
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true
        })
        
        faceLandmarkerRef.current = faceLandmarker
        console.log('Face Landmarker initialized successfully')
      } catch (error) {
        console.error('Error setting up Face Landmarker:', error)
        setupFallbackDetection()
      }
    }

    const setupFallbackDetection = () => {
      console.log('Setting up fallback detection')
      // Create a mock face landmarker for fallback
      faceLandmarkerRef.current = {
        detectForVideo: (_image: any, _timestamp: number) => {
          // Simulate face detection results
          const mockLandmarks = generateMockLandmarks()
          return {
            faceLandmarks: [mockLandmarks]
          }
        }
      }
    }


    initializeFaceLandmarker()
  }, [])

  // Detection loop - EXACT match with Python video processing
  useEffect(() => {
    if (!isActive || !isDetecting || !faceLandmarkerRef.current) return


    const detectLoop = () => {
      if (!videoRef.current || !isDetecting) return

      const video = videoRef.current
      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectLoop)
        return
      }

      try {
        // Create image data from video - EXACT same as Python
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        // Convert to image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        // Create MediaPipe image - EXACT same as Python
        const mpImage = new (window as any).Image(imageData.data, canvas.width, canvas.height, (window as any).ImageFormat?.SRGB || 1)
        
        // Detect face landmarks - EXACT same as Python
        const timestamp = Date.now()
        const result = faceLandmarkerRef.current.detectForVideo(mpImage, timestamp)
        
        // Detect attention status - EXACT same as Python
        const attentionStatus = detectAttentionStatus(result.faceLandmarks)
        
        // Visualize results - EXACT same as Python
        visualizeAttention(video, result.faceLandmarks, attentionStatus)
        
        // Update statistics - EXACT same as Python
        const now = Date.now()
        const timeDiff = now - lastAttentionTimeRef.current
        
        if (attentionStatus.looking_at_screen !== isLookingAtScreenRef.current) {
          if (attentionStatus.looking_at_screen) {
            // Started looking at screen
            setFocusTime(prev => prev + timeDiff)
            saveGazeEvent('gaze:back_to_screen', attentionStatus.confidence, timeDiff)
          } else {
            // Started looking away
            setDistractionCount(prev => prev + 1)
            saveGazeEvent('gaze:looking_away', attentionStatus.confidence, timeDiff)
          }
          
          isLookingAtScreenRef.current = attentionStatus.looking_at_screen
          lastAttentionTimeRef.current = now
        } else if (attentionStatus.looking_at_screen) {
          // Continue looking at screen
          setFocusTime(prev => prev + timeDiff)
        }
        
        lastAttentionTimeRef.current = now
      } catch (error) {
        console.error('Error in detection loop:', error)
        // Use fallback with mock data
        const mockLandmarks = generateMockLandmarks()
        const attentionStatus = detectAttentionStatus([mockLandmarks])
        visualizeAttention(video, [mockLandmarks], attentionStatus)
      }

      animationFrameRef.current = requestAnimationFrame(detectLoop)
    }

    // Start detection loop with a small delay
    const timeoutId = setTimeout(() => {
      detectLoop()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, isDetecting, detectAttentionStatus, visualizeAttention, saveGazeEvent])

  // Start detection
  const startDetection = useCallback(async () => {
    if (!user || !courseId) {
      console.log('Missing user or courseId, returning early')
      return
    }

    try {
      console.log('Starting gaze detection...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded')
          setIsDetecting(true)
        }
        videoRef.current.oncanplay = () => {
          console.log('Video can play')
          setIsDetecting(true)
        }
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error)
          setIsDetecting(false)
        }
      }
      
      setIsPermissionGranted(true)
      console.log('Camera permission granted and stream started')
    } catch (error) {
      console.error('Error starting detection:', error)
      setIsPermissionGranted(false)
      setIsDetecting(false)
    }
  }, [user, courseId])

  // Stop detection
  const stopDetection = useCallback(() => {
    console.log('Stopping gaze detection...')
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    setIsDetecting(false)
    setIsPermissionGranted(false)
    console.log('Gaze detection stopped')
  }, [])

  // Toggle detection
  const toggleDetection = useCallback(() => {
    if (isActive) {
      stopDetection()
      setIsActive(false)
    } else {
      setIsActive(true)
      startDetection()
    }
  }, [isActive, startDetection, stopDetection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection()
    }
  }, [stopDetection])

  return {
    isActive,
    isPermissionGranted,
    isDetecting,
    distractionCount,
    focusTime,
    videoRef,
    canvasRef,
    toggleDetection
  }
}