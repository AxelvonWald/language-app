// components/layout/Header.jsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useProgress } from '@/hooks/useProgress'
import styles from './Header.module.css'

export default function Header() {
  const router = useRouter()
  const { user, loading } = useProgress()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </header>
    )
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          🗣️ LangApp
        </Link>
        
        <nav className={styles.nav}>
          {user ? (
            <>
              <Link href="/lessons/1" className={styles.navLink}>
                Lessons
              </Link>
              <Link href="/account" className={styles.navLink}>
                Account
              </Link>
              <button 
                onClick={handleLogout}
                className={`${styles.navLink} ${styles.logoutBtn}`}
              >
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