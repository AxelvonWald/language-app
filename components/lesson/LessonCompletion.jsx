// components/lesson/LessonCompletion.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function LessonCompletion({ lessonId, isCompleted, onComplete }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleNextLesson = async () => {
    setIsLoading(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mark lesson as completed if not already completed
      if (!isCompleted) {
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert(
            {
              user_id: user.id,
              course_id: 'en-es',
              lesson_id: parseInt(lessonId),
              completed_at: new Date().toISOString(),
              status: 'completed'
            },
            { onConflict: 'user_id,course_id,lesson_id' }
          )

        if (progressError) {
          console.error('Error updating progress:', progressError)
        }

        // Update user metadata for current lesson
        const nextLessonId = parseInt(lessonId) + 1
        const { error: userError } = await supabase.auth.updateUser({
          data: { current_lesson: Math.min(nextLessonId, 32) }
        })

        if (userError) {
          console.error('Error updating user metadata:', userError)
        }

        // Call the callback to update parent component
        if (onComplete) {
          onComplete()
        }
      }

      // Navigate to next lesson or personalization
      const currentLessonNum = parseInt(lessonId)
      
      if (currentLessonNum === 5) {
        // Check if user has already personalized
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('profile_data')
          .eq('user_id', user.id)
          .single()
        
        if (!profile?.profile_data) {
          router.push('/personalize')
          return
        }
      }
      
      // Navigate to next lesson (if not the last lesson)
      if (currentLessonNum < 32) {
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
    const currentLessonNum = parseInt(lessonId)
    if (currentLessonNum > 1) {
      router.push(`/lessons/${currentLessonNum - 1}`)
    }
  }

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
      {parseInt(lessonId) > 1 && (
        <button
          onClick={handlePreviousLesson}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          ← Previous Lesson
        </button>
      )}

      {/* Next Lesson Button - Always show if not the last lesson */}
      {parseInt(lessonId) < 32 && (
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
            opacity: isLoading ? 0.6 : 1,
            marginLeft: 'auto'
          }}
        >
          {isLoading ? 'Loading...' : (
            isCompleted ? 'Next Lesson →' : 'Complete & Continue →'
          )}
        </button>
      )}

      {/* Course Completion Message */}
      {parseInt(lessonId) === 32 && isCompleted && (
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#166534',
          fontWeight: '600'
        }}>
          🎉 Congratulations! You've completed the course!
        </div>
      )}
    </div>
  )
}