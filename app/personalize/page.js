// app/personalize/page.js
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './PersonalizeRedirect.module.css'

export default function PersonalizeRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first personalization form in the new flow
    router.replace('/personalize/basic')
  }, [router])

  // Show loading while redirecting
  return (
    <div className={styles.container}>
      <div className={styles.loadingSpinner}></div>
      <p className={styles.loadingText}>Redirecting to personalization...</p>
    </div>
  )
}