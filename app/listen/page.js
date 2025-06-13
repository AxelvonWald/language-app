// app/listen/page.js - Smart Playlist with Transparent Algorithm
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
  const [playlistDebugInfo, setPlaylistDebugInfo] = useState(null);

  // Helper function to generate tracks for a single lesson
  const generateTracksForLesson = async (lesson) => {
    const lessonId = lesson.lesson_id;
    const paddedId = lessonId.toString().padStart(3, "0");
    
    try {
      const lessonModule = await import(`../../data/courses/en-es/lessons/lesson-${paddedId}.json`);
      const lessonData = lessonModule.default;
      
      const tracks = [];
      
      // Add Listen & Read track
      if (lessonData.sections.listenRead?.audio) {
        tracks.push({
          lessonId,
          lessonTitle: lessonData.title || `Lesson ${lessonId}`,
          audioPath: lessonData.sections.listenRead.audio,
          section: "Listen & Read",
          daysSinceCompleted: lesson.daysSinceCompleted || 0,
          selectionReason: lesson.selectionReason || "unknown"
        });
      }
      
      // Add Listen & Repeat track  
      if (lessonData.sections.listenRepeat?.audio) {
        tracks.push({
          lessonId,
          lessonTitle: lessonData.title || `Lesson ${lessonId}`,
          audioPath: lessonData.sections.listenRepeat.audio,
          section: "Listen & Repeat",
          daysSinceCompleted: lesson.daysSinceCompleted || 0,
          selectionReason: lesson.selectionReason || "unknown"
        });
      }
      
      return tracks;
      
    } catch (error) {
      console.log(`❌ Could not load lesson ${lessonId}:`, error.message);
      return [];
    }
  };

  // Smart Playlist Generation with Full Transparency
  const generateSmartPlaylist = useCallback(async () => {
    console.log("\n🎵 PLAYLIST GENERATION REPORT");
    console.log("=".repeat(60));
    
    if (!userProgress || userProgress.length === 0) {
      console.log("❌ No user progress found");
      setLoadingPlaylist(false);
      return;
    }

    // Only generate if we don't have a playlist yet
    if (playlist.length > 0) {
      console.log("✅ Playlist already exists, skipping generation");
      setLoadingPlaylist(false);
      return;
    }

    const today = new Date();
    const completedLessons = userProgress
      .filter(p => p.status === 'completed')
      .sort((a, b) => a.lesson_id - b.lesson_id);
    
    console.log(`📚 Total completed lessons: ${completedLessons.length}`);
    
    if (completedLessons.length === 0) {
      console.log("❌ No completed lessons found");
      setLoadingPlaylist(false);
      return;
    }

    // Add days since completed to each lesson
    const lessonsWithDays = completedLessons.map(lesson => {
      const completedAt = new Date(lesson.completed_at);
      const daysSinceCompleted = Math.floor((today - completedAt) / (1000 * 60 * 60 * 24));
      return {
        ...lesson,
        daysSinceCompleted
      };
    });

    // STEP 1: Get the 2 most recent lessons (always included)
    const recentLessons = lessonsWithDays.slice(-2).map(lesson => ({
      ...lesson,
      selectionReason: "recent"
    }));
    
    console.log("\n🔥 RECENT LESSONS (always included):");
    recentLessons.forEach(lesson => {
      console.log(`   Lesson ${lesson.lesson_id}: completed ${lesson.daysSinceCompleted} days ago`);
    });

    // STEP 2: Calculate staleness for older lessons  
    const olderLessons = lessonsWithDays.slice(0, -2);
    let stalestLessons = [];
    
    console.log("\n📊 STALENESS ANALYSIS:");
    
    if (olderLessons.length === 0) {
      console.log("   No older lessons to analyze");
    } else {
      console.log("   Analyzing older lessons for staleness...");
      olderLessons.forEach(lesson => {
        console.log(`   Lesson ${lesson.lesson_id}: ${lesson.daysSinceCompleted} days ago (staleness: ${lesson.daysSinceCompleted})`);
      });

      // Select up to 2 stalest lessons
      stalestLessons = olderLessons
        .sort((a, b) => b.daysSinceCompleted - a.daysSinceCompleted) // Most stale first
        .slice(0, 2)
        .map(lesson => ({
          ...lesson,
          selectionReason: "stale"
        }));

      console.log("\n🕰️ SELECTED STALE LESSONS:");
      stalestLessons.forEach(lesson => {
        console.log(`   Lesson ${lesson.lesson_id}: ${lesson.daysSinceCompleted} days ago`);
      });
    }

    // STEP 3: Combine into final lesson selection
    const selectedLessons = [...recentLessons, ...stalestLessons];
    
    console.log("\n🎯 FINAL LESSON SELECTION:");
    selectedLessons.forEach((lesson, index) => {
      const icon = lesson.selectionReason === "recent" ? "🔥" : "🕰️";
      console.log(`   ${index + 1}. ${icon} Lesson ${lesson.lesson_id} (${lesson.selectionReason.toUpperCase()}) - ${lesson.daysSinceCompleted} days ago`);
    });

    // STEP 4: Generate tracks from selected lessons
    console.log("\n🎵 GENERATING AUDIO TRACKS:");
    const playlistTracks = [];
    
    for (const lesson of selectedLessons) {
      const lessonTracks = await generateTracksForLesson(lesson);
      playlistTracks.push(...lessonTracks);
      console.log(`   Lesson ${lesson.lesson_id}: ${lessonTracks.length} tracks added`);
    }

    // STEP 5: Simple shuffle (same order each day)
    const today_string = today.toDateString();
    let shuffleSeed = 0;
    for (let i = 0; i < today_string.length; i++) {
      shuffleSeed = ((shuffleSeed << 5) - shuffleSeed + today_string.charCodeAt(i)) & 0xffffffff;
    }
    
    const shuffledTracks = [...playlistTracks].sort((a, b) => {
      const indexA = playlistTracks.indexOf(a);
      const indexB = playlistTracks.indexOf(b);
      const hashA = (indexA * 9301 + shuffleSeed) % 49297;
      const hashB = (indexB * 9301 + shuffleSeed) % 49297;
      return hashA - hashB;
    });

    console.log(`\n✅ PLAYLIST COMPLETE:`);
    console.log(`   📊 ${selectedLessons.length} lessons selected`);
    console.log(`   🎵 ${shuffledTracks.length} total tracks`);
    console.log(`   🎯 Algorithm: 2 newest + 2 stalest`);
    console.log("=".repeat(60));

    // Create debug info for UI
    const debugInfo = {
      totalCompletedLessons: completedLessons.length,
      selectedLessons: selectedLessons.map(l => ({
        id: l.lesson_id,
        reason: l.selectionReason,
        daysAgo: l.daysSinceCompleted
      })),
      totalTracks: shuffledTracks.length,
      algorithm: "2 most recent + 2 stalest lessons"
    };

    setPlaylist(shuffledTracks);
    setPlaylistDebugInfo(debugInfo);
    setLoadingPlaylist(false);

  }, [userProgress, playlist.length]);

  // Generate playlist when data is ready
  useEffect(() => {
    if (!loading && user && isApproved() && userProgress) {
      generateSmartPlaylist();
    }
  }, [loading, user, isApproved, userProgress, generateSmartPlaylist]);

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
          <div>Creating your smart playlist...</div>
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
        <h1 className={styles.title}>Smart Practice Playlist</h1>
        <p className={styles.subtitle}>
          Intelligent spaced repetition: recent lessons + forgotten content
        </p>
      </div>

      <div className={styles.playerCard}>
        <div className={styles.trackInfo}>
          <div className={styles.trackTitle}>{currentTrack.lessonTitle}</div>
          <div className={styles.trackSection}>
            {currentTrack.section}
            {currentTrack.selectionReason === "recent" && " 🔥"}
            {currentTrack.selectionReason === "stale" && " 🕰️"}
          </div>
          <div className={styles.trackMeta}>
            Track {currentTrackIndex + 1} of {playlist.length}
            {currentTrack.daysSinceCompleted > 0 && 
              ` • ${currentTrack.daysSinceCompleted} days ago`
            }
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
                <span className={styles.upNextLesson}>
                  {track.lessonTitle}
                  {track.selectionReason === "recent" && " 🔥"}
                  {track.selectionReason === "stale" && " 🕰️"}
                </span>
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

      {/* Smart Algorithm Debug Panel */}
      {playlistDebugInfo && (
        <div className={styles.debugPanel}>
          <details>
            <summary>🔍 <strong>Smart Playlist Logic</strong> (click to expand)</summary>
            <div className={styles.debugContent}>
              <div className={styles.debugSection}>
                <h4>📊 Algorithm Summary:</h4>
                <p><strong>Strategy:</strong> {playlistDebugInfo.algorithm}</p>
                <p><strong>From:</strong> {playlistDebugInfo.totalCompletedLessons} completed lessons</p>
                <p><strong>Selected:</strong> {playlistDebugInfo.selectedLessons.length} lessons</p>
                <p><strong>Total tracks:</strong> {playlistDebugInfo.totalTracks}</p>
              </div>
              
              <div className={styles.debugSection}>
                <h4>🎯 Lesson Selection:</h4>
                <ul className={styles.debugList}>
                  {playlistDebugInfo.selectedLessons.map(lesson => (
                    <li key={lesson.id}>
                      <strong>Lesson {lesson.id}</strong>
                      {lesson.reason === "recent" && " 🔥 (Recent)"}
                      {lesson.reason === "stale" && " 🕰️ (Needs review)"}
                      {lesson.daysAgo > 0 && ` - ${lesson.daysAgo} days ago`}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className={styles.debugSection}>
                <h4>💡 Why this works:</h4>
                <ul className={styles.debugList}>
                  <li><strong>🔥 Recent lessons:</strong> Get priority for reinforcement</li>
                  <li><strong>🕰️ Stale lessons:</strong> Prevent forgetting older material</li>
                  <li><strong>⚖️ Balance:</strong> 50% new, 50% review content</li>
                  <li><strong>🎲 Shuffle:</strong> Same order each day for consistency</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      )}

      <div className={styles.instructions}>
        <h3>How to Practice:</h3>
        <ul>
          <li><strong>🔥 Recent content:</strong> Focus on pronunciation and fluency</li>
          <li><strong>🕰️ Review content:</strong> Test your retention and refresh memory</li>
          <li><strong>🎯 Smart algorithm:</strong> Adapts to your learning progress automatically</li>
          <li><strong>⏭️ Navigate freely:</strong> Skip tracks or replay as needed</li>
        </ul>
      </div>
    </div>
  );
}