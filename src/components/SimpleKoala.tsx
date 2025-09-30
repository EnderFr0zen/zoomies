import React from 'react'
import Lottie from 'lottie-react'
import koalaNormal from '../assets/animations/koala-normal.json'
import './KoalaPet.css'

const SimpleKoala: React.FC = () => {

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
        
      </div>
    </div>
  )
}

export default SimpleKoala
