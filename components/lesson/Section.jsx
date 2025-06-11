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
    if (sectionName === 'restOfDay') {
      return "Download both audio files and add to your playlist. Listen and repeat as much as you can until your next lesson."
    }
    return instruction
  }

  // Get audio file URLs for download links (Rest of Day section)
  const getDownloadUrls = () => {
    if (sectionName !== 'restOfDay') return null
    
    const paddedLessonId = lessonId.toString().padStart(3, '0')
    const courseCode = 'en-es' // Could be passed as prop if needed
    
    return {
      track1: {
        filename: `${courseCode}-lesson${paddedLessonId}-1.mp3`,
        label: 'Track 1: Mixed (English + Spanish)',
        description: 'Listen and repeat after each Spanish sentence'
      },
      track2: {
        filename: `${courseCode}-lesson${paddedLessonId}-2.mp3`, 
        label: 'Track 2: Spanish Only (5x repeats)',
        description: 'Spanish sentences repeated 5 times each'
      }
    }
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

      {/* Rest of Day: Show download links instead of table */}
      {sectionName === 'restOfDay' && (
        <div className={styles.downloadSection}>
          <h3 className={styles.downloadTitle}>Download Audio Files:</h3>
          {(() => {
            const downloads = getDownloadUrls()
            return (
              <div className={styles.downloadLinks}>
                <div className={styles.downloadItem}>
                  <h4 className={styles.downloadLabel}>{downloads.track1.label}</h4>
                  <p className={styles.downloadDescription}>{downloads.track1.description}</p>
                  <button 
                    className={styles.downloadButton}
                    onClick={() => {
                      // Create download link
                      const paddedLessonId = lessonId.toString().padStart(3, '0')
                      const staticPath = `static/en-es/lesson${paddedLessonId}/${downloads.track1.filename}`
                      // You'll need to implement the actual download logic here
                      console.log('Download track 1:', staticPath)
                    }}
                  >
                    📥 Download Track 1
                  </button>
                </div>
                
                <div className={styles.downloadItem}>
                  <h4 className={styles.downloadLabel}>{downloads.track2.label}</h4>
                  <p className={styles.downloadDescription}>{downloads.track2.description}</p>
                  <button 
                    className={styles.downloadButton}
                    onClick={() => {
                      // Create download link
                      const paddedLessonId = lessonId.toString().padStart(3, '0')
                      const staticPath = `static/en-es/lesson${paddedLessonId}/${downloads.track2.filename}`
                      // You'll need to implement the actual download logic here
                      console.log('Download track 2:', staticPath)
                    }}
                  >
                    📥 Download Track 2
                  </button>
                </div>
              </div>
            )
          })()}
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