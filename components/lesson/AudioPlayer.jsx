// components/lesson/AudioPlayer.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './AudioPlayer.module.css';

export default function AudioPlayer({ audioPath }) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [audioPath]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return; // Don't interfere with form inputs
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentTime]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const seek = (time) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const clampedTime = Math.max(0, Math.min(duration, time));
    audio.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleVolumeChange = (newVolume) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setVolume(newVolume);
    audio.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      setIsMuted(false);
      audio.volume = volume;
    } else {
      setIsMuted(true);
      audio.volume = 0;
    }
  };

  const changePlaybackRate = (rate) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setPlaybackRate(rate);
    audio.playbackRate = rate;
  };

  const downloadAudio = () => {
    const link = document.createElement('a');
    link.href = audioPath;
    link.download = audioPath.split('/').pop() || 'audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.audioPlayer}>
      <audio
        ref={audioRef}
        src={audioPath}
        preload="metadata"
      />
      
      {/* Main Controls */}
      <div className={styles.mainControls}>
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={styles.playButton}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className={styles.spinner} />
          ) : isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <div className={styles.timeDisplay}>
          {formatTime(currentTime)}
        </div>

        <div
          ref={progressRef}
          className={styles.progressContainer}
          onClick={handleProgressClick}
        >
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className={styles.timeDisplay}>
          {formatTime(duration)}
        </div>
      </div>

      {/* Secondary Controls */}
      <div className={styles.secondaryControls}>
        {/* Speed Control */}
        <div className={styles.speedControl}>
          <span className={styles.controlLabel}>Speed:</span>
          <div className={styles.speedButtons}>
            {[0.5, 1, 1.5, 2].map(rate => (
              <button
                key={rate}
                onClick={() => changePlaybackRate(rate)}
                className={`${styles.speedButton} ${playbackRate === rate ? styles.active : ''}`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume Control */}
        <div className={styles.volumeControl}>
          <button
            onClick={toggleMute}
            className={styles.volumeButton}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className={styles.volumeSlider}
          />
        </div>

        {/* Download Button */}
        <button
          onClick={downloadAudio}
          className={styles.downloadButton}
          aria-label="Download audio"
          title="Download audio file"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className={styles.shortcutsInfo}>
        <small>
          Shortcuts: Space (play/pause) • ← → (±10s) • ↑ ↓ (volume)
        </small>
      </div>
    </div>
  );
}