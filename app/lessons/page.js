// app/lessons/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import Link from "next/link";
import styles from "./LessonsOverview.module.css";

export default function LessonsOverview() {
  const router = useRouter();
  const { user, loading, isApproved } = useProgress();
  const [courseFlow, setCourseFlow] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    0: true // Expand first section by default
  });

  // Sequential lesson groups (8 groups of 5 lessons each)
  const lessonGroups = [
    { title: "Foundation", subtitle: "Getting Started", lessons: [1, 2, 3, 4, 5] },
    { title: "Building Blocks", subtitle: "Core Concepts", lessons: [6, 7, 8, 9, 10] },
    { title: "Expanding Vocabulary", subtitle: "New Words & Phrases", lessons: [11, 12, 13, 14, 15] },
    { title: "Growing Confidence", subtitle: "Practice & Application", lessons: [16, 17, 18, 19, 20] },
    { title: "Developing Skills", subtitle: "Intermediate Level", lessons: [21, 22, 23, 24, 25] },
    { title: "Advanced Practice", subtitle: "Complex Structures", lessons: [26, 27, 28, 29, 30] },
    { title: "Mastering Concepts", subtitle: "Fluency Building", lessons: [31, 32, 33, 34, 35] },
    { title: "Course Completion", subtitle: "Final Mastery", lessons: [36, 37, 38, 39, 40] }
  ];

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load course flow
        const courseFlowModule = await import('../../data/courses/en-es/course-flow.json');
        setCourseFlow(courseFlowModule.default);

        // Get user's progress from Supabase
        const { supabase } = await import('../../lib/supabase');
        const { data: progress, error } = await supabase
          .from('user_progress')
          .select('lesson_id, completed_at, status')
          .eq('user_id', user.id)
          .eq('course_id', 'en-es')
          .order('lesson_id', { ascending: true });

        if (error) {
          console.error('Error loading progress:', error);
        } else {
          setUserProgress(progress || []);
          
          // Calculate current lesson (highest completed + 1)
          if (progress && progress.length > 0) {
            const lastCompleted = Math.max(...progress.map(p => p.lesson_id));
            setCurrentLesson(Math.min(lastCompleted + 1, 40));
          }
        }
      } catch (error) {
        console.error('Error loading lesson data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user && isApproved()) {
      loadData();
    } else if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && !isApproved()) {
      router.push('/pending');
    }
  }, [user, loading, isApproved, router]);

  const toggleSection = (sectionIndex) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };

  const getLessonStatus = (lessonId) => {
    const isCompleted = userProgress.some(p => p.lesson_id === lessonId);
    const isCurrent = lessonId === currentLesson;
    const isLocked = lessonId > currentLesson;

    return { isCompleted, isCurrent, isLocked };
  };

  const getLessonTitle = (lessonId) => {
    // You could load this from your lesson files, but for now using placeholder
    const titles = {
      1: "Greetings & Basic Politeness",
      2: "Basic Nouns - People & Family", 
      3: "Ser Foundation",
      4: "Basic Nouns - Places & Objects",
      5: "Essential Introductions",
      // Add more titles as needed, or load dynamically
    };
    return titles[lessonId] || `Lesson ${lessonId}`;
  };

  const renderLesson = (lessonId) => {
    const { isCompleted, isCurrent, isLocked } = getLessonStatus(lessonId);
    const title = getLessonTitle(lessonId);

    return (
      <div
        key={lessonId}
        className={`${styles.lessonItem} ${
          isCompleted ? styles.completed : 
          isCurrent ? styles.current : 
          isLocked ? styles.locked : styles.available
        }`}
      >
        {isLocked ? (
          <div className={styles.lessonContent}>
            <div className={styles.lessonNumber}>🔒 {lessonId}</div>
            <div className={styles.lessonInfo}>
              <div className={styles.lessonTitle}>{title}</div>
              <div className={styles.lessonStatus}>Complete previous lessons first</div>
            </div>
          </div>
        ) : (
          <Link href={`/lessons/${lessonId}`} className={styles.lessonLink}>
            <div className={styles.lessonContent}>
              <div className={styles.lessonNumber}>
                {isCompleted ? '✅' : isCurrent ? '🎯' : '⭕'} {lessonId}
              </div>
              <div className={styles.lessonInfo}>
                <div className={styles.lessonTitle}>{title}</div>
                <div className={styles.lessonStatus}>
                  {isCompleted ? 'Completed' : isCurrent ? 'Ready to start' : 'Available'}
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    );
  };

  const renderSection = (group, index) => {
    const isExpanded = expandedSections[index];
    const completedCount = group.lessons.filter(lessonId => 
      getLessonStatus(lessonId).isCompleted
    ).length;

    return (
      <div key={index} className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection(index)}
        >
          <div className={styles.sectionInfo}>
            <h3 className={styles.sectionTitle}>
              📚 Lessons {group.lessons[0]}-{group.lessons[group.lessons.length - 1]}: {group.title}
            </h3>
            <p className={styles.sectionSubtitle}>{group.subtitle}</p>
            <div className={styles.sectionProgress}>
              {completedCount}/{group.lessons.length} completed
            </div>
          </div>
          <div className={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </div>
        </button>
        
        {isExpanded && (
          <div className={styles.sectionContent}>
            {group.lessons.map(lessonId => renderLesson(lessonId))}
          </div>
        )}
      </div>
    );
  };

  // Loading states
  if (loading || loadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div>Loading your progress...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const totalCompleted = userProgress.length;
  const progressPercentage = Math.round((totalCompleted / 40) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Spanish Learning Journey</h1>
        <p className={styles.subtitle}>
          Track your progress through our 40-lesson A1 Spanish course
        </p>
        
        <div className={styles.statsCard}>
          <div className={styles.progressStats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{totalCompleted}</div>
              <div className={styles.statLabel}>Completed</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{40 - totalCompleted}</div>
              <div className={styles.statLabel}>Remaining</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{progressPercentage}%</div>
              <div className={styles.statLabel}>Progress</div>
            </div>
          </div>
          
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {currentLesson <= 40 && (
          <div className={styles.continueSection}>
            <Link href={`/lessons/${currentLesson}`} className={styles.continueButton}>
              🎯 Continue Learning - Lesson {currentLesson}
            </Link>
          </div>
        )}
      </div>

      <div className={styles.lessonsGrid}>
        {lessonGroups.map((group, index) => renderSection(group, index))}
      </div>
    </div>
  );
}