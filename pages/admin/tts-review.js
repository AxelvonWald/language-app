// pages/admin/tts-review.js
'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TTSReview() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tts_requests')
        .select(`
          *,
          auth_users:user_id (email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error loading TTS requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));

    try {
      // Update status to approved
      const { error: updateError } = await supabase
        .from('tts_requests')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Trigger TTS generation
      const response = await fetch('/api/admin/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger TTS generation');
      }

      // Reload requests
      await loadRequests();

    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request: ' + error.message);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const rejectRequest = async (requestId, reason = '') => {
    setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));

    try {
      const { error } = await supabase
        .from('tts_requests')
        .update({ 
          status: 'rejected',
          notes: reason 
        })
        .eq('id', requestId);

      if (error) throw error;

      await loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request: ' + error.message);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const bulkApprove = async () => {
    const pendingRequests = requests.filter(r => r.status === 'pending');
    
    if (!confirm(`Approve ${pendingRequests.length} pending requests?`)) {
      return;
    }

    setProcessing(prev => ({ ...prev, bulk: 'approving' }));

    try {
      for (const request of pendingRequests) {
        await approveRequest(request.id);
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
    } finally {
      setProcessing(prev => ({ ...prev, bulk: null }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'completed': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>TTS Review Dashboard</h1>
        <div>Loading requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>TTS Review Dashboard</h1>
        <p>Review and approve text-to-speech requests from users</p>
      </div>

      {/* Filter Controls */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label>Filter:</label>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>

        {filter === 'pending' && requests.length > 0 && (
          <button
            onClick={bulkApprove}
            disabled={processing.bulk}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: processing.bulk ? 'not-allowed' : 'pointer'
            }}
          >
            {processing.bulk ? 'Approving All...' : `Approve All ${requests.length}`}
          </button>
        )}

        <button
          onClick={loadRequests}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          No {filter !== 'all' ? filter : ''} requests found
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {requests.map(request => (
            <div
              key={request.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1.5rem',
                background: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>
                    Lesson {request.lesson_id}, Sentence {request.sentence_id}
                  </h3>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                    User: {request.auth_users?.email} • 
                    Created: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  style={{
                    background: getStatusColor(request.status),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  {request.status}
                </span>
              </div>

              <div style={{
                background: '#f9fafb',
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                <strong>Text to generate:</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                  &ldquo;{request.personalized_text}&rdquo;
                </p>
              </div>

              {request.notes && (
                <div style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '14px' }}>
                  <strong>Notes:</strong> {request.notes}
                </div>
              )}

              {request.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => approveRequest(request.id)}
                    disabled={processing[request.id]}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: processing[request.id] ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {processing[request.id] === 'approving' ? 'Approving...' : 'Approve & Generate'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection (optional):');
                      if (reason !== null) rejectRequest(request.id, reason);
                    }}
                    disabled={processing[request.id]}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: processing[request.id] ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {processing[request.id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              )}

              {request.audio_url && (
                <div style={{ marginTop: '1rem' }}>
                  <audio controls src={request.audio_url} style={{ width: '100%' }}>
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}