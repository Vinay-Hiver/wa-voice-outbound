import React, { useState, useRef, useEffect } from 'react';
import './VoicePlayer.css';

// Icons
import playIcon from '../../assets/icons/voice-inbox/play-circle.svg'; // Reuse or add pause icon if available
import pauseIconAsset from '../../assets/icons/call-strip/pause.svg';
import volumeIcon from '../../assets/icons/voice-inbox/volume.svg';
import phoneIconWhite from '../../assets/icons/voice-inbox/phone-icon-white.svg';

const VoicePlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for CSS styling
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="call-player-bar-ended">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      <button className="ended-play-btn" onClick={togglePlay}>
        {isPlaying ? (
          <img src={pauseIconAsset} alt="Pause" width="16" height="16" />
        ) : (
          <img src={playIcon} alt="Play" width="16" height="16" />
        )}
      </button>

      <div className="ended-timeline">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="timeline-slider"
          style={{ '--progress': `${progressPercent}%` }}
        />
      </div>

      <span className="ended-time-text">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <div className="ended-actions">
        <button className="ended-action-btn">
          <img src={volumeIcon} alt="Volume" width="16" height="16" />
        </button>
        <button className="ended-action-btn blue-bg">
          <img src={phoneIconWhite} alt="Call" width="16" height="16" />
        </button>
      </div>
    </div>
  );
};

export default VoicePlayer;
