"use client";

// app/personalize/page.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PersonalizePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    hobby: '',
    country: '',
    job: '',
    age: '',
    family_size: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save to localStorage for now (replace with Supabase later)
    localStorage.setItem('userPersonalization', JSON.stringify(formData));
    
    // Redirect to lesson 3
    router.push('/lessons/3');
  };

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
        Let's Personalize Your Learning!
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
            What's your name? *
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
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            What's your favorite hobby? *
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
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            What's your job?
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
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1.2rem',
            fontWeight: '600',
            backgroundColor: isFormValid ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isFormValid ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease'
          }}
        >
          Continue to Lesson 3 →
        </button>
      </form>
    </div>
  );
}