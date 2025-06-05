// app/account/AccountClient.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './Account.module.css'

export default function AccountClient({ userData }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
      setIsLoggingOut(false)
    }
  }

  const completionPercentage = Math.round((userData.completedLessons.length / 32) * 100)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>My Account</h1>
        
        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <div className={styles.profileInfo}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{userData.email}</span>
            </div>
            
            {userData.profileData && (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Name:</span>
                  <span className={styles.value}>{userData.profileData.name}</span>
                </div>
                {userData.profileData.age && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Age:</span>
                    <span className={styles.value}>{userData.profileData.age}</span>
                  </div>
                )}
                {userData.profileData.job && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Job:</span>
                    <span className={styles.value}>{userData.profileData.job}</span>
                  </div>
                )}
                {userData.profileData.hobbies && userData.profileData.hobbies.length > 0 && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Hobbies:</span>
                    <span className={styles.value}>{userData.profileData.hobbies.join(', ')}</span>
                  </div>
                )}
              </>
            )}
            
            {!userData.hasPersonalized && (
              <div className={styles.personalizationNotice}>
                <p>Complete lesson 5 to personalize your learning experience!</p>
              </div>
            )}
          </div>
        </section>

        {/* Progress Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Learning Progress</h2>
          <div className={styles.progressInfo}>
            <div className={styles.progressStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{userData.currentLesson}</span>
                <span className={styles.statLabel}>Current Lesson</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{userData.completedLessons.length}</span>
                <span className={styles.statLabel}>Lessons Completed</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{completionPercentage}%</span>
                <span className={styles.statLabel}>Course Progress</span>
              </div>
            </div>
            
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Actions Section */}
        <section className={styles.actions}>
          <button
            onClick={() => router.push(`/lessons/${userData.currentLesson}`)}
            className={styles.continueButton}
          >
            Continue Learning
          </button>
          
          {userData.hasPersonalized && (
            <button
              onClick={() => router.push('/personalize')}
              className={styles.editProfileButton}
            >
              Edit Profile
            </button>
          )}
          
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={styles.logoutButton}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </section>
      </div>
    </div>
  )
}