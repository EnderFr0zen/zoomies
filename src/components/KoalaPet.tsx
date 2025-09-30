import React, { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import './KoalaPet.css'
import { useKoalaState } from '../hooks/useKoalaState'
import { useAudio } from '../hooks/useAudio'
import { useDrag } from '../hooks/useDrag'
import { useAttentionDetection } from '../hooks/useAttentionDetection'

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
  const { dragRef, dragState, handleMouseDown, handleTouchStart } = useDrag({
    x: window.innerWidth - 150,
    y: window.innerHeight - 150
  })

  const [showBubble, setShowBubble] = useState(false)
  const [bubbleText, setBubbleText] = useState('Hi Andy!')

  // Set up attention detection
  const { handleComputerVisionEvent } = useAttentionDetection(handleEvent)

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

  // Handle state changes and play sounds
  useEffect(() => {
    if (state.currentState === 'NUDGE_1') {
      if (!state.isMuted) {
        playNudge1()
      }
      setBubbleText('Hey! Let\'s get back to learning! 🎯')
      setShowBubble(true)
      setTimeout(() => setShowBubble(false), 2000)
    } else if (state.currentState === 'NUDGE_2') {
      if (!state.isMuted) {
        playNudge2()
      }
      setBubbleText('I need your attention! Look at me! 👀')
      setShowBubble(true)
      setTimeout(() => setShowBubble(false), 3000)
    } else if (state.currentState === 'HAPPY') {
      setBubbleText('Awesome! You\'re doing great! 🌟')
      setShowBubble(true)
      setTimeout(() => setShowBubble(false), 2000)
    }
  }, [state.currentState, state.isMuted, playNudge1, playNudge2])

  const getAnimationData = () => {
    console.log('KoalaPet: Getting animation data, state:', state.currentState)
    
    let selectedAnimation
    switch (state.currentState) {
      case 'NUDGE_1':
        // Gentle attention-grabbing when distracted - use tired or sad
        const gentleAnimations = [koalaTired, koalaSad]
        selectedAnimation = gentleAnimations[Math.floor(Math.random() * gentleAnimations.length)]
        break
      case 'NUDGE_2':
        // Stronger attention-grabbing when very distracted - use angry or crying
        const strongAnimations = [koalaAngry, koalaCrying]
        selectedAnimation = strongAnimations[Math.floor(Math.random() * strongAnimations.length)]
        break
      case 'HAPPY':
        // Celebration when refocused - use happy, laughing, or love
        const happyAnimations = [koalaHappy, koalaLaughing, koalaLove, koalaKissing]
        selectedAnimation = happyAnimations[Math.floor(Math.random() * happyAnimations.length)]
        break
      default:
        // Calm idle state when focused - use normal or eats leaves
        const idleAnimations = [koalaNormal, koalaEatsLeaves]
        selectedAnimation = idleAnimations[Math.floor(Math.random() * idleAnimations.length)]
    }
    
    console.log('KoalaPet: Selected animation:', selectedAnimation)
    return selectedAnimation
  }

  const getAnimationLoop = () => {
    return state.currentState === 'IDLE'
  }

  console.log('KoalaPet: Rendering component, position:', dragState.position)
  
  return (
    <button 
      className="koala-pet"
      ref={dragRef}
      type="button"
      style={{
        position: 'fixed',
        left: dragState.position.x,
        top: dragState.position.y,
        zIndex: 1000,
        cursor: dragState.isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        background: 'none',
        border: 'none',
        padding: 0
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // Toggle mute on keyboard interaction
          toggleMute()
        }
      }}
    >
      <div className="koala-container">
        <div className="koala-animation">
          <Lottie
            animationData={getAnimationData()}
            loop={getAnimationLoop()}
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
    </button>
  )
}

export default KoalaPet

