import { useEffect, useMemo, useRef, useState } from 'react'
import Lottie from 'lottie-react'
import koalaNormal from '../assets/animations/koala-normal.json'
import koalaAngry from '../assets/animations/koala-angry.json'
import koalaCrying from '../assets/animations/koala-crying.json'
import koalaSad from '../assets/animations/koala-sad.json'
import koalaTired from '../assets/animations/koala-tired.json'
import koalaHappy from '../assets/animations/koala-happy.json'
import koalaLaughing from '../assets/animations/koala-laughing.json'
import koalaLove from '../assets/animations/koala-love.json'
import koalaKissing from '../assets/animations/koala-kissing.json'
import koalaEatsLeaves from '../assets/animations/koala-eats-leaves.json'
import { useKoalaMood } from '../context/KoalaMoodContext'
import './KoalaPet.css'

type AnimationData = Record<string, unknown>

const SimpleKoala = () => {
  const { attentionState } = useKoalaMood()

  const positiveAnimations = useMemo<AnimationData[]>(() => [
    koalaHappy as AnimationData,
    koalaLaughing as AnimationData,
    koalaLove as AnimationData,
    koalaKissing as AnimationData,
    koalaEatsLeaves as AnimationData
  ], [])

  const negativeAnimations = useMemo<AnimationData[]>(() => [
    koalaAngry as AnimationData,
    koalaSad as AnimationData,
    koalaCrying as AnimationData,
    koalaTired as AnimationData
  ], [])

  const [currentAnimation, setCurrentAnimation] = useState<AnimationData>(koalaNormal as AnimationData)
  const [animationKey, setAnimationKey] = useState(0)
  const [loop, setLoop] = useState(true)

  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const lastStateRef = useRef<'focused' | 'distracted' | null>(null)

  const clearTimers = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [])

  useEffect(() => {
    const previousState = lastStateRef.current
    if (previousState === attentionState) {
      return
    }
    lastStateRef.current = attentionState

    if (attentionState === 'distracted') {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      let index = Math.floor(Math.random() * negativeAnimations.length)
      setCurrentAnimation(negativeAnimations[index])
      setLoop(true)
      setAnimationKey(key => key + 1)

      intervalRef.current = window.setInterval(() => {
        index = (index + 1) % negativeAnimations.length
        setCurrentAnimation(negativeAnimations[index])
        setLoop(true)
        setAnimationKey(key => key + 1)
      }, 4000)

      return
    }

    // attentionState === 'focused'
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (previousState === 'distracted') {
      const positive = positiveAnimations[Math.floor(Math.random() * positiveAnimations.length)]
      setCurrentAnimation(positive)
      setLoop(false)
      setAnimationKey(key => key + 1)

      timeoutRef.current = window.setTimeout(() => {
        setCurrentAnimation(koalaNormal as AnimationData)
        setLoop(true)
        setAnimationKey(key => key + 1)
        timeoutRef.current = null
      }, 3500)
    } else {
      setCurrentAnimation(koalaNormal as AnimationData)
      setLoop(true)
      setAnimationKey(key => key + 1)
    }
  }, [attentionState, negativeAnimations, positiveAnimations])

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
        padding: 0,
      }}
    >
      <div className="koala-container">
        <div className="koala-animation">
          <Lottie
            key={animationKey}
            animationData={currentAnimation}
            loop={loop}
            autoplay
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
      </div>
    </div>
  )
}

export default SimpleKoala
