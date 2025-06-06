'use client'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AudioPlayer from "@/components/lesson/AudioPlayer"
import SentenceTable from "@/components/lesson/SentenceTable"
import Section from "@/components/lesson/Section"
import LessonCompletion from "@/components/lesson/LessonCompletion"
import { useProgress } from "@/hooks/useProgress"
import { supabase } from "@/lib/supabase"
import styles from "./Lesson.module.css"

export default function LessonPage({ params }) {
  const router = useRouter()
  
  // Get data from useProgress hook
  const {
    user,
    loading,
    personalizationData,
    canAccessLesson,
    hasPersonalized,
    isLessonCompleted,
    completeLesson,
    isApproved
  } = useProgress()

  // DEBUG LOGS - These should ALWAYS run
  console.log('=== LESSON PAGE DEBUG ===')
  console.log('Params:', params)
  console.log('User:', user?.id)
  console.log('Loading:', loading)
  console.log('Personalization data:', personalizationData)
  console.log('Has personalized:', hasPersonalized())
  console.log('========================')

  const [lessonData, setLessonData] = useState(null)
  const [sentencesDB, setSentencesDB] = useState(null)
  const [loadingLesson, setLoadingLesson] = useState(true)

  const paddedId = params.id.padStart(3, "0")
  const lessonId = parseInt(params.id)

  // Load lesson data
  useEffect(() => {
    console.log('Loading lesson data for:', paddedId)
    
    const loadLessonData = async () => {
      try {
        // Dynamic imports for lesson data
        const [lessonModule, sentencesModule] = await Promise.all([
          import(`../../../data/courses/en-es/lessons/lesson-${paddedId}.json`),
          import(`../../../data/courses/en-es/sentences.json`)
        ])
        
        console.log('Lesson module loaded:', lessonModule.default)
        console.log('Sentences loaded:', sentencesModule.default)
        
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
    console.log('Access check - loading:', loading, 'loadingLesson:', loadingLesson)
    
    if (loading || loadingLesson) return

    // Redirect to login if no user
    if (!user) {
      console.log('No user, redirecting to login')
      router.push('/login')
      return
    }

    // Redirect to pending page if not approved
    if (!isApproved()) {
      console.log('User not approved, redirecting to pending')
      router.push('/pending')
      return
    }

    // Check if user can access this lesson
    if (!canAccessLesson(lessonId)) {
      console.log('Cannot access lesson', lessonId, 'redirecting to lesson 1')
      // Redirect to their current lesson or lesson 1
      router.push('/lessons/1')
      return
    }

    // Special case: redirect to personalization after lesson 5
    if (lessonId === 6 && !hasPersonalized()) {
      console.log('Lesson 6 but not personalized, redirecting to /personalize')
      router.push('/personalize')
      return
    }
  }, [user, loading, loadingLesson, lessonId, canAccessLesson, hasPersonalized, isApproved, router])

  // Dynamic audio path builder
  const getAudioPath = (fileName) => {
    return `/audio/en-es/lesson-${paddedId}/${fileName}`
  }

  // Helper to get sentences for a section with personalization
  const getSectionSentences = (sectionKey) => {
    console.log('Getting section sentences for:', sectionKey)
    console.log('PersonalizationData in getSectionSentences:', personalizationData)
    
    if (!lessonData || !sentencesDB) return []
    
    const section = lessonData.sections[sectionKey]
    return section.sentence_ids.map(id => {
      const sentence = sentencesDB[id.toString()]
      
      console.log(`Processing sentence ${id}:`, sentence)
      
      // Apply personalization if available
      if (personalizationData && sentence.variables) {
        console.log('Applying personalization to sentence:', sentence.id, sentence.variables)
        
        let personalizedTarget = sentence.target
        let personalizedNative = sentence.native
        
        // Replace variables with personalized data
        sentence.variables.forEach(variable => {
          const value = personalizationData[variable]
          console.log(`Replacing {${variable}} with:`, value)
          
          if (value) {
            const placeholder = `{${variable}}`
            personalizedTarget = personalizedTarget.replace(placeholder, value)
            personalizedNative = personalizedNative.replace(placeholder, value)
          }
        })
        
        console.log('Personalized result:', { personalizedTarget, personalizedNative })
        
        return {
          ...sentence,
          target: personalizedTarget,
          native: personalizedNative
        }
      }
      
      console.log('No personalization applied to sentence:', sentence.id)
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
    console.log('Showing loading state')
    return (
      <div className={styles.lessonContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <div>Loading lesson...</div>
        </div>
      </div>
    )
  }

  // No lesson data
  if (!lessonData || !sentencesDB) {
    console.log('No lesson data found')
    return (
      <div className={styles.lessonContainer}>
        <div className={styles.error}>
          <h2>Lesson not found</h2>
          <p>The requested lesson could not be loaded.</p>
        </div>
      </div>
    )
  }

  console.log('Rendering lesson page with data')

  return (
    <div className={styles.lessonContainer}>
      <div className={styles.lessonHeader}>
        <h1 className={styles.lessonTitle}>
          Lesson {params.id}: {lessonData.title}
        </h1>
        {isLessonCompleted(lessonId) && (
          <div className={styles.completionBadge}>
            ✓ Completed
          </div>
        )}
      </div>


      
      {/* Section 1: Listen and Read */}
      <Section 
        title="Listen and Read"
        instruction={lessonData.sections.listenRead.instruction}
        audio={getAudioPath(lessonData.sections.listenRead.audio)}
        sentences={getSectionSentences('listenRead')}
        showColumns={['target', 'native']}
        className={styles.section}
      />
      
      {/* Section 2: Listen and Repeat */}
      <Section 
        title="Listen and Repeat"
        instruction={lessonData.sections.listenRepeat.instruction}
        audio={getAudioPath(lessonData.sections.listenRepeat.audio)}
        sentences={getSectionSentences('listenRepeat')}
        showColumns={['target', 'native']}
        className={styles.section}
      />
      
      {/* Section 3: Write */}
      <Section 
        title="Write"
        instruction={lessonData.sections.write.instruction}
        sentences={getSectionSentences('write')}
        showColumns={['target', 'native']}
        className={styles.section}
      />
      
      {/* Section 4: Translation - Only native language */}
      <Section 
        title="Translation"
        instruction={lessonData.sections.translation.instruction}
        audio={getAudioPath(lessonData.sections.translation.audio)}
        sentences={getSectionSentences('translation')}
        showColumns={['native']}
        className={styles.section}
      />
      
      {/* Section 5: Rest of Day */}
      <Section 
        title="Rest of the Day"
        instruction={lessonData.sections.restOfDay.instruction}
        sentences={getSectionSentences('restOfDay')}
        showColumns={['target', 'native']}
        className={styles.section}
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