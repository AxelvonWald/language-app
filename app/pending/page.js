// app/pending/page.js
'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProgress } from '@/hooks/useProgress';

export default function PendingPage() {
  const router = useRouter();
  const { user, loading, isApproved, userStatus } = useProgress();

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
        backgroundColor: '#fff',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginBottom: '2rem'
      }}>
        <strong>Status:</strong> {userStatus || 'Pending'}
      </div>
      
      <p style={{ 
        color: '#888', 
        fontSize: '0.9rem'
      }}>
        This usually takes 1-2 business days. If you have any questions, 
        please contact support.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '2rem',
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Check Status
      </button>
    </div>
  );
}