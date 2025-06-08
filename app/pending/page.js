// app/pending/page.js
'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProgress } from '@/hooks/useProgress';

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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '2rem',
      textAlign: 'center',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
      
      <h1 style={{
        color: '#333',
        marginBottom: '1rem',
        fontSize: '1.8rem'
      }}>
        Account Pending Approval
      </h1>
      
      <p style={{
        color: '#666',
        fontSize: '1.1rem',
        lineHeight: '1.6',
        marginBottom: '2rem'
      }}>
        Thank you for signing up! Your account is currently pending approval.
        We will review your request and send you an email once you have been approved
        to access the Spanish course.
      </p>
      
      <div style={{
        backgroundColor: userStatus === 'approved' ? '#d4edda' : '#fff',
        padding: '1rem',
        borderRadius: '8px',
        border: userStatus === 'approved' ? '1px solid #c3e6cb' : '1px solid #ddd',
        marginBottom: '2rem'
      }}>
        <strong>Status:</strong> {userStatus || 'Pending'}
        {userStatus === 'approved' && (
          <div style={{ marginTop: '8px', color: '#155724' }}>
            ✅ Approved! Redirecting to lessons...
          </div>
        )}
      </div>
      
      <p style={{
        color: '#888',
        fontSize: '0.9rem'
      }}>
        This usually takes 1-2 business days. If you have any questions,
        please contact support.
      </p>
      
      <button
        onClick={handleCheckStatus}
        disabled={checking}
        style={{
          marginTop: '2rem',
          padding: '12px 24px',
          backgroundColor: checking ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: checking ? 'not-allowed' : 'pointer',
          fontSize: '1rem'
        }}
      >
        {checking ? '🔄 Checking...' : 'Check Status'}
      </button>
    </div>
  );
}