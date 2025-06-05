"use client";

// components/lesson/LessonCompletion.jsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LessonCompletion({ currentLessonId, totalLessons = 32 }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();
  
  const nextLessonId = parseInt(currentLessonId) + 1;
  const hasNextLesson = nextLessonId <= totalLessons;
  
  const handleNextLesson = () => {
    // Redirect to personalization after lesson 1
    if (currentLessonId === '2') {
      router.push('/personalize-01');
      return;
    }
    
    if (hasNextLesson) {
      router.push(`/lessons/${nextLessonId}`);
    }
  };
  
  return (
    <div style={{
      marginTop: "3rem",
      padding: "2rem",
      border: "2px solid #e0e0e0",
      borderRadius: "12px",
      backgroundColor: "#f8f9fa",
      textAlign: "center"
    }}>
      <h3 style={{ color: "#333", marginBottom: "1.5rem" }}>
        Lesson Complete?
      </h3>
      
      <div style={{ marginBottom: "2rem" }}>
        <label style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          fontSize: "1.1rem",
          cursor: "pointer"
        }}>
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
            style={{
              width: "20px",
              height: "20px",
              accentColor: "#007bff"
            }}
          />
          I have completed this lesson
        </label>
      </div>
      
      {hasNextLesson ? (
        <button
          onClick={handleNextLesson}
          disabled={!isCompleted}
          style={{
            padding: "12px 24px",
            fontSize: "1.1rem",
            fontWeight: "600",
            backgroundColor: isCompleted ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isCompleted ? "pointer" : "not-allowed",
            transition: "all 0.2s ease"
          }}
        >
          Next Lesson →
        </button>
      ) : (
        <div style={{
          padding: "12px 24px",
          fontSize: "1.1rem",
          fontWeight: "600",
          backgroundColor: "#28a745",
          color: "white",
          borderRadius: "8px",
          display: "inline-block"
        }}>
          🎉 Course Complete! 🎉
        </div>
      )}
    </div>
  );
}