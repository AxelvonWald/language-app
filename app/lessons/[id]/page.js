// app/lessons/[id]/page.js
import AudioPlayer from "@/components/lesson/AudioPlayer";
import SentenceTable from "@/components/lesson/SentenceTable";
import Section from "@/components/lesson/Section";
import LessonCompletion from "@/components/lesson/LessonCompletion";

export default function LessonPage({ params }) {
  const paddedId = params.id.padStart(3, "0");
  
  // Load lesson structure and sentences database
  const lessonData = require(`../../../data/courses/en-es/lessons/lesson-${paddedId}.json`);
  const sentencesDB = require(`../../../data/courses/en-es/sentences.json`);
  
  // Dynamic audio path builder
  const getAudioPath = (fileName) => {
    return `/audio/en-es/lesson-${paddedId}/${fileName}`;
  };
  
  // Helper to get sentences for a section
  const getSectionSentences = (sectionKey) => {
    const section = lessonData.sections[sectionKey];
    return section.sentence_ids.map(id => sentencesDB[id.toString()]);
  };

  return (
    <div className="lesson-container">
      <h1>Lesson {params.id}: {lessonData.title}</h1>
      
      {/* Section 1: Listen and Read */}
      <Section 
        title="Listen and Read"
        instruction={lessonData.sections.listenRead.instruction}
        audio={getAudioPath(lessonData.sections.listenRead.audio)}
        sentences={getSectionSentences('listenRead')}
        showColumns={['target', 'native']}
      />
      
      {/* Section 2: Listen and Repeat */}
      <Section 
        title="Listen and Repeat"
        instruction={lessonData.sections.listenRepeat.instruction}
        audio={getAudioPath(lessonData.sections.listenRepeat.audio)}
        sentences={getSectionSentences('listenRepeat')}
        showColumns={['target', 'native']}
      />
      
      {/* Section 3: Write */}
      <Section 
        title="Write"
        instruction={lessonData.sections.write.instruction}
        sentences={getSectionSentences('write')}
        showColumns={['target', 'native']}
      />
      
      {/* Section 4: Translation - Only native language */}
      <Section 
        title="Translation"
        instruction={lessonData.sections.translation.instruction}
        audio={getAudioPath(lessonData.sections.translation.audio)}
        sentences={getSectionSentences('translation')}
        showColumns={['native']}
      />
      
      {/* Section 5: Rest of Day */}
      <Section 
        title="Rest of the Day"
        instruction={lessonData.sections.restOfDay.instruction}
        sentences={getSectionSentences('restOfDay')}
        showColumns={['target', 'native']}
      />

      {/* Lesson Completion */}
      <LessonCompletion 
        currentLessonId={params.id}
        totalLessons={32}
      />

    </div>
  );
}