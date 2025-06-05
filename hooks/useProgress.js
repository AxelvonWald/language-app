// hooks/useProgress.js
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useProgress() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [personalizationData, setPersonalizationData] = useState(null);
  const [userProgress, setUserProgress] = useState([]);

  // Initialize auth state and load user data
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          // Clear data when user logs out
          setPersonalizationData(null);
          setUserProgress([]);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user's personalization data and progress
  const loadUserData = async (userId) => {
    try {
      // Load personalization data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('profile_data')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      } else if (profileData?.profile_data) {
        setPersonalizationData(profileData.profile_data);
      }

      // Load progress data
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', 'en-es')
        .order('lesson_id');

      if (progressError) {
        console.error('Error loading progress:', progressError);
      } else {
        setUserProgress(progressData || []);
      }

    } catch (error) {
      console.error('Error in loadUserData:', error);
    }
  };

  // Save personalization data to Supabase
  const savePersonalization = async (formData) => {
    if (!user) return false;

    try {
      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let result;
      
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('user_profiles')
          .update({ 
            profile_data: formData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Insert new profile
        result = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            profile_data: formData
          });
      }

      if (result.error) {
        console.error('Error saving personalization:', result.error);
        return false;
      }

      // Update local state
      setPersonalizationData(formData);
      
      // Also update the user's has_personalized flag
      await supabase.auth.updateUser({
        data: { has_personalized: true }
      });

      return true;
    } catch (error) {
      console.error('Error in savePersonalization:', error);
      return false;
    }
  };

  // Check if user has completed personalization
  const hasPersonalized = () => {
    return !!personalizationData;
  };

  // Get the highest lesson the user can access
  const getMaxAccessibleLesson = () => {
    if (!user) return 1;
    
    // If not personalized, can only access up to lesson 5
    if (!hasPersonalized()) {
      return Math.min(5, Math.max(1, getHighestCompletedLesson() + 1));
    }
    
    // If personalized, can access next lesson after highest completed
    return Math.max(1, getHighestCompletedLesson() + 1);
  };

  // Get the highest completed lesson number
  const getHighestCompletedLesson = () => {
    if (userProgress.length === 0) return 0;
    return Math.max(...userProgress.map(p => p.lesson_id));
  };

  // Check if user can access a specific lesson
  const canAccessLesson = (lessonId) => {
    return lessonId <= getMaxAccessibleLesson();
  };

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId) => {
    return userProgress.some(p => p.lesson_id === lessonId && p.status === 'completed');
  };

  // Mark a lesson as completed
  const completeLesson = async (lessonId) => {
    if (!user) return false;

    try {
      // Check if already completed
      if (isLessonCompleted(lessonId)) {
        return true;
      }

      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          course_id: 'en-es',
          lesson_id: lessonId,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error completing lesson:', error);
        return false;
      }

      // Update local state
      const newProgress = {
        user_id: user.id,
        course_id: 'en-es',
        lesson_id: lessonId,
        status: 'completed',
        completed_at: new Date().toISOString()
      };
      
      setUserProgress(prev => [...prev, newProgress]);
      
      return true;
    } catch (error) {
      console.error('Error in completeLesson:', error);
      return false;
    }
  };

  // Get current lesson (next incomplete lesson)
  const getCurrentLesson = () => {
    return getMaxAccessibleLesson();
  };

  return {
    user,
    loading,
    personalizationData,
    userProgress,
    savePersonalization,
    hasPersonalized,
    canAccessLesson,
    isLessonCompleted,
    completeLesson,
    getCurrentLesson,
    getMaxAccessibleLesson,
    getHighestCompletedLesson
  };
}