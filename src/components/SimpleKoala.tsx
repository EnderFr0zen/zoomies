import React, { useState } from 'react'
import Lottie from 'lottie-react'
import koalaNormal from '../assets/animations/koala-normal.json'
import './KoalaPet.css'

const SimpleKoala: React.FC = () => {
  const [clickCount, setClickCount] = useState(0)

  const handleClick = () => {
    console.log('Koala clicked!')
    setClickCount(prev => prev + 1)
  }

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
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      <div className="koala-container">
        <div className="koala-animation">
          <Lottie
            animationData={koalaNormal}
            loop={true}
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
        
        <div className="koala-bubble">
          <span className="bubble-text">Test Koala - Clicked {clickCount} times! 🐨</span>
        </div>
      </div>
    </div>
  )
}

export default SimpleKoala
