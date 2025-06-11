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

  // Debug logs
  console.log('🐛 SentenceTable showColumns:', showColumns)

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={styles.sentenceTable}>
        <thead>
          <tr>
            {/* Render headers in the order specified by showColumns */}
            {showColumns.map((column, index) => (
              <th key={column} className={styles.tableHeader}>
                {column === 'target' ? 'Español' : 'English'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sentences.map((sentence, index) => (
            <tr key={sentence.id || index} className={styles.sentenceRow}>
              {/* Render cells in the order specified by showColumns */}
              {showColumns.map((column, colIndex) => (
                <td
                  key={`${sentence.id || index}-${column}`}
                  className={column === 'target' ? styles.targetCell : styles.nativeCell}
                  data-label={column === 'target' ? 'Español' : 'English'}
                >
                  <span className={column === 'target' ? styles.targetSentence : styles.nativeSentence}>
                    {column === 'target' 
                      ? (sentence.target || sentence.fallback_target)
                      : (sentence.native || sentence.fallback_native)
                    }
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}