import React from 'react'
import './KoalaPet.css'

const KoalaPet: React.FC = () => {
  return (
    <div className="koala-pet">
      <div className="koala-container">
        <div className="koala">🐨</div>
        <div className="koala-bubble">
          <span className="bubble-text">Hi Andy!</span>
        </div>
      </div>
    </div>
  )
}

export default KoalaPet
