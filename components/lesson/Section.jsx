// components/lesson/Section.jsx
import AudioPlayer from "./AudioPlayer";
import SentenceTable from "./SentenceTable";

export default function Section({ title, instruction, audio, sentences, showColumns }) {
  return (
    <div style={{ 
      marginTop: "3rem", 
      padding: "2rem", 
      border: "1px solid #ddd", 
      borderRadius: "12px",
      backgroundColor: "#fafafa"
    }}>
      <h2 style={{ marginTop: 0, color: "#333" }}>{title}</h2>
      <p style={{ 
        color: "#666", 
        fontSize: "1.1rem", 
        marginBottom: "1.5rem",
        fontStyle: "italic"
      }}>
        {instruction}
      </p>
      
      {audio && (
        <div style={{ marginBottom: "1.5rem" }}>
          <AudioPlayer audioPath={audio} />
        </div>
      )}
      
      <SentenceTable sentences={sentences} showColumns={showColumns} />
    </div>
  );
}