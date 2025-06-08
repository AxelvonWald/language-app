// components/lesson/AudioPlayer.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './AudioPlayer.module.css';

export default function AudioPlayer({ 
  audioPath, 
  lessonId, 
  sectionName,
  userId = null, // For personalized audio later
  fallbackToTTS = false 
}) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioError, setAudioError] = useState(false);

  // Load audio URL (Supabase Storage or fallback)
  useEffect(() => {
    loadAudioUrl();
  }, [audioPath, lessonId, sectionName, userId]);

  const loadAudioUrl = async () => {
    setIsLoading(true);
    setAudioError(false);

    try {
      // Option 1: Check for personalized audio (when userId is provided)
      if (userId) {
        const personalizedPath = `personalized/user-${userId}-lesson-${lessonId}-${sectionName}.mp3`;
        const { data: personalizedData } = supabase.storage
          .from('audio')
          .getPublicUrl(personalizedPath);
        
        // Test if personalized audio exists
        const response = await fetch(personalizedData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          setAudioUrl(personalizedData.publicUrl);
          return;
        }
      }

      // Option 2: Check for lesson audio in Supabase Storage
      const lessonPath = `en-es/lesson-${lessonId.toString().padStart(3, '0')}/${audioPath}`;
      const { data: lessonData } = supabase.storage
        .from('audio')
        .getPublicUrl(lessonPath);

      // Test if lesson audio exists in Supabase
      const response = await fetch(lessonData.publicUrl, { method: 'HEAD' });
      if (response.ok) {
        setAudioUrl(lessonData.publicUrl);
        return;
      }

      // Option 3: Fallback to local public files (for development)
      const localPath = `/audio/en-es/lesson-${lessonId.toString().padStart(3, '0')}/${audioPath}`;
      const localResponse = await fetch(localPath, { method: 'HEAD' });
      if (localResponse.ok) {
        setAudioUrl(localPath);
        return;
      }

      // Option 4: Web Speech API fallback (if enabled)
      if (fallbackToTTS) {
        setAudioUrl(null); // Will trigger TTS
        return;
      }

      // No audio found
      setAudioError(true);
      console.error('No audio found for:', { audioPath, lessonId, sectionName });

    } catch (error) {
      console.error('Error loading audio:', error);
      setAudioError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // TTS Fallback function
  const playWithTTS = async (text) => {
    if (!text || !window.speechSynthesis) {
      setAudioError(true);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES'; // Spanish
      utterance.rate = playbackRate;
      utterance.volume = volume;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setAudioError(true);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS Error:', error);
      setAudioError(true);
    }
  };

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

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

    const handleError = () => {
      setAudioError(true);
      setIsLoading(false);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
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
    if (audioError) return;

    // Handle TTS fallback
    if (!audioUrl && fallbackToTTS) {
      // You'll need to pass the sentence text as a prop for this to work
      // playWithTTS(sentenceText);
      return;
    }

    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

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
    if (!audio || !audioUrl) return;
    
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
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
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

  // Error state
  if (audioError) {
    return (
      <div className={styles.audioPlayer}>
        <div className={styles.errorState}>
          <span style={{fontSize: '16px'}}>🔇</span>
          <span>Audio not available</span>
          <button 
            onClick={loadAudioUrl}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.audioPlayer}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      )}
      
      {/* Main Controls */}
      <div className={styles.mainControls}>
        <button
          onClick={togglePlayPause}
          disabled={isLoading || audioError}
          className={styles.playButton}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className={styles.spinner} />
          ) : isPlaying ? (
            <span style={{fontSize: '18px'}}>⏸</span>
          ) : (
            <span style={{fontSize: '18px'}}>▶</span>
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
              <span style={{fontSize: '16px'}}>🔇</span>
            ) : (
              <span style={{fontSize: '16px'}}>🔊</span>
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
          disabled={!audioUrl}
        >
          <span style={{fontSize: '16px'}}>💾</span>
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