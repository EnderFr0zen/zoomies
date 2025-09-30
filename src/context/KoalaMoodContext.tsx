import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type KoalaAttentionState = 'focused' | 'distracted'

interface KoalaMoodContextValue {
  attentionState: KoalaAttentionState
  setAttentionState: (state: KoalaAttentionState) => void
}

const KoalaMoodContext = createContext<KoalaMoodContextValue | undefined>(undefined)

interface KoalaMoodProviderProps {
  children: ReactNode
}

export const KoalaMoodProvider = ({ children }: KoalaMoodProviderProps) => {
  const [attentionState, setAttentionStateInternal] = useState<KoalaAttentionState>('focused')

  const setAttentionState = useCallback((state: KoalaAttentionState) => {
    setAttentionStateInternal(prev => (prev === state ? prev : state))
  }, [])

  return (
    <KoalaMoodContext.Provider value={{ attentionState, setAttentionState }}>
      {children}
    </KoalaMoodContext.Provider>
  )
}

export const useKoalaMood = (): KoalaMoodContextValue => {
  const context = useContext(KoalaMoodContext)
  if (!context) {
    throw new Error('useKoalaMood must be used within a KoalaMoodProvider')
  }
  return context
}