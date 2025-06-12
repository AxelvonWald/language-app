// app/account/page.js
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import AccountClient from './AccountClient'
import styles from './AccountPage.module.css'

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
          .select('profile_data, user_status')
          .eq('user_id', session.user.id)
          .single()

        // Check if user is approved
        if (profile?.user_status !== 'approved') {
          router.push('/pending')
          return
        }

        // Fetch user progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('lesson_id, completed_at')
          .eq('user_id', session.user.id)
          .eq('course_id', 'en-es')
          .order('lesson_id')

        // Calculate current lesson
        const highestCompleted = progress && progress.length > 0
          ? Math.max(...progress.map(p => p.lesson_id))
          : 0
        const currentLesson = Math.min(highestCompleted + 1, 32)

        const data = {
          email: session.user.email,
          currentLesson: currentLesson,
          hasPersonalized: !!profile?.profile_data,
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
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>
          Loading your account...
        </p>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return <AccountClient userData={userData} />
}