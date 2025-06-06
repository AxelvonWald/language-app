// components/lesson/SentenceTable.jsx
"use client";

import styles from './SentenceTable.module.css';

export default function SentenceTable({ sentences, showColumns }) {
  if (!sentences || sentences.length === 0) {
    return (
      <div className={styles.noSentences}>
        No sentences available
      </div>
    );
  }

  return (
    <table className={styles.sentenceTable}>
      <thead>
        <tr>
          {showColumns.includes('target') && (
            <th className={styles.tableHeader}>
              Spanish
            </th>
          )}
          {showColumns.includes('native') && (
            <th className={styles.tableHeader}>
              English
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {sentences.map((sentence, index) => (
          <tr key={sentence.id} className={styles.sentenceRow}>
            {showColumns.includes('target') && (
              <td 
                className={styles.targetCell}
                data-label="Spanish"
              >
                <span className={styles.targetSentence}>
                  {sentence.target}
                </span>
              </td>
            )}
            {showColumns.includes('native') && (
              <td 
                className={styles.nativeCell}
                data-label="English"
              >
                <span className={styles.nativeSentence}>
                  {sentence.native}
                </span>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}