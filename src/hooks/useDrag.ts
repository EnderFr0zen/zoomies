import { useState, useCallback, useRef, useEffect } from 'react'

export interface DragState {
  isDragging: boolean
  position: { x: number; y: number }
  startPosition: { x: number; y: number }
}

export const useDrag = (initialPosition: { x: number; y: number }) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    position: initialPosition,
    startPosition: { x: 0, y: 0 }
  })

  const dragRef = useRef<HTMLButtonElement>(null)
  const lastPositionRef = useRef(initialPosition)

  // Load saved position from localStorage, but ensure it's in bottom-right area
  useEffect(() => {
    const savedPosition = localStorage.getItem('koala-position')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        // Ensure position is in bottom-right area
        const constrainedPosition = constrainToViewport(
          parsed.x, 
          parsed.y, 
          150, // koala width
          150  // koala height
        )
        setDragState(prev => ({
          ...prev,
          position: constrainedPosition
        }))
        lastPositionRef.current = constrainedPosition
      } catch (error) {
        console.warn('Failed to parse saved koala position:', error)
        // Reset to bottom-right if parsing fails
        const bottomRightPosition = {
          x: window.innerWidth - 150,
          y: window.innerHeight - 150
        }
        setDragState(prev => ({
          ...prev,
          position: bottomRightPosition
        }))
        lastPositionRef.current = bottomRightPosition
      }
    } else {
      // No saved position, use bottom-right
      const bottomRightPosition = {
        x: window.innerWidth - 150,
        y: window.innerHeight - 150
      }
      setDragState(prev => ({
        ...prev,
        position: bottomRightPosition
      }))
      lastPositionRef.current = bottomRightPosition
    }
  }, [])

  const savePosition = useCallback((position: { x: number; y: number }) => {
    localStorage.setItem('koala-position', JSON.stringify(position))
  }, [])

  const constrainToViewport = useCallback((x: number, y: number, elementWidth: number, elementHeight: number) => {
    const margin = 20
    const maxX = window.innerWidth - elementWidth - margin
    const maxY = window.innerHeight - elementHeight - margin
    
    return {
      x: Math.max(margin, Math.min(maxX, x)),
      y: Math.max(margin, Math.min(maxY, y))
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = dragRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startPosition: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }))
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragRef.current) return

    const rect = dragRef.current.getBoundingClientRect()
    const newX = e.clientX - dragState.startPosition.x
    const newY = e.clientY - dragState.startPosition.y
    
    const constrained = constrainToViewport(newX, newY, rect.width, rect.height)
    
    setDragState(prev => ({
      ...prev,
      position: constrained
    }))
  }, [dragState.isDragging, dragState.startPosition.x, dragState.startPosition.y, constrainToViewport])

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging) return

    setDragState(prev => ({
      ...prev,
      isDragging: false
    }))

    // Save position
    savePosition(dragState.position)
    lastPositionRef.current = dragState.position

    // Auto-snap back to bottom-right corner after 10 seconds
    setTimeout(() => {
      const bottomRightPosition = {
        x: window.innerWidth - 150,
        y: window.innerHeight - 150
      }
      setDragState(prev => ({
        ...prev,
        position: bottomRightPosition
      }))
      savePosition(bottomRightPosition)
    }, 10000)
  }, [dragState.isDragging, dragState.position, savePosition])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const rect = dragRef.current?.getBoundingClientRect()
    if (!rect) return

    const touch = e.touches[0]
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startPosition: {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }))
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.isDragging || !dragRef.current) return

    e.preventDefault()
    const touch = e.touches[0]
    const rect = dragRef.current.getBoundingClientRect()
    const newX = touch.clientX - dragState.startPosition.x
    const newY = touch.clientY - dragState.startPosition.y
    
    const constrained = constrainToViewport(newX, newY, rect.width, rect.height)
    
    setDragState(prev => ({
      ...prev,
      position: constrained
    }))
  }, [dragState.isDragging, dragState.startPosition.x, dragState.startPosition.y, constrainToViewport])

  const handleTouchEnd = useCallback(() => {
    if (!dragState.isDragging) return

    setDragState(prev => ({
      ...prev,
      isDragging: false
    }))

    savePosition(dragState.position)
    lastPositionRef.current = dragState.position
  }, [dragState.isDragging, dragState.position, savePosition])

  // Add event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return {
    dragRef,
    dragState,
    handleMouseDown,
    handleTouchStart
  }
}
