// components/lesson/LessonCompletion.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/hooks/useProgress'
import styles from './LessonCompletion.module.css'

export default function LessonCompletion({ currentLessonId, totalLessons, onComplete, isCompleted }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { completeLesson, courseFlow } = useProgress()

  console.log('LessonCompletion - courseFlow:', courseFlow) // Debug log

  const handleNextLesson = async () => {
    setIsLoading(true)
    try {
      const currentLessonNum = parseInt(currentLessonId)
      
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

      // Try to use course flow, fall back to hardcoded if it fails
      let navigationHandled = false
      
      if (courseFlow && courseFlow.flow && Array.isArray(courseFlow.flow)) {
        try {
          const currentStepIndex = courseFlow.flow.findIndex(
            step => step && step.type === 'lesson' && step.id === currentLessonNum
          )
          
          console.log('Current step index:', currentStepIndex)
          
          if (currentStepIndex >= 0 && currentStepIndex < courseFlow.flow.length - 1) {
            const nextStep = courseFlow.flow[currentStepIndex + 1]
            console.log('Next step:', nextStep)
            
            if (nextStep && nextStep.type === 'lesson' && nextStep.id) {
              router.push(`/lessons/${nextStep.id}`)
              navigationHandled = true
            } else if (nextStep && nextStep.type === 'personalization' && nextStep.id) {
              const personalizeUrl = nextStep.id === 'basic' ? '/personalize' : `/personalize/${nextStep.id}`
              router.push(personalizeUrl)
              navigationHandled = true
            }
          }
        } catch (error) {
          console.error('Course flow navigation error:', error)
        }
      }
      
      // Fallback navigation if course flow didn't work
      if (!navigationHandled) {
        console.log('Using fallback navigation')
        if (currentLessonNum === 4) {
          router.push('/personalize')
        } else if (currentLessonNum < totalLessons) {
          router.push(`/lessons/${currentLessonNum + 1}`)
        } else {
          router.push('/account')
        }
      }
      
    } catch (error) {
      console.error('Error in handleNextLesson:', error)
    } finally {
      setIsLoading(false)
    }
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

      {/* Next Lesson Button */}
      {currentLessonNum < totalLessons && (
        <button
          onClick={handleNextLesson}
          disabled={isLoading}
          className={styles.nextButton}
        >
          {isLoading ? 'Loading...' : (
            currentLessonNum === 4 ? 
              (isCompleted ? 'Continue to Personalization →' : 'Complete & Personalize →') :
              (isCompleted ? 'Next Lesson →' : 'Complete & Continue →')
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