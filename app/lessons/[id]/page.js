// app/lessons/[id]/page.js
export default function LessonPage({ params }) {
  // Update the path to match your actual structure
  const lessonData = require(`../../../data/courses/en-es/lessons/lesson-${params.id.padStart(3, '0')}.json`);
  
  return <div>{lessonData.title}</div>;
}

export async function generateStaticParams() {
  return Array.from({ length: 32 }, (_, i) => ({
    id: (i + 1).toString(), // This will work with either "1" or "001"
  }));
}