// hooks/useCurrentLesson.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCurrentLesson() {
  const [currentLesson, setCurrentLesson] = useState(1)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getCurrentLesson = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          setCurrentLesson(1)
          setUser(null)
          setLoading(false)
          return
        }

        setUser(session.user)

        // Get the highest completed lesson and calculate next lesson
        const { data: progress } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', session.user.id)
          .eq('course_id', 'en-es')
          .order('lesson_id', { ascending: false })
          .limit(1)

        if (progress && progress.length > 0) {
          // Next lesson is the highest completed + 1, capped at 32
          const nextLesson = Math.min(progress[0].lesson_id + 1, 32)
          setCurrentLesson(nextLesson)
        } else {
          // No progress yet, start with lesson 1
          setCurrentLesson(1)
        }

      } catch (error) {
        console.error('Error getting current lesson:', error)
        setCurrentLesson(1)
      } finally {
        setLoading(false)
      }
    }

    getCurrentLesson()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentLesson(1)
          setUser(null)
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          getCurrentLesson()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const updateCurrentLesson = (lessonId) => {
    setCurrentLesson(lessonId)
  }

  return {
    currentLesson,
    loading,
    user,
    updateCurrentLesson
  }
}