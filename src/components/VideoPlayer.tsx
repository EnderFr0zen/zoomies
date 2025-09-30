import React, { useState } from 'react'
import type { VideoItem } from '../database/types'
import './VideoPlayer.css'

interface VideoPlayerProps {
  video: VideoItem
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false)

  const getYouTubeEmbedUrl = (url: string): string => {
    // Extract YouTube video ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = (match && match[2].length === 11) ? match[2] : null
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
    
    return url
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleClose = () => {
    setIsPlaying(false)
  }

  if (video.type === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(video.url)
    
    return (
      <div className="video-player">
        {!isPlaying ? (
          <div 
            className="video-thumbnail" 
            onClick={handlePlay}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handlePlay()
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="play-button">
              <div className="play-icon">▶</div>
            </div>
            <div className="video-overlay">
              <h3>{video.title}</h3>
              <p>Click to play</p>
            </div>
          </div>
        ) : (
          <div className="video-embed-container">
            <div className="video-controls">
              <button onClick={handleClose} className="close-button">
                ✕
              </button>
            </div>
            <iframe
              src={embedUrl}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="video-iframe"
            />
          </div>
        )}
      </div>
    )
  }

  // Handle other types of videos
  return (
    <div className="video-player">
      <div className="video-placeholder">
        <div className="video-icon">🎥</div>
        <h3>{video.title}</h3>
        <p>Video File</p>
        <a 
          href={video.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="video-link"
        >
          Download Video
        </a>
      </div>
    </div>
  )
}

export default VideoPlayer
