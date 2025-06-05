// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for user data management
export const userAPI = {
  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Get user profile (combines auth.users + profiles + user_profiles)
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Update user profile (current_lesson, has_personalized, etc.)
  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      })
    
    if (error) throw error
    return data
  },

  // Get user personalization data
  getUserPersonalization: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('profile_data')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.profile_data || null
  },

  // Save user personalization data
  saveUserPersonalization: async (userId, profileData) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        profile_data: profileData,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    return data
  },

  // Record lesson completion
  recordLessonCompletion: async (userId, courseId, lessonId) => {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        lesson_id: parseInt(lessonId),
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
    
    if (error) throw error
    return data
  },

  // Get user progress for a course
  getUserProgress: async (userId, courseId) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('lesson_id, completed_at, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('lesson_id', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Get highest completed lesson
  getHighestCompletedLesson: async (userId, courseId) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .order('lesson_id', { ascending: false })
      .limit(1)
    
    if (error) throw error
    return data?.[0]?.lesson_id || 0
  }
}