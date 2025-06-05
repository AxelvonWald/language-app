// components/lesson/LessonCompletion.jsx
'use client'
import { useState } from 'react'

export default function LessonCompletion({ 
  currentLessonId, 
  totalLessons, 
  onComplete, 
  isCompleted = false 
}) {
  const [isCompleting, setIsCompleting] = useState(false)
  
  const lessonNumber = parseInt(currentLessonId)
  const isLastLesson = lessonNumber >= totalLessons

  const handleComplete = async () => {
    if (isCompleting || isCompleted) return
    
    setIsCompleting(true)
    
    try {
      // Call the onComplete function passed from parent
      if (onComplete) {
        await onComplete()
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="lesson-completion-section">
      <div className="completion-content">
        <h3>Lesson Progress</h3>
        
        {/* Progress indicator */}
        <div className="progress-bar">
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${(lessonNumber / totalLessons) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            {lessonNumber} of {totalLessons} lessons
          </span>
        </div>

        {/* Completion status */}
        {isCompleted ? (
          <div className="completion-status completed">
            <span className="completion-icon">✅</span>
            <span>Lesson completed!</span>
          </div>
        ) : (
          <div className="completion-status pending">
            <span className="completion-icon">⏳</span>
            <span>Ready to complete this lesson?</span>
          </div>
        )}

        {/* Action button */}
        <div className="completion-actions">
          {isCompleted ? (
            <div className="completed-actions">
              <p className="success-message">
                Great job! You've completed this lesson.
              </p>
              {!isLastLesson && (
                <p className="next-lesson-hint">
                  Click "Next Lesson" to continue your journey!
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="complete-lesson-btn"
            >
              {isCompleting ? (
                <>
                  <span className="spinner">⏳</span>
                  Completing...
                </>
              ) : (
                <>
                  <span className="btn-icon">🎯</span>
                  {isLastLesson ? 'Complete Course!' : 'Complete Lesson'}
                </>
              )}
            </button>
          )}
        </div>

        {/* Navigation hint */}
        {isCompleted && (
          <div className="navigation-hint">
            {isLastLesson ? (
              <p className="course-complete">
                🎉 Congratulations! You've completed the entire course!
              </p>
            ) : (
              <p className="next-lesson-available">
                Lesson {lessonNumber + 1} is now available!
              </p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .lesson-completion-section {
          margin-top: 2rem;
          padding: 1.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          background-color: #f9fafb;
        }

        .completion-content h3 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .progress-bar {
          margin-bottom: 1rem;
        }

        .progress-track {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background-color: #10b981;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .completion-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
        }

        .completion-status.completed {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .completion-status.pending {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .completion-icon {
          font-size: 1.25rem;
        }

        .complete-lesson-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .complete-lesson-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .complete-lesson-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .completed-actions {
          text-align: center;
        }

        .success-message {
          color: #166534;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .next-lesson-hint {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .navigation-hint {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #eff6ff;
          border-radius: 0.375rem;
          text-align: center;
        }

        .course-complete {
          color: #1d4ed8;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .next-lesson-available {
          color: #1f2937;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}