// app/personalize/page.js
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PersonalizeRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first personalization form in the new flow
    router.replace('/personalize/basic')
  }, [router])

  // Show loading while redirecting
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f1f5f9'
    }}>
      <p>Redirecting to personalization...</p>
    </div>
  )
}