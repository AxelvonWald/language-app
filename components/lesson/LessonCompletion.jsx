// components/lesson/LessonCompletion.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/hooks/useProgress'
import styles from './LessonCompletion.module.css'

export default function LessonCompletion({ currentLessonId, totalLessons, onComplete, isCompleted }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { completeLesson, hasPersonalized } = useProgress()

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

      // Special case: redirect to personalization after lesson 5
      if (currentLessonNum === 5 && !hasPersonalized()) {
        router.push('/personalize')
        return
      }

      // Navigate to next lesson (if not the last lesson)
      if (currentLessonNum < totalLessons) {
        router.push(`/lessons/${currentLessonNum + 1}`)
      } else {
        // Course completed - redirect to account or completion page
        router.push('/account')
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

      {/* Next Lesson Button - Always show if not the last lesson */}
      {currentLessonNum < totalLessons && (
        <button
          onClick={handleNextLesson}
          disabled={isLoading}
          className={styles.nextButton}
        >
          {isLoading ? 'Loading...' : (
            isCompleted ? 'Next Lesson →' : 'Complete & Continue →'
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