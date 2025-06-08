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

  return (
    <section className={`${styles.section} ${className}`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      
      {instruction && (
        <div className={styles.sectionInstruction}>
          {instruction}
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
      
      {sentences && sentences.length > 0 && (
        <SentenceTable
          sentences={sentences}
          showColumns={showColumns}
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