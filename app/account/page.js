// app/account/page.js
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import AccountClient from './AccountClient'

export default function AccountPage() {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        // Fetch user profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('profile_data')
          .eq('user_id', session.user.id)
          .single()

        // Fetch user progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('lesson_id, completed_at')
          .eq('user_id', session.user.id)
          .eq('course_id', 'en-es')
          .order('lesson_id')

        const data = {
          email: session.user.email,
          currentLesson: session.user.user_metadata?.current_lesson || 1,
          hasPersonalized: session.user.user_metadata?.has_personalized || false,
          profileData: profile?.profile_data || null,
          completedLessons: progress || []
        }

        setUserData(data)
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return <AccountClient userData={userData} />
}