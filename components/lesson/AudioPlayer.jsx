// components/lesson/AudioPlayer.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './AudioPlayer.module.css';

export default function AudioPlayer({ 
  audioPath, 
  lessonId, 
  sectionName,
  userId = null,
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
  const [audioSource, setAudioSource] = useState('none'); // Track which source we're using

  // Load audio URL with proper fallback chain
  useEffect(() => {
    loadAudioUrl();
  }, [audioPath, lessonId, sectionName, userId]);

  const checkForPersonalizedAudio = async (userId, lessonId, sectionName, audioPath) => {
    try {
      console.log('🔍 Checking for personalized audio:', { userId, lessonId, sectionName, audioPath });
      
      // Method 1: Check database for completed TTS requests
      const { data: ttsRequest, error } = await supabase
        .from('tts_requests')
        .select('audio_url, audio_filename, section_name')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .eq('audio_filename', audioPath) // Match the exact filename
        .eq('status', 'completed')
        .single();
        
      if (!error && ttsRequest?.audio_url) {
        console.log('✅ Found personalized audio in database:', ttsRequest.audio_url);
        
        // Test if URL is accessible
        try {
          const response = await fetch(ttsRequest.audio_url, { method: 'HEAD' });
          if (response.ok) {
            return { url: ttsRequest.audio_url, source: 'database' };
          } else {
            console.log('⚠️ Database URL not accessible:', response.status);
          }
        } catch (fetchError) {
          console.log('⚠️ Database URL fetch failed:', fetchError.message);
        }
      } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.log('⚠️ Database query error:', error.message);
      } else {
        console.log('ℹ️ No completed TTS request found in database');
      }
      
      // Method 2: Try constructed path (fallback)
      const paddedLessonId = lessonId.toString().padStart(3, '0');
      const constructedPath = `personalized/${userId}/lesson-${paddedLessonId}-${audioPath}`;
      console.log('🔍 Trying constructed path:', constructedPath);
      
      const { data } = supabase.storage.from('audio').getPublicUrl(constructedPath);
      
      try {
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ Found personalized audio at constructed path:', data.publicUrl);
          return { url: data.publicUrl, source: 'constructed' };
        } else {
          console.log('⚠️ Constructed path not accessible:', response.status);
        }
      } catch (fetchError) {
        console.log('⚠️ Constructed path fetch failed:', fetchError.message);
      }
      
      console.log('❌ No personalized audio found');
      return null;
    } catch (error) {
      console.error('❌ Error checking personalized audio:', error);
      return null;
    }
  };

  const loadAudioUrl = async () => {
    setIsLoading(true);
    setAudioError(false);
    setAudioSource('none');

    try {
      console.log('🎵 Loading audio for:', { audioPath, lessonId, sectionName, userId });

      // Step 1: Check for personalized TTS audio (highest priority)
      if (userId) {
        const personalizedResult = await checkForPersonalizedAudio(userId, lessonId, sectionName, audioPath);
        if (personalizedResult) {
          setAudioUrl(personalizedResult.url);
          setAudioSource(`personalized-${personalizedResult.source}`);
          setIsLoading(false);
          console.log(`✅ Using personalized audio (${personalizedResult.source}):`, personalizedResult.url);
          return;
        }
      }

      // Step 2: Check for static audio in Supabase Storage
      const paddedLessonId = lessonId.toString().padStart(3, '0');
      const staticPath = `static/en-es/lesson-${paddedLessonId}/${audioPath}`;
      console.log('🔍 Checking static path:', staticPath);
      
      const { data: staticData } = supabase.storage.from('audio').getPublicUrl(staticPath);

      try {
        const staticResponse = await fetch(staticData.publicUrl, { method: 'HEAD' });
        if (staticResponse.ok) {
          setAudioUrl(staticData.publicUrl);
          setAudioSource('static-supabase');
          setIsLoading(false);
          console.log('✅ Using static Supabase audio:', staticData.publicUrl);
          return;
        } else {
          console.log('⚠️ Static Supabase audio not found:', staticResponse.status);
        }
      } catch (fetchError) {
        console.log('⚠️ Static Supabase fetch failed:', fetchError.message);
      }

      // Step 3: Fallback to local files (development only)
      const localPath = `/audio/en-es/lesson-${paddedLessonId}/${audioPath}`;
      console.log('🔍 Checking local path:', localPath);
      
      try {
        const localResponse = await fetch(localPath, { method: 'HEAD' });
        if (localResponse.ok) {
          setAudioUrl(localPath);
          setAudioSource('local');
          setIsLoading(false);
          console.log('✅ Using local audio:', localPath);
          return;
        } else {
          console.log('⚠️ Local audio not found:', localResponse.status);
        }
      } catch (fetchError) {
        console.log('⚠️ Local audio fetch failed:', fetchError.message);
      }

      // Step 4: Web Speech API fallback (if enabled)
      if (fallbackToTTS) {
        setAudioUrl(null); // Will trigger TTS
        setAudioSource('tts-fallback');
        setIsLoading(false);
        console.log('⚠️ Using TTS fallback');
        return;
      }

      // No audio found anywhere
      console.error('❌ No audio found for:', { audioPath, lessonId, sectionName });
      setAudioError(true);
      setAudioSource('error');

    } catch (error) {
      console.error('❌ Error loading audio:', error);
      setAudioError(true);
      setAudioSource('error');
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

  // Get audio source display for debugging
  const getSourceDisplay = () => {
    switch (audioSource) {
      case 'personalized-database': return '🎙️ Personalized (DB)';
      case 'personalized-constructed': return '🎙️ Personalized (Path)';
      case 'static-supabase': return '📁 Static (Supabase)';
      case 'local': return '💻 Local (Dev)';
      case 'tts-fallback': return '🤖 TTS Fallback';
      case 'error': return '❌ Error';
      default: return '⏳ Loading...';
    }
  };

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
      
      {/* Audio Source Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          Source: {getSourceDisplay()}
        </div>
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