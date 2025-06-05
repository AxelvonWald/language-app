// hooks/useProgress.js
import { useState, useEffect } from 'react'
import { userAPI } from '@/lib/supabase'

export function useProgress() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [personalizationData, setPersonalizationData] = useState(null)

  // Load user and their data on mount
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const currentUser = await userAPI.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        
        // Load progress, profile, and personalization data
        const [userProgress, profile, personalization] = await Promise.all([
          userAPI.getUserProgress(currentUser.id, 'en-es'),
          userAPI.getUserProfile(currentUser.id),
          userAPI.getUserPersonalization(currentUser.id)
        ])
        
        setProgress(userProgress)
        setUserProfile(profile)
        setPersonalizationData(personalization)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Complete a lesson
  const completeLesson = async (lessonId) => {
    if (!user) return false

    try {
      await userAPI.recordLessonCompletion(user.id, 'en-es', lessonId)
      
      // Update user profile with current lesson
      const nextLesson = parseInt(lessonId) + 1
      await userAPI.updateUserProfile(user.id, {
        current_lesson: nextLesson,
        current_course: 'en-es'
      })

      // Refresh progress data
      const updatedProgress = await userAPI.getUserProgress(user.id, 'en-es')
      setProgress(updatedProgress)
      
      return true
    } catch (error) {
      console.error('Error completing lesson:', error)
      return false
    }
  }

  // Save personalization data
  const savePersonalization = async (formData) => {
    if (!user) return false

    try {
      await userAPI.saveUserPersonalization(user.id, formData)
      await userAPI.updateUserProfile(user.id, {
        has_personalized: true
      })

      setPersonalizationData(formData)
      
      // Refresh user profile
      const updatedProfile = await userAPI.getUserProfile(user.id)
      setUserProfile(updatedProfile)
      
      return true
    } catch (error) {
      console.error('Error saving personalization:', error)
      return false
    }
  }

  // Get current lesson number
  const getCurrentLesson = () => {
    if (!userProfile) return 1
    return userProfile.current_lesson || 1
  }

  // Check if user has completed a specific lesson
  const isLessonCompleted = (lessonId) => {
    return progress.some(p => p.lesson_id === parseInt(lessonId) && p.status === 'completed')
  }

  // Check if user can access a lesson (completed previous or is next in sequence)
  const canAccessLesson = (lessonId) => {
    const lessonNum = parseInt(lessonId)
    if (lessonNum === 1) return true
    
    // Can access if previous lesson is completed
    return isLessonCompleted(lessonNum - 1)
  }

  // Check if personalization is completed
  const hasPersonalized = () => {
    return userProfile?.has_personalized || false
  }

  return {
    user,
    loading,
    progress,
    userProfile,
    personalizationData,
    completeLesson,
    savePersonalization,
    getCurrentLesson,
    isLessonCompleted,
    canAccessLesson,
    hasPersonalized,
    refreshData: loadUserData
  }
}