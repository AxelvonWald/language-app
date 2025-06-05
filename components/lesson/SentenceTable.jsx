// components/lesson/SentenceTable.jsx
export default function SentenceTable({ sentences, showColumns }) {
  if (!sentences || sentences.length === 0) {
    return <div>No sentences available</div>;
  }

  return (
    <table style={{
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "1rem"
    }}>
      <thead>
        <tr style={{ backgroundColor: "#f5f5f5" }}>
          {showColumns.includes('target') && (
            <th style={{
              padding: "12px",
              textAlign: "left",
              borderBottom: "2px solid #ddd",
              fontWeight: "600"
            }}>
              Spanish
            </th>
          )}
          {showColumns.includes('native') && (
            <th style={{
              padding: "12px",
              textAlign: "left",
              borderBottom: "2px solid #ddd",
              fontWeight: "600"
            }}>
              English
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {sentences.map((sentence, index) => (
          <tr key={sentence.id} style={{
            backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9"
          }}>
            {showColumns.includes('target') && (
              <td style={{
                padding: "12px",
                borderBottom: "1px solid #eee",
                fontSize: "1.1rem"
              }}>
                {sentence.target}
              </td>
            )}
            {showColumns.includes('native') && (
              <td style={{
                padding: "12px",
                borderBottom: "1px solid #eee",
                color: "#666",
                fontSize: "1rem"
              }}>
                {sentence.native}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}