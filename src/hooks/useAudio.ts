import { useRef, useCallback } from 'react'

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }, [])

  const playTone = useCallback(async (frequency: number, duration: number, volume: number = 0.3) => {
    try {
      await initAudio()
      
      if (!audioContextRef.current || !gainNodeRef.current) return

      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(gainNodeRef.current)
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration)
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }, [initAudio])

  const playNudge1 = useCallback(async () => {
    await playTone(800, 0.3, 0.2) // Gentle chime
  }, [playTone])

  const playNudge2 = useCallback(async () => {
    await playTone(600, 0.2, 0.3) // Slightly more urgent
    setTimeout(() => playTone(800, 0.3, 0.2), 100) // Double chime
  }, [playTone])

  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.max(0, Math.min(1, volume))
    }
  }, [])

  return {
    playNudge1,
    playNudge2,
    setVolume,
    initAudio
  }
}
