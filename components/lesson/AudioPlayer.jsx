// Enhanced AudioPlayer.jsx
'use client';
import { useState } from 'react';

export default function AudioPlayer({ audioPath }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    const audio = new Audio(audioPath);
    setIsPlaying(true);
    audio.play();
    audio.onended = () => setIsPlaying(false);
  };

  return (
    <button 
      onClick={handlePlay}
      disabled={isPlaying}
      aria-label={isPlaying ? "Playing audio" : "Play audio"}
    >
      {isPlaying ? '⏸' : '🔊'}
    </button>
  );
}