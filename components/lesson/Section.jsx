// components/lesson/Section.jsx
import AudioPlayer from "./AudioPlayer";
import SentenceTable from "./SentenceTable";
import styles from "./Section.module.css";

export default function Section({ 
  title, 
  instruction, 
  audio, 
  sentences, 
  showColumns,
  className = "" 
}) {
  return (
    <div className={`${styles.section} ${className}`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      
      {instruction && (
        <p className={styles.sectionInstruction}>
          {instruction}
        </p>
      )}
      
      {audio && (
        <div className={styles.audioSection}>
          <AudioPlayer audioPath={audio} />
        </div>
      )}
      
      <SentenceTable 
        sentences={sentences} 
        showColumns={showColumns}
        className={styles.sentenceTable}
      />
    </div>
  );
}