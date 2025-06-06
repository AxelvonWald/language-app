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
        <div className={styles.header}>
          <h1 className={styles.title}>My Account</h1>
          <div className={styles.statusBadge}>
            {userData.hasPersonalized ? 'Personalized' : 'Getting Started'}
          </div>
        </div>
        
        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>👤</span>
            Profile Information
          </h2>
          <div className={styles.profileInfo}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{userData.email}</span>
            </div>
            
            {userData.profileData && (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Name</span>
                  <span className={styles.value}>{userData.profileData.name}</span>
                </div>
                {userData.profileData.age && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Age</span>
                    <span className={styles.value}>{userData.profileData.age}</span>
                  </div>
                )}
                {userData.profileData.job && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Job</span>
                    <span className={styles.value}>{userData.profileData.job}</span>
                  </div>
                )}
                {userData.profileData.hobby && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Hobby</span>
                    <span className={styles.value}>{userData.profileData.hobby}</span>
                  </div>
                )}
                {userData.profileData.country && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Country</span>
                    <span className={styles.value}>{userData.profileData.country}</span>
                  </div>
                )}
                {userData.profileData.family_size && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Family Size</span>
                    <span className={styles.value}>{userData.profileData.family_size}</span>
                  </div>
                )}
              </>
            )}
            
            {!userData.hasPersonalized && (
              <div className={styles.personalizationNotice}>
                <div className={styles.noticeIcon}>⭐</div>
                <div className={styles.noticeContent}>
                  <h4>Unlock Personalized Learning</h4>
                  <p>Complete lesson 5 to personalize your learning experience with your own details!</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Progress Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📊</span>
            Learning Progress
          </h2>
          <div className={styles.progressInfo}>
            <div className={styles.progressStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{userData.currentLesson}</span>
                <span className={styles.statLabel}>Current Lesson</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{userData.completedLessons.length}</span>
                <span className={styles.statLabel}>Completed</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{completionPercentage}%</span>
                <span className={styles.statLabel}>Progress</span>
              </div>
            </div>
            
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <span className={styles.progressText}>
                {userData.completedLessons.length} of 32 lessons completed
              </span>
            </div>

            {userData.completedLessons.length > 0 && (
              <div className={styles.achievementBadge}>
                <span className={styles.achievementIcon}>🎉</span>
                <span className={styles.achievementText}>
                  {userData.completedLessons.length === 1 
                    ? 'First lesson completed!' 
                    : `${userData.completedLessons.length} lessons mastered!`}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Actions Section */}
        <section className={styles.actions}>
          <button
            onClick={() => router.push(`/lessons/${userData.currentLesson}`)}
            className={styles.continueButton}
          >
            <span className={styles.buttonIcon}>▶️</span>
            Continue Learning
          </button>
          
          {userData.hasPersonalized && (
            <button
              onClick={() => router.push('/personalize')}
              className={styles.editProfileButton}
            >
              <span className={styles.buttonIcon}>✏️</span>
              Edit Profile
            </button>
          )}
          
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={styles.logoutButton}
          >
            <span className={styles.buttonIcon}>🚪</span>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </section>
      </div>
    </div>
  )
}