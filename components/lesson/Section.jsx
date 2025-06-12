// components/lesson/Section.jsx
'use client'
import { useState } from 'react'
import AudioPlayer from './AudioPlayer'
import SentenceTable from './SentenceTable'
import styles from './Section.module.css'

export default function Section({
  title,
  instruction,
  audio,
  sentences,
  showColumns,
  className = "",
  lessonId,
  sectionName,
  userId
}) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState({})

  const handleCheckboxChange = (checked) => {
    setIsCompleted(checked)
  }

  // Extract filename from full audio path
  const getAudioFileName = (audioPath) => {
    if (!audioPath) return null
    return audioPath.split('/').pop() // Gets "sentence-1.mp3" from "/audio/en-es/lesson-001/sentence-1.mp3"
  }

  // Fix column order for listenRead section (audio says English first)
  const getColumnOrder = () => {
    if (sectionName === 'listenRead') {
      // Audio says English first, so show English | Spanish
      return ['native', 'target']
    }
    // For all other sections, keep Spanish | English
    return showColumns
  }

  // Get appropriate instruction text for restOfDay section
  const getInstructionText = () => {
    return instruction
  }

  // Get audio file URLs for download links (Rest of Day section)
  const getDownloadUrls = () => {
    if (sectionName !== 'restOfDay') return null
    
    const paddedLessonId = lessonId.toString().padStart(3, '0')
    const courseCode = 'en-es' // Could be passed as prop if needed
    
    // Determine if user has personalized audio or should use static
    const baseUrl = 'https://vafhwsnmkbdguxidubsz.supabase.co/storage/v1/object/public/audio'
    
    return {
      track1: {
        filename: `${courseCode}-lesson${paddedLessonId}-1.mp3`,
        staticUrl: `${baseUrl}/static/${courseCode}/lesson${paddedLessonId}/${courseCode}-lesson${paddedLessonId}-1.mp3`,
        personalizedUrl: userId ? `${baseUrl}/personalized/${userId}/lesson-${paddedLessonId}-${courseCode}-lesson${paddedLessonId}-1.mp3` : null,
        label: 'Track 1: Bilingual Practice',
        description: 'English → pause → Spanish (Pimsleur style)'
      },
      track2: {
        filename: `${courseCode}-lesson${paddedLessonId}-2.mp3`,
        staticUrl: `${baseUrl}/static/${courseCode}/lesson${paddedLessonId}/${courseCode}-lesson${paddedLessonId}-2.mp3`,
        personalizedUrl: userId ? `${baseUrl}/personalized/${userId}/lesson-${paddedLessonId}-${courseCode}-lesson${paddedLessonId}-2.mp3` : null,
        label: 'Track 2: Spanish Drilling',
        description: 'Spanish sentences repeated 5 times each'
      }
    }
  }

  // Download audio file with fallback logic
  const downloadAudio = async (trackKey) => {
    const downloadUrls = getDownloadUrls()
    if (!downloadUrls) return

    const track = downloadUrls[trackKey]
    setDownloadStatus(prev => ({ ...prev, [trackKey]: 'downloading' }))

    try {
      // Try personalized audio first (if user is logged in)
      let audioUrl = track.staticUrl // Default to static
      
      if (track.personalizedUrl && userId) {
        // Check if personalized audio exists
        try {
          const response = await fetch(track.personalizedUrl, { method: 'HEAD' })
          if (response.ok) {
            audioUrl = track.personalizedUrl
            console.log(`📱 Downloading personalized audio: ${track.filename}`)
          } else {
            console.log(`📱 Personalized audio not found, using static: ${track.filename}`)
          }
        } catch (error) {
          console.log(`📱 Error checking personalized audio, using static: ${track.filename}`)
        }
      }

      // Create download link
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = track.filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setDownloadStatus(prev => ({ ...prev, [trackKey]: 'success' }))
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, [trackKey]: null }))
      }, 2000)

    } catch (error) {
      console.error('Download error:', error)
      setDownloadStatus(prev => ({ ...prev, [trackKey]: 'error' }))
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, [trackKey]: null }))
      }, 3000)
    }
  }

  // Render download button with status
  const renderDownloadButton = (trackKey, track) => {
    const status = downloadStatus[trackKey]
    
    return (
      <div key={trackKey} className={styles.downloadItem}>
        <div className={styles.downloadInfo}>
          <h4 className={styles.downloadLabel}>{track.label}</h4>
          <p className={styles.downloadDescription}>{track.description}</p>
        </div>
        <button
          className={`${styles.downloadButton} ${status ? styles[status] : ''}`}
          onClick={() => downloadAudio(trackKey)}
          disabled={status === 'downloading'}
        >
          {status === 'downloading' && '⏳ Downloading...'}
          {status === 'success' && '✅ Downloaded!'}
          {status === 'error' && '❌ Error - Retry'}
          {!status && '📱 Download MP3'}
        </button>
      </div>
    )
  }

  return (
    <section className={`${styles.section} ${className}`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      
      {getInstructionText() && (
        <div className={styles.sectionInstruction}>
          {getInstructionText()}
        </div>
      )}

      {audio && (
        <div className={styles.audioSection}>
          <AudioPlayer
            audioPath={getAudioFileName(audio)}
            lessonId={lessonId}
            sectionName={sectionName}
            userId={userId}
            fallbackToTTS={true}
          />
        </div>
      )}

      {/* Show table for all sections EXCEPT restOfDay */}
      {sectionName !== 'restOfDay' && sentences && sentences.length > 0 && (
        <SentenceTable
          sentences={sentences}
          showColumns={getColumnOrder()}
          showCheckboxes={false}
        />
      )}

      {/* Download section for Rest of Day */}
      {sectionName === 'restOfDay' && (
        <div className={styles.downloadSection}>
          <h3 className={styles.downloadTitle}>📱 Download Today's Audio</h3>
          <p className={styles.downloadSubtitle}>
            Take these lessons with you for offline practice
          </p>
          <div className={styles.downloadList}>
            {Object.entries(getDownloadUrls()).map(([trackKey, track]) => 
              renderDownloadButton(trackKey, track)
            )}
          </div>
        </div>
      )}

      {/* Section completion checkbox */}
      <div className={styles.sectionCheckbox}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={isCompleted}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
          />
          <span className={styles.checkboxText}>
            Mark section as complete
          </span>
        </label>
      </div>
    </section>
  )
}