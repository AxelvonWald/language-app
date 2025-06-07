// components/lesson/SentenceTable.jsx
'use client'
import styles from "./SentenceTable.module.css"

export default function SentenceTable({ sentences, showColumns, className = "" }) {
  // If no sentences, show empty state
  if (!sentences || sentences.length === 0) {
    return (
      <div className={styles.noSentences}>
        No sentences available for this section.
      </div>
    )
  }

  // Determine which columns to show
  const showTarget = showColumns.includes('target')
  const showNative = showColumns.includes('native')

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={styles.sentenceTable}>
        <thead>
          <tr>
            {showTarget && (
              <th className={styles.tableHeader}>
                Español
              </th>
            )}
            {showNative && (
              <th className={styles.tableHeader}>
                English
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sentences.map((sentence, index) => (
            <tr key={sentence.id || index} className={styles.sentenceRow}>
              {showTarget && (
                <td 
                  className={styles.targetCell}
                  data-label="Español"
                >
                  <span className={styles.targetSentence}>
                    {sentence.target || sentence.fallback_target}
                  </span>
                </td>
              )}
              {showNative && (
                <td 
                  className={styles.nativeCell}
                  data-label="English"
                >
                  <span className={styles.nativeSentence}>
                    {sentence.native || sentence.fallback_native}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}