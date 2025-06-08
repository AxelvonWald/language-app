// components/lesson/LessonCompletion.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/hooks/useProgress'
import styles from './LessonCompletion.module.css'

export default function LessonCompletion({ currentLessonId, totalLessons, onComplete, isCompleted }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { completeLesson, getNextStepUrl, courseFlow } = useProgress()

  const handleNextLesson = async () => {
    setIsLoading(true)
    try {
      const currentLessonNum = parseInt(currentLessonId)
  const nextStepInfo = getNextStepInfo()
      
      // Mark lesson as completed if not already completed
      if (!isCompleted) {
        const success = await completeLesson(currentLessonNum)
        if (!success) {
          console.error('Failed to complete lesson')
          setIsLoading(false)
          return
        }
        
        // Call the callback to update parent component
        if (onComplete) {
          onComplete()
        }
      }

      // Use course flow to determine next step
      if (courseFlow?.flow && Array.isArray(courseFlow.flow)) {
        // Find current step in the flow
        try {
          const currentStepIndex = courseFlow.flow.findIndex(
            step => step.type === 'lesson' && step.id === currentLessonNum
          )
          
          if (currentStepIndex !== -1 && currentStepIndex < courseFlow.flow.length - 1) {
            const nextStep = courseFlow.flow[currentStepIndex + 1]
            console.log('Next step from course flow:', nextStep)
            
            if (nextStep?.type === 'lesson' && nextStep?.id) {
              router.push(`/lessons/${nextStep.id}`)
              return
            } else if (nextStep?.type === 'personalization' && nextStep?.id) {
              // Build personalization URL based on ID
              const personalizeUrl = nextStep.id === 'basic' 
                ? '/personalize' 
                : `/personalize/${nextStep.id}`
              router.push(personalizeUrl)
              return
            }
          }
        } catch (error) {
          console.error('Error processing course flow:', error)
        }
      }

      // Fallback: go to next lesson
      if (currentLessonNum < totalLessons) {
        router.push(`/lessons/${currentLessonNum + 1}`)
      } else {
        router.push('/account')
      }
      
    } catch (error) {
      console.error('Error in handleNextLesson:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get next step info for button text
  const getNextStepInfo = () => {
    // Safe fallback if courseFlow isn't loaded yet
    if (!courseFlow?.flow || !Array.isArray(courseFlow.flow)) {
      return { type: 'lesson', text: 'Next Lesson' }
    }
    
    const currentLessonNum = parseInt(currentLessonId)
    
    try {
      const currentStepIndex = courseFlow.flow.findIndex(
        step => step.type === 'lesson' && step.id === currentLessonNum
      )
      
      if (currentStepIndex !== -1 && currentStepIndex < courseFlow.flow.length - 1) {
        const nextStep = courseFlow.flow[currentStepIndex + 1]
        
        if (nextStep?.type === 'lesson') {
          return { type: 'lesson', text: 'Next Lesson' }
        } else if (nextStep?.type === 'personalization' && nextStep?.id) {
          // Capitalize and format the personalization ID
          const formattedName = nextStep.id.charAt(0).toUpperCase() + nextStep.id.slice(1)
          return { type: 'personalization', text: `Add ${formattedName} Info` }
        }
      }
    } catch (error) {
      console.error('Error in getNextStepInfo:', error)
    }
    
    return { type: 'lesson', text: 'Next Lesson' }
  }

  const handlePreviousLesson = () => {
    const currentLessonNum = parseInt(currentLessonId)
    if (currentLessonNum > 1) {
      router.push(`/lessons/${currentLessonNum - 1}`)
    }
  }

  const currentLessonNum = parseInt(currentLessonId)

  return (
    <div className={styles.container}>
      {/* Previous Lesson Button */}
      {currentLessonNum > 1 && (
        <button
          onClick={handlePreviousLesson}
          disabled={isLoading}
          className={styles.previousButton}
        >
          ← Previous Lesson
        </button>
      )}

      {/* Spacer if no previous button */}
      {currentLessonNum === 1 && <div className={styles.spacer}></div>}

      {/* Next Lesson Button - Always show if not the last lesson */}
      {currentLessonNum < totalLessons && (
        <button
          onClick={handleNextLesson}
          disabled={isLoading}
          className={styles.nextButton}
        >
          {isLoading ? 'Loading...' : (
            isCompleted ? 
              `Continue to ${nextStepInfo.text} →` : 
              `Complete & ${nextStepInfo.text} →`
          )}
        </button>
      )}

      {/* Course Completion Message */}
      {currentLessonNum === totalLessons && isCompleted && (
        <div className={styles.completionMessage}>
          🎉 Congratulations! You've completed the course!
        </div>
      )}
    </div>
  )
}