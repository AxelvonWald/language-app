// app/lessons/[id]/page.js
"use client";
import { use } from 'react'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AudioPlayer from "@/components/lesson/AudioPlayer";
import SentenceTable from "@/components/lesson/SentenceTable";
import Section from "@/components/lesson/Section";
import LessonCompletion from "@/components/lesson/LessonCompletion";
import { useProgress } from "@/hooks/useProgress";
import { supabase } from "@/lib/supabase";
import styles from "./Lesson.module.css";

export default function LessonPage({ params }) {
  const resolvedParams = use(params)
  const router = useRouter();

  // Get data from useProgress hook
  const {
    user,
    loading,
    personalizationData,
    canAccessLesson,
    hasPersonalized,
    isLessonCompleted,
    completeLesson,
    isApproved,
    getPersonalizationStatusInfo, // NEW
    loadPersonalizationStatus, // NEW
  } = useProgress();

  // DEBUG LOGS - These should ALWAYS run
  console.log("=== LESSON PAGE DEBUG ===");
  console.log("Params:", params);
  console.log("User:", user?.id);
  console.log("Loading:", loading);
  console.log("Personalization data:", personalizationData);
  console.log("Has personalized:", hasPersonalized());
  console.log("========================");

  const [lessonData, setLessonData] = useState(null);
  const [sentencesDB, setSentencesDB] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [personalizationBlocked, setPersonalizationBlocked] = useState(false); // NEW

  const paddedId = params.id.padStart(3, "0");
  const lessonId = parseInt(params.id);

  // Load lesson data
  useEffect(() => {
    console.log("Loading lesson data for:", paddedId);

    const loadLessonData = async () => {
      try {
        // Dynamic imports for lesson data
        const [lessonModule, sentencesModule] = await Promise.all([
          import(`../../../data/courses/en-es/lessons/lesson-${paddedId}.json`),
          import(`../../../data/courses/en-es/sentences.json`),
        ]);

        console.log("Lesson module loaded:", lessonModule.default);
        console.log("Sentences loaded:", sentencesModule.default);

        setLessonData(lessonModule.default);
        setSentencesDB(sentencesModule.default);
      } catch (error) {
        console.error("Error loading lesson data:", error);
        // Handle missing lesson - redirect to lesson 1 or show error
        router.push("/lessons/1");
      } finally {
        setLoadingLesson(false);
      }
    };

    loadLessonData();
  }, [paddedId, router]);

  // Check access and redirect if necessary
  useEffect(() => {
    console.log(
      "Access check - loading:",
      loading,
      "loadingLesson:",
      loadingLesson
    );

    if (loading || loadingLesson) return;

    // Redirect to login if no user
    if (!user) {
      console.log("No user, redirecting to login");
      router.push("/login");
      return;
    }

    // Redirect to pending page if not approved
    if (!isApproved()) {
      console.log("User not approved, redirecting to pending");
      router.push("/pending");
      return;
    }

    // NEW: Special handling for lesson 7 - check personalization status
    if (lessonId === 7) {
      const statusInfo = getPersonalizationStatusInfo();
      console.log("Lesson 7 personalization status:", statusInfo);
      
      if (!statusInfo.canProceed) {
        console.log("Lesson 7 blocked - personalization not ready");
        setPersonalizationBlocked(true);
        return; // Don't redirect, show the blocked state
      }
    }

    // Check if user can access this lesson
    if (!canAccessLesson(lessonId)) {
      console.log("Cannot access lesson", lessonId, "redirecting to lesson 1");
      // Redirect to their current lesson or lesson 1
      router.push("/lessons/1");
      return;
    }

    // Special case: redirect to personalization after lesson 5
    if (lessonId === 6 && !hasPersonalized()) {
      console.log("Lesson 6 but not personalized, redirecting to /personalize");
      router.push("/personalize");
      return;
    }

    // Clear any previous blocked state if we get here
    setPersonalizationBlocked(false);
  }, [
    user,
    loading,
    loadingLesson,
    lessonId,
    canAccessLesson,
    hasPersonalized,
    isApproved,
    getPersonalizationStatusInfo, // NEW
    router,
  ]);

  // NEW: Handle refresh button for personalization status
  const handleRefreshStatus = async () => {
    console.log("Refreshing personalization status...");
    await loadPersonalizationStatus(user.id);
    
    // Re-check if we can proceed now
    const statusInfo = getPersonalizationStatusInfo();
    if (statusInfo.canProceed) {
      setPersonalizationBlocked(false);
    }
  };

  // Dynamic audio path builder
  const getAudioPath = (fileName) => {
    return `/audio/en-es/lesson-${paddedId}/${fileName}`;
  };

  // Helper to get sentences for a section with personalization
  const getSectionSentences = (sectionKey) => {
    console.log("Getting section sentences for:", sectionKey);
    console.log(
      "PersonalizationData in getSectionSentences:",
      personalizationData
    );

    if (!lessonData || !sentencesDB) return [];

    const section = lessonData.sections[sectionKey];
    return section.sentence_ids.map((id) => {
      const sentence = sentencesDB[id.toString()];

      console.log(`Processing sentence ${id}:`, sentence);

      // Apply personalization if available
      if (personalizationData && sentence.variables) {
        console.log(
          "Applying personalization to sentence:",
          sentence.id,
          sentence.variables
        );

        let personalizedTarget = sentence.target;
        let personalizedNative = sentence.native;

        // Replace variables with personalized data
        sentence.variables.forEach((variable) => {
          const value = personalizationData[variable];
          console.log(`Replacing {${variable}} with:`, value);

          if (value) {
            const placeholder = `{${variable}}`;
            personalizedTarget = personalizedTarget.replace(placeholder, value);
            personalizedNative = personalizedNative.replace(placeholder, value);
          }
        });

        console.log("Personalized result:", {
          personalizedTarget,
          personalizedNative,
        });

        return {
          ...sentence,
          target: personalizedTarget,
          native: personalizedNative,
        };
      }

      console.log("No personalization applied to sentence:", sentence.id);
      return sentence;
    });
  };

  // Handle lesson completion
  const handleLessonComplete = async () => {
    const success = await completeLesson(lessonId);
    if (success) {
      // Navigate to next lesson or completion page
      if (lessonId < 32) {
        router.push(`/lessons/${lessonId + 1}`);
      } else {
        // Course completed!
        router.push("/course-complete");
      }
    }
  };

  // Loading states
  if (loading || loadingLesson) {
    console.log("Showing loading state");
    return (
      <div className={styles.lessonContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <div>Loading lesson...</div>
        </div>
      </div>
    );
  }

  // NEW: Personalization blocked state for lesson 7
  if (personalizationBlocked && lessonId === 7) {
    const statusInfo = getPersonalizationStatusInfo();
    
    return (
      <div className={styles.lessonContainer}>
        <div className={styles.personalizationBlocked}>
          <div className={styles.blockedIcon}>⏳</div>
          <h2>Lesson 7: Personalized Content in Progress</h2>
          <div className={styles.blockedMessage}>
            <p>{statusInfo.message}</p>
            <p>We will notify you here when your personalized lesson is ready!</p>
          </div>
          
          <div className={styles.blockedActions}>
            <button 
              onClick={handleRefreshStatus}
              className={styles.refreshButton}
            >
              🔄 Check Status
            </button>
            <button 
              onClick={() => router.push('/lessons')}
              className={styles.backButton}
            >
              ← Back to Lessons
            </button>
          </div>
          
          <div className={styles.blockedInfo}>
            <h3>Why the wait?</h3>
            <p>
              Lesson 7 uses your personal information to create custom content and audio. 
              This gives you a much more engaging learning experience, but requires some 
              processing time to ensure everything is perfect!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No lesson data
  if (!lessonData || !sentencesDB) {
    console.log("No lesson data found");
    return (
      <div className={styles.lessonContainer}>
        <div className={styles.error}>
          <h2>Lesson not found</h2>
          <p>The requested lesson could not be loaded.</p>
        </div>
      </div>
    );
  }

  console.log("Rendering lesson page with data");

  return (
    <div className={styles.lessonContainer}>
      <div className={styles.lessonHeader}>
        <h1 className={styles.lessonTitle}>
          Lesson {params.id}: {lessonData.title}
        </h1>
        {isLessonCompleted(lessonId) && (
          <div className={styles.completionBadge}>✓ Completed</div>
        )}
      </div>

      {/* Section 1: Listen and Read */}
      <Section
        title="Listen and Read"
        instruction={lessonData.sections.listenRead.instruction}
        audio={getAudioPath(lessonData.sections.listenRead.audio)}
        sentences={getSectionSentences("listenRead")}
        showColumns={["native", "target"]}
        className={styles.section}
        lessonId={lessonId}
        sectionName="listenRead"
        userId={user?.id}
      />

      {/* Section 2: Listen and Repeat */}
      <Section
        title="Listen and Repeat"
        instruction={lessonData.sections.listenRepeat.instruction}
        audio={getAudioPath(lessonData.sections.listenRepeat.audio)}
        sentences={getSectionSentences("listenRepeat")}
        showColumns={["native", "target"]}
        className={styles.section}
        lessonId={lessonId}
        sectionName="listenRepeat"
        userId={user?.id}
      />

      {/* Section 3: Write */}
      <Section
        title="Write"
        instruction={lessonData.sections.write.instruction}
        sentences={getSectionSentences("write")}
        showColumns={["native", "target"]}
        className={styles.section}
        lessonId={lessonId}
        sectionName="write"
        userId={user?.id}
      />

      {/* Section 4: Translation - Only native language */}
      <Section
        title="Translation"
        instruction={lessonData.sections.translation.instruction}
        audio={getAudioPath(lessonData.sections.translation.audio)}
        sentences={getSectionSentences("translation")}
        showColumns={["native"]}
        className={styles.section}
        lessonId={lessonId}
        sectionName="translation"
        userId={user?.id}
      />

      {/* Section 5: Rest of Day */}
      <Section
        title="Rest of the Day"
        instruction={lessonData.sections.restOfDay.instruction}
        sentences={getSectionSentences("restOfDay")}
        //showColumns={["native", "target"]}
        className={styles.section}
        lessonId={lessonId}
        sectionName="restOfDay"
        userId={user?.id}
      />

      {/* Lesson Completion */}
      <LessonCompletion
        currentLessonId={params.id}
        totalLessons={32}
        onComplete={handleLessonComplete}
        isCompleted={isLessonCompleted(lessonId)}
      />
    </div>
  );
}