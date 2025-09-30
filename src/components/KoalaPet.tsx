import React, { useEffect, useState, useMemo } from 'react'
import Lottie from 'lottie-react'
import './KoalaPet.css'
import { useKoalaState } from '../hooks/useKoalaState'
import { useAudio } from '../hooks/useAudio'
import { useAttentionDetection } from '../hooks/useAttentionDetection'
import { useScreenActivity } from '../hooks/useScreenActivity'
import { useSessionContext } from '../hooks/useSessionContext'

// Import animation data
import koalaNormal from '../assets/animations/koala-normal.json'
import koalaAngry from '../assets/animations/koala-angry.json'
import koalaCrying from '../assets/animations/koala-crying.json'
import koalaEatsLeaves from '../assets/animations/koala-eats-leaves.json'
import koalaHappy from '../assets/animations/koala-happy.json'
import koalaKissing from '../assets/animations/koala-kissing.json'
import koalaLaughing from '../assets/animations/koala-laughing.json'
import koalaLove from '../assets/animations/koala-love.json'
import koalaSad from '../assets/animations/koala-sad.json'
import koalaTired from '../assets/animations/koala-tired.json'

const KoalaPet: React.FC = () => {
  const { state, handleEvent, toggleMute } = useKoalaState()
  const { playNudge1, playNudge2, initAudio } = useAudio()

  const [showBubble, setShowBubble] = useState(false)
  const [bubbleText, setBubbleText] = useState('Hi Andy!')
  const [lastStateChange, setLastStateChange] = useState(0)
  const [selectedAnimationIndex, setSelectedAnimationIndex] = useState(0)

  // Set up session context
  const { sessionContext } = useSessionContext()

  // Set up screen activity detection
  useScreenActivity((event) => {
    console.log('Screen activity event:', event)
    
    // Handle different screen activity events
    switch (event.type) {
      case 'page_hidden':
        setBubbleText('Come back! I miss you! 😢')
        setShowBubble(true)
        setTimeout(() => setShowBubble(false), 3000)
        break
      case 'input_idle':
        if (event.data?.idleTime && event.data.idleTime > 60000) { // 1 minute
          setBubbleText('Are you still there? 🤔')
          setShowBubble(true)
          setTimeout(() => setShowBubble(false), 3000)
        }
        break
      case 'window_blur':
        setBubbleText('Focus on your studies! 📚')
        setShowBubble(true)
        setTimeout(() => setShowBubble(false), 2000)
        break
    }
  })

  // Set up attention detection
  const { handleComputerVisionEvent } = useAttentionDetection((event) => {
    // Convert AttentionEvent to KoalaEvent
    if (event.type === 'inattentive_5s' || event.type === 'inattentive_10s' || event.type === 'focused_2s') {
      handleEvent(event as any)
    }
  })

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudioOnInteraction = () => {
      initAudio()
      document.removeEventListener('click', initAudioOnInteraction)
      document.removeEventListener('touchstart', initAudioOnInteraction)
    }

    document.addEventListener('click', initAudioOnInteraction)
    document.addEventListener('touchstart', initAudioOnInteraction)

    return () => {
      document.removeEventListener('click', initAudioOnInteraction)
      document.removeEventListener('touchstart', initAudioOnInteraction)
    }
  }, [initAudio])

  // Expose computer vision event handler globally for integration
  useEffect(() => {
    (window as any).handleComputerVisionEvent = handleComputerVisionEvent
    return () => {
      delete (window as any).handleComputerVisionEvent
    }
  }, [handleComputerVisionEvent])

  // Handle state changes and play sounds with debouncing
  useEffect(() => {
    const now = Date.now()
    const timeSinceLastChange = now - lastStateChange
    
    // Debounce state changes to prevent rapid switching
    if (timeSinceLastChange < 1000) {
      return
    }
    
    setLastStateChange(now)
    
    if (state.currentState === 'NUDGE_1') {
      if (!sessionContext.muteState) {
        playNudge1()
      }
      setBubbleText(`Hey! Let's get back to ${sessionContext.subject}! 🎯`)
      setShowBubble(true)
      setTimeout(() => setShowBubble(false), 2000)
    } else if (state.currentState === 'NUDGE_2') {
      if (!sessionContext.muteState) {
        playNudge2()
      }
      setBubbleText('I need your attention! Look at me! 👀')
      setShowBubble(true)
      setTimeout(() => setShowBubble(false), 3000)
    } else if (state.currentState === 'HAPPY') {
      setBubbleText(`Awesome! You're doing great in ${sessionContext.subject}! 🌟`)
      setShowBubble(true)
      setTimeout(() => setShowBubble(false), 2000)
    }
  }, [state.currentState, sessionContext.muteState, sessionContext.subject, playNudge1, playNudge2, lastStateChange])

  // Update animation index when state changes
  useEffect(() => {
    if (state.currentState !== 'IDLE') {
      // Only change animation when state actually changes
      setSelectedAnimationIndex(prev => prev + 1)
    }
  }, [state.currentState])

  // Memoize animation data to prevent unnecessary re-renders
  const animationData = useMemo(() => {
    console.log('KoalaPet: Getting animation data, state:', state.currentState)
    
    let selectedAnimation
    switch (state.currentState) {
      case 'NUDGE_1': {
        // Gentle attention-grabbing when distracted - use tired or sad
        const gentleAnimations = [koalaTired, koalaSad]
        selectedAnimation = gentleAnimations[selectedAnimationIndex % gentleAnimations.length]
        break
      }
      case 'NUDGE_2': {
        // Stronger attention-grabbing when very distracted - use angry or crying
        const strongAnimations = [koalaAngry, koalaCrying]
        selectedAnimation = strongAnimations[selectedAnimationIndex % strongAnimations.length]
        break
      }
      case 'HAPPY': {
        // Celebration when refocused - use happy, laughing, or love
        const happyAnimations = [koalaHappy, koalaLaughing, koalaLove, koalaKissing]
        selectedAnimation = happyAnimations[selectedAnimationIndex % happyAnimations.length]
        break
      }
      default: {
        // Calm idle state when focused - use normal or eats leaves
        const idleAnimations = [koalaNormal, koalaEatsLeaves]
        selectedAnimation = idleAnimations[selectedAnimationIndex % idleAnimations.length]
        break
      }
    }

    console.log('KoalaPet: Selected animation:', selectedAnimation)
    return selectedAnimation
  }, [state.currentState, selectedAnimationIndex])

  // Memoize animation loop setting
  const shouldLoop = useMemo(() => {
    return state.currentState === 'IDLE'
  }, [state.currentState])

  console.log('KoalaPet: Rendering component')
  
  return (
    <div 
      className="koala-pet"
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 1000,
        userSelect: 'none',
        background: 'none',
        border: 'none',
        padding: 0
      }}
    >
      <div className="koala-container">
        <div className="koala-animation">
          <Lottie
            animationData={animationData}
            loop={shouldLoop}
            autoplay={true}
            style={{ 
              width: 150, 
              height: 150,
              display: 'block'
            }}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet'
            }}
          />
        </div>
        
        {showBubble && (
          <div className="koala-bubble">
            <span className="bubble-text">{bubbleText}</span>
          </div>
        )}
        
        <div className="koala-controls">
          <button 
            className="mute-btn"
            onClick={(e) => {
              e.stopPropagation()
              toggleMute()
            }}
            title={state.isMuted ? 'Unmute' : 'Mute'}
          >
            {state.isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default KoalaPet

