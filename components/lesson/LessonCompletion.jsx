// components/lesson/LessonCompletion.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/hooks/useProgress'

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
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '2rem',
      padding: '1rem',
      borderTop: '1px solid #e5e7eb'
    }}>
      {/* Previous Lesson Button */}
      {currentLessonNum > 1 && (
        <button
          onClick={handlePreviousLesson}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          ← Previous Lesson
        </button>
      )}

      {/* Spacer if no previous button */}
      {currentLessonNum === 1 && <div></div>}

      {/* Next Lesson Button - Always show if not the last lesson */}
      {currentLessonNum < totalLessons && (
        <button
          onClick={handleNextLesson}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Loading...' : (
            isCompleted ? 'Next Lesson →' : 'Complete & Continue →'
          )}
        </button>
      )}

      {/* Course Completion Message */}
      {currentLessonNum === totalLessons && isCompleted && (
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#166534',
          fontWeight: '600',
          flex: 1
        }}>
          🎉 Congratulations! You've completed the course!
        </div>
      )}
    </div>
  )
}