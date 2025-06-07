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
  className = "" 
}) {
  const [isCompleted, setIsCompleted] = useState(false)

  const handleCheckboxChange = (checked) => {
    setIsCompleted(checked)
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
          <AudioPlayer src={audio} />
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