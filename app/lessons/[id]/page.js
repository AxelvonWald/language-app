// app/lessons/[id]/page.js
'use client'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AudioPlayer from "@/components/lesson/AudioPlayer"
import SentenceTable from "@/components/lesson/SentenceTable"
import Section from "@/components/lesson/Section"
import LessonCompletion from "@/components/lesson/LessonCompletion"
import { useProgress } from "@/hooks/useProgress"

export default function LessonPage({ params }) {
  const router = useRouter()
  const {
    user,
    loading,
    personalizationData,
    canAccessLesson,
    hasPersonalized,
    isLessonCompleted,
    completeLesson
  } = useProgress()

  const [lessonData, setLessonData] = useState(null)
  const [sentencesDB, setSentencesDB] = useState(null)
  const [loadingLesson, setLoadingLesson] = useState(true)

  const paddedId = params.id.padStart(3, "0")
  const lessonId = parseInt(params.id)

  // Load lesson data
  useEffect(() => {
    const loadLessonData = async () => {
      try {
        // Dynamic imports for lesson data
        const [lessonModule, sentencesModule] = await Promise.all([
          import(`../../../data/courses/en-es/lessons/lesson-${paddedId}.json`),
          import(`../../../data/courses/en-es/sentences.json`)
        ])
        
        setLessonData(lessonModule.default)
        setSentencesDB(sentencesModule.default)
      } catch (error) {
        console.error('Error loading lesson data:', error)
        // Handle missing lesson - redirect to lesson 1 or show error
        router.push('/lessons/1')
      } finally {
        setLoadingLesson(false)
      }
    }

    loadLessonData()
  }, [paddedId, router])

  // Check access and redirect if necessary
  useEffect(() => {
    if (loading || loadingLesson) return

    // Redirect to login if no user
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user can access this lesson
    if (!canAccessLesson(lessonId)) {
      // Redirect to their current lesson or lesson 1
      router.push('/lessons/1')
      return
    }

    // Special case: redirect to personalization after lesson 5
    if (lessonId === 6 && !hasPersonalized()) {
      router.push('/personalize')
      return
    }
  }, [user, loading, loadingLesson, lessonId, canAccessLesson, hasPersonalized, router])

  // Dynamic audio path builder
  const getAudioPath = (fileName) => {
    return `/audio/en-es/lesson-${paddedId}/${fileName}`
  }

  // Helper to get sentences for a section with personalization
  const getSectionSentences = (sectionKey) => {
    if (!lessonData || !sentencesDB) return []
    
    const section = lessonData.sections[sectionKey]
    return section.sentence_ids.map(id => {
      const sentence = sentencesDB[id.toString()]
      
      // Apply personalization if available
      if (personalizationData && sentence.variables) {
        let personalizedTarget = sentence.target
        let personalizedNative = sentence.native
        
        // Replace variables with personalized data
        sentence.variables.forEach(variable => {
          const value = personalizationData[variable]
          if (value) {
            const placeholder = `{${variable}}`
            personalizedTarget = personalizedTarget.replace(placeholder, value)
            personalizedNative = personalizedNative.replace(placeholder, value)
          }
        })
        
        return {
          ...sentence,
          target: personalizedTarget,
          native: personalizedNative
        }
      }
      
      return sentence
    })
  }

  // Handle lesson completion
  const handleLessonComplete = async () => {
    const success = await completeLesson(lessonId)
    if (success) {
      // Navigate to next lesson or completion page
      if (lessonId < 32) {
        router.push(`/lessons/${lessonId + 1}`)
      } else {
        // Course completed!
        router.push('/course-complete')
      }
    }
  }

  // Loading states
  if (loading || loadingLesson) {
    return (
      <div className="lesson-container">
        <div>Loading lesson...</div>
      </div>
    )
  }

  // No lesson data
  if (!lessonData || !sentencesDB) {
    return (
      <div className="lesson-container">
        <div>Lesson not found</div>
      </div>
    )
  }

  return (
    <div className="lesson-container">
      <div className="lesson-header">
        <h1>Lesson {params.id}: {lessonData.title}</h1>
        {isLessonCompleted(lessonId) && (
          <div className="completion-badge">✓ Completed</div>
        )}
      </div>
      
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
        onComplete={handleLessonComplete}
        isCompleted={isLessonCompleted(lessonId)}
      />
    </div>
  )
}