// app/listen/page.js - Adding AudioPlayer component
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import AudioPlayer from "@/components/lesson/AudioPlayer";
import styles from "./Listen.module.css";

export default function ListenPage() {
  const router = useRouter();
  const { user, loading, isApproved, userProgress } = useProgress();
  
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);

  // Generate playlist based on completed lessons
  const generatePlaylist = useCallback(async () => {
    console.log("Starting generatePlaylist", { userProgress: userProgress?.length });
    
    if (!userProgress || userProgress.length === 0) {
      console.log("No user progress, finishing");
      setLoadingPlaylist(false);
      return;
    }

    // Only generate if we don't have a playlist yet
    if (playlist.length > 0) {
      console.log("Playlist already exists, skipping");
      setLoadingPlaylist(false);
      return;
    }

    try {
      const playlistTracks = [];
      const now = new Date();
      
      console.log("Processing all progress entries:", userProgress.length);
      
      for (const progress of userProgress) {
        const lessonId = progress.lesson_id;
        const completedAt = new Date(progress.completed_at);
        const daysSinceCompleted = Math.floor((now - completedAt) / (1000 * 60 * 60 * 24));
        
        // Simple spaced repetition: recent lessons appear more often
        let repetitions = 1;
        if (daysSinceCompleted === 0) repetitions = 3; // Today
        else if (daysSinceCompleted <= 7) repetitions = 2; // This week
        else repetitions = 1; // Older
        
        console.log(`Lesson ${lessonId}: ${daysSinceCompleted} days ago, ${repetitions} repetitions`);
        
        try {
          const paddedId = lessonId.toString().padStart(3, "0");
          const lessonModule = await import(`../../data/courses/en-es/lessons/lesson-${paddedId}.json`);
          const lesson = lessonModule.default;
          
          // Get both audio files from the lesson
          const audioFiles = [];
          if (lesson.sections.listenRead?.audio) {
            audioFiles.push({
              filename: lesson.sections.listenRead.audio,
              section: "Listen & Read"
            });
          }
          if (lesson.sections.listenRepeat?.audio) {
            audioFiles.push({
              filename: lesson.sections.listenRepeat.audio,
              section: "Listen & Repeat"
            });
          }
          
          // Add each audio file to playlist with repetitions
          audioFiles.forEach(audioFile => {
            for (let i = 0; i < repetitions; i++) {
              playlistTracks.push({
                lessonId,
                lessonTitle: lesson.title || `Lesson ${lessonId}`,
                audioPath: audioFile.filename,
                section: audioFile.section,
                daysSinceCompleted
              });
            }
          });
          
        } catch (lessonError) {
          console.log(`Could not load lesson ${lessonId}:`, lessonError);
        }
      }
      
      // Simple shuffle (deterministic based on date so it's consistent)
      const today = new Date().toDateString();
      const shuffled = playlistTracks.sort((a, b) => {
        const hashA = (a.lessonId * 9301 + today.length) % 49297;
        const hashB = (b.lessonId * 9301 + today.length) % 49297;
        return hashA - hashB;
      });
      
      console.log("Generated full playlist:", shuffled.length, "tracks");
      setPlaylist(shuffled);
      
    } catch (error) {
      console.error("Error generating playlist:", error);
    } finally {
      setLoadingPlaylist(false);
    }
  }, [userProgress, playlist.length]);

  // Navigation functions
  const handleNextTrack = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
  };

  const handlePreviousTrack = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
  };
  useEffect(() => {
    console.log("useEffect triggered", { loading, user: !!user, isApproved: isApproved(), userProgress: userProgress?.length });
    
    if (!loading && user && isApproved() && userProgress) {
      generatePlaylist();
    }
  }, [loading, user, isApproved, userProgress, generatePlaylist]);

  // Auth checks
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (!isApproved()) {
        router.push("/pending");
        return;
      }
    }
  }, [user, loading, isApproved, router]);

  // Loading states
  if (loading || loadingPlaylist) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div>Loading your practice playlist...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!playlist || playlist.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎧</div>
          <h2>No Practice Audio Available</h2>
          <p>Complete some lessons first, then return here to practice with spaced repetition audio!</p>
          <button 
            onClick={() => router.push('/lessons')}
            className={styles.primaryButton}
          >
            Go to Lessons
          </button>
        </div>
      </div>
    );
  }

  const currentTrack = playlist[currentTrackIndex];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Practice Listening</h1>
        <p className={styles.subtitle}>
          Spaced repetition audio from your completed lessons
        </p>
      </div>

      <div className={styles.playerCard}>
        <div className={styles.trackInfo}>
          <div className={styles.trackTitle}>{currentTrack.lessonTitle}</div>
          <div className={styles.trackSection}>{currentTrack.section}</div>
          <div className={styles.trackMeta}>
            Track {currentTrackIndex + 1} of {playlist.length}
          </div>
        </div>
        
        <div className={styles.audioPlayerWrapper}>
          <AudioPlayer
            audioPath={currentTrack.audioPath}
            lessonId={currentTrack.lessonId}
            sectionName={currentTrack.section}
            userId={user?.id}
            fallbackToTTS={false}
            courseCode="en-es"
          />
        </div>

        {/* Track Navigation */}
        <div className={styles.controls}>
          <button 
            onClick={handlePreviousTrack}
            className={styles.controlButton}
          >
            ⏮ Previous
          </button>
          <button 
            onClick={handleNextTrack}
            className={styles.controlButton}
          >
            Next ⏭
          </button>
        </div>

        {/* Playlist Preview */}
        <div className={styles.playlistPreview}>
          <h3>Up Next:</h3>
          <div className={styles.upNext}>
            {playlist.slice(currentTrackIndex + 1, currentTrackIndex + 4).map((track, index) => (
              <div key={index} className={styles.upNextItem}>
                <span className={styles.upNextLesson}>{track.lessonTitle}</span>
                <span className={styles.upNextSection}>{track.section}</span>
              </div>
            ))}
            {playlist.length > currentTrackIndex + 4 && (
              <div className={styles.upNextItem}>
                <span className={styles.upNextMore}>...and {playlist.length - currentTrackIndex - 4} more</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.instructions}>
        <h3>How to Practice:</h3>
        <ul>
          <li>Listen to each track and repeat what you hear</li> 
          <li>Try to speak during the pauses</li>
          <li>Recent lessons appear more often than older ones</li>
          <li>Use Previous/Next to navigate between tracks</li>
        </ul>
      </div>
    </div>
  );
}