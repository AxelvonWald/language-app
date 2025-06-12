// components/layout/Header.jsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "./Header.module.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        await calculateCurrentLesson(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await calculateCurrentLesson(session.user.id);
      } else {
        setCurrentLesson(1);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const calculateCurrentLesson = async (userId) => {
    try {
      // Get user's highest completed lesson
      const { data: progress } = await supabase
        .from("user_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("course_id", "en-es")
        .order("lesson_id", { ascending: false })
        .limit(1);

      if (progress && progress.length > 0) {
        // Get the highest completed lesson
        const lastCompletedLesson = progress[0].lesson_id;
        
        // Load course flow to determine next step
        try {
          const courseFlowModule = await import('../../data/courses/en-es/course-flow.json');
          const courseFlow = courseFlowModule.default;
          
          // Find the step after the last completed lesson
          const lastCompletedStepIndex = courseFlow.flow.findIndex(
            step => step.type === 'lesson' && step.id === lastCompletedLesson
          );
          
          if (lastCompletedStepIndex !== -1 && lastCompletedStepIndex < courseFlow.flow.length - 1) {
            const nextStep = courseFlow.flow[lastCompletedStepIndex + 1];
            
            if (nextStep.type === 'lesson') {
              // Next step is a lesson
              setCurrentLesson(nextStep.id);
            } else if (nextStep.type === 'personalization') {
              // Next step is personalization, so current lesson is still the last completed one
              // But we could redirect to personalization instead - for now, stay on last lesson
              setCurrentLesson(lastCompletedLesson);
            }
          } else {
            // User has completed all lessons, show the last lesson
            setCurrentLesson(Math.min(lastCompletedLesson, 40)); // Cap at 40 lessons
          }
        } catch (error) {
          console.error('Error loading course flow:', error);
          // Fallback: next lesson after highest completed
          setCurrentLesson(Math.min(lastCompletedLesson + 1, 40));
        }
      } else {
        // No progress yet, start with lesson 1
        setCurrentLesson(1);
      }
    } catch (error) {
      console.error('Error calculating current lesson:', error);
      setCurrentLesson(1); // Fallback to lesson 1
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <img
              src="/logo.svg"
              alt="Iona Language App"
              className={styles.logoImage}
            />
            Iona Language App
          </Link>
          <nav className={styles.nav}>
            <div className={styles.loading}>Loading...</div>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <img
            src="/logo.svg"
            alt="Iona Language App"
            className={styles.logoImage}
          />
          Iona Language App
        </Link>
        <nav className={styles.nav}>
          {user ? (
            <>
              <Link
                href={`/lessons/${currentLesson}`}
                className={styles.navLink}
              >
                Lessons
              </Link>
              <Link href="/account" className={styles.navLink}>
                Account
              </Link>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.navLink}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}