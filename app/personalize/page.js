"use client";

// app/personalize/page.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProgress } from '@/hooks/useProgress';

export default function PersonalizePage() {
  const router = useRouter();
  const { user, loading, savePersonalization, hasPersonalized } = useProgress();
  const [formData, setFormData] = useState({
    name: '',
    hobby: '',
    country: '',
    job: '',
    age: '',
    family_size: ''
  });
  const [saving, setSaving] = useState(false);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    // If already personalized, redirect to next lesson
    if (!loading && hasPersonalized()) {
      router.push('/lessons/3');
    }
  }, [user, loading, hasPersonalized, router]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    setSaving(true);
    
    try {
      const success = await savePersonalization(formData);
      
      if (success) {
        // Redirect to lesson 3
        router.push('/lessons/3');
      } else {
        alert('Error saving your information. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Show loading while checking authentication
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

  // Don't render form if user not authenticated
  if (!user) {
    return null;
  }

  const isFormValid = formData.name && formData.hobby && formData.country;

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '2rem auto', 
      padding: '2rem',
      border: '1px solid #ddd',
      borderRadius: '12px'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>
        Let us Personalize Your Learning!
      </h1>
      
      <p style={{ 
        textAlign: 'center', 
        color: '#666', 
        fontSize: '1.1rem',
        marginBottom: '2rem' 
      }}>
        Tell us about yourself so we can make the lessons more relevant to you.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            What is your name? *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Maria"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}
            required
            disabled={saving}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            What is your favorite hobby? *
          </label>
          <input
            type="text"
            value={formData.hobby}
            onChange={(e) => handleInputChange('hobby', e.target.value)}
            placeholder="e.g., cooking, reading, football"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}
            required
            disabled={saving}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Which country are you from? *
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="e.g., New Zealand, Brazil, Japan"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}
            required
            disabled={saving}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            What is your job?
          </label>
          <input
            type="text"
            value={formData.job}
            onChange={(e) => handleInputChange('job', e.target.value)}
            placeholder="e.g., teacher, engineer, student"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}
            disabled={saving}
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          marginBottom: '2rem' 
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="25"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
              disabled={saving}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Family Size
            </label>
            <input
              type="number"
              value={formData.family_size}
              onChange={(e) => handleInputChange('family_size', e.target.value)}
              placeholder="3"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
              disabled={saving}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid || saving}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1.2rem',
            fontWeight: '600',
            backgroundColor: (!isFormValid || saving) ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (!isFormValid || saving) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {saving ? 'Saving...' : 'Continue to Lesson 3 →'}
        </button>
      </form>
    </div>
  );
}