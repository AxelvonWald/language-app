// app/pending/page.js
'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProgress } from '@/hooks/useProgress';
import styles from './Pending.module.css';

export default function PendingPage() {
  const router = useRouter();
  const { user, loading, isApproved, userStatus, refreshUserData } = useProgress();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (isApproved()) {
        router.push('/lessons/1');
        return;
      }
    }
  }, [user, loading, isApproved, router]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await refreshUserData();
      // Give a moment for the state to update
      setTimeout(() => {
        setChecking(false);
      }, 500);
    } catch (error) {
      console.error('Error checking status:', error);
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className={styles.container}>
      <div className={styles.pendingCard}>
        <div className={styles.icon}>⏳</div>
        
        <h1 className={styles.title}>
          Account Pending Approval
        </h1>
        
        <p className={styles.description}>
          Thank you for signing up! Your account is currently pending approval.
          We will review your request and send you an email once you have been approved
          to access the Spanish course.
        </p>
        
        <div className={`${styles.statusCard} ${userStatus === 'approved' ? styles.approved : ''}`}>
          <strong>Status:</strong> {userStatus || 'Pending'}
          {userStatus === 'approved' && (
            <div className={styles.approvedMessage}>
              ✅ Approved! Redirecting to lessons...
            </div>
          )}
        </div>
        
        <p className={styles.helpText}>
          This usually takes 1-2 business days. If you have any questions,
          please contact support.
        </p>
        
        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className={`${styles.checkButton} ${checking ? styles.checking : ''}`}
        >
          {checking ? '🔄 Checking...' : 'Check Status'}
        </button>
      </div>
    </div>
  );
}