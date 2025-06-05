// components/layout/Header.jsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './Header.module.css'

export default function Header() {
  const [user, setUser] = useState(null)
  const [currentLesson, setCurrentLesson] = useState(1)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      
      if (session?.user) {
        // Get user's current lesson from user_metadata or database
        const userCurrentLesson = session.user.user_metadata?.current_lesson || 1
        setCurrentLesson(userCurrentLesson)
        
        // Optionally, you could also check the database for the highest completed lesson + 1
        // This would be more reliable if you want to sync with actual progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', session.user.id)
          .eq('course_id', 'en-es')
          .order('lesson_id', { ascending: false })
          .limit(1)
        
        if (progress && progress.length > 0) {
          // Set current lesson to the next lesson after the highest completed one
          const nextLesson = Math.min(progress[0].lesson_id + 1, 32) // Cap at 32 lessons
          setCurrentLesson(nextLesson)
        }
      }
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        
        if (session?.user) {
          const userCurrentLesson = session.user.user_metadata?.current_lesson || 1
          setCurrentLesson(userCurrentLesson)
        } else {
          setCurrentLesson(1)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            Language App
          </Link>
          <nav className={styles.nav}>
            <div className={styles.loading}>Loading...</div>
          </nav>
        </div>
      </header>
    )
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Language App
        </Link>
        
        <nav className={styles.nav}>
          {user ? (
            <>
              <Link href={`/lessons/${currentLesson}`} className={styles.navLink}>
                Lessons
              </Link>
              <Link href="/account" className={styles.navLink}>
                Account
              </Link>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.navLink}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}