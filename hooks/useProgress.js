// hooks/useProgress.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useCourseFlow } from "./useCourseFlow";

export function useProgress() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [personalizationData, setPersonalizationData] = useState(null);
  const [personalizationStatus, setPersonalizationStatus] = useState(null); // NEW
  const [userProgress, setUserProgress] = useState([]);
  const [userStatus, setUserStatus] = useState("pending");

  const {
    courseFlow,
    getNextStep,
    getPreviousStep,
    getStepUrl,
    canAccessStep,
    loading: flowLoading,
  } = useCourseFlow();

  // Initialize auth state and load user data
  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        await loadUserData(session.user.id);
      }

      setLoading(false);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setPersonalizationData(null);
        setPersonalizationStatus(null); // NEW
        setUserProgress([]);
        setUserStatus("pending");
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user's personalization data, status, and progress
  const loadUserData = async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("profile_data, user_status")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError);
      } else if (profileData) {
        setPersonalizationData(profileData.profile_data);
        setUserStatus(profileData.user_status || "pending");
      }

      // NEW: Load personalization processing status
      await loadPersonalizationStatus(userId);

      if (profileData?.user_status === "approved") {
        const { data: progressData, error: progressError } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("course_id", "en-es")
          .order("lesson_id");

        if (progressError) {
          console.error("Error loading progress:", progressError);
        } else {
          setUserProgress(progressData || []);
        }
      }
    } catch (error) {
      console.error("Error in loadUserData:", error);
    }
  };

  // NEW: Load personalization processing status from TTS requests
  const loadPersonalizationStatus = async (userId) => {
    try {
      // Check TTS requests for lesson 7 (first lesson to use personalization)
      const { data: ttsRequests, error } = await supabase
        .from("tts_requests")
        .select("status, created_at")
        .eq("user_id", userId)
        .eq("lesson_id", 7);

      if (error) {
        console.error("Error loading personalization status:", error);
        setPersonalizationStatus("unknown");
        return;
      }

      if (!ttsRequests || ttsRequests.length === 0) {
        // No TTS requests = personalization not submitted yet
        setPersonalizationStatus("not_submitted");
        return;
      }

      // Check if all TTS requests are ready
      const allReady = ttsRequests.every(req => req.status === "completed");
      const anyPending = ttsRequests.some(req => req.status === "pending");
      const anyProcessing = ttsRequests.some(req => req.status === "processing");

      if (allReady) {
        setPersonalizationStatus("ready");
      } else if (anyProcessing) {
        setPersonalizationStatus("processing");
      } else if (anyPending) {
        setPersonalizationStatus("pending");
      } else {
        setPersonalizationStatus("unknown");
      }

      console.log("Personalization status:", {
        requestCount: ttsRequests.length,
        status: allReady ? "ready" : anyProcessing ? "processing" : "pending",
        requests: ttsRequests
      });

    } catch (error) {
      console.error("Error in loadPersonalizationStatus:", error);
      setPersonalizationStatus("unknown");
    }
  };

  // Save personalization data to Supabase
  const savePersonalizationData = async (formData) => {
    if (!user) return false;

    try {
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("user_id, user_status")
        .eq("user_id", user.id)
        .single();

      let result;

      if (existingProfile) {
        result = await supabase
          .from("user_profiles")
          .update({
            profile_data: formData,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        result = await supabase.from("user_profiles").insert({
          user_id: user.id,
          profile_data: formData,
          user_status: "pending",
        });
      }

      if (result.error) {
        console.error("Error saving personalization:", result.error);
        return false;
      }

      setPersonalizationData(formData);
      // Reset status to pending since new data was submitted
      setPersonalizationStatus("pending");
      return true;
    } catch (error) {
      console.error("Error in savePersonalizationData:", error);
      return false;
    }
  };

  // Check if user has completed personalization
  const hasPersonalized = () => {
    return !!personalizationData;
  };

  // Check if user is approved to access lessons
  const isApproved = () => {
    return userStatus === "approved";
  };

  // NEW: Check if personalized content is ready for lessons
  const isPersonalizationReady = () => {
    return personalizationStatus === "ready";
  };

  // NEW: Get personalization status info for UI
  const getPersonalizationStatusInfo = () => {
    switch (personalizationStatus) {
      case "ready":
        return {
          canProceed: true,
          message: null,
          type: "success"
        };
      case "processing":
        return {
          canProceed: false,
          message: "We're processing your personalized content. This usually takes within 24 hours.",
          type: "info"
        };
      case "pending":
        return {
          canProceed: false,
          message: "We're preparing your personalized content. This usually takes within 24 hours.",
          type: "info"
        };
      case "not_submitted":
        return {
          canProceed: true,
          message: null,
          type: "success"
        };
      default:
        return {
          canProceed: false,
          message: "Unable to check personalization status. Please try again later.",
          type: "error"
        };
    }
  };

  // Get completed steps for flow navigation
  const getCompletedSteps = () => {
    const steps = [];

    // Add completed lessons
    userProgress.forEach((progress) => {
      if (progress.status === "completed") {
        steps.push({
          type: "lesson",
          id: progress.lesson_id,
          stepNumber: progress.lesson_id, // This could be enhanced with actual step numbers
        });
      }
    });

    // Add completed personalization steps
    if (personalizationData && courseFlow) {
      // This is a simplified check - you might want to enhance this
      // to check which specific personalization forms have been completed
      const hasBasicInfo = personalizationData.name;
      if (hasBasicInfo) {
        steps.push({ type: "personalization", id: "basic" });
      }
    }

    return steps;
  };

  // Get the next accessible step using course flow
  const getNextAccessibleStep = () => {
    if (!courseFlow || !isApproved()) return null;

    const completedSteps = getCompletedSteps();
    const highestCompletedLessonId = Math.max(
      0,
      ...userProgress
        .filter((p) => p.status === "completed")
        .map((p) => p.lesson_id)
    );

    // Find the next lesson or personalization step
    const nextLessonId = highestCompletedLessonId + 1;

    // Check if there's a personalization step before the next lesson
    if (courseFlow.flow) {
      const nextStep = courseFlow.flow.find((step) => {
        if (step.type === "lesson" && step.id === nextLessonId) {
          return true;
        }
        if (step.type === "personalization") {
          // Check if this personalization step should come next
          return !completedSteps.some(
            (completed) =>
              completed.type === "personalization" && completed.id === step.id
          );
        }
        return false;
      });

      return nextStep;
    }

    return { type: "lesson", id: nextLessonId };
  };

  // Check if user can access a specific lesson (enhanced with personalization check)
  const canAccessLesson = (lessonId) => {
    if (!isApproved()) return false;

    // NEW: Special check for lesson 7 - requires personalized content to be ready
    if (lessonId === 7) {
      const statusInfo = getPersonalizationStatusInfo();
      if (!statusInfo.canProceed) {
        return false;
      }
    }

    if (!courseFlow) {
      // Fallback to old logic if flow not loaded
      const highestCompleted = Math.max(
        0,
        ...userProgress
          .filter((p) => p.status === "completed")
          .map((p) => p.lesson_id)
      );
      return lessonId <= highestCompleted + 1;
    }

    const completedSteps = getCompletedSteps();
    return canAccessStep("lesson", lessonId, completedSteps);
  };

  // Check if user can access a specific personalization form
  const canAccessPersonalization = (personalizationId) => {
    if (!isApproved()) return false;

    if (!courseFlow) return true; // Fallback

    const completedSteps = getCompletedSteps();
    return canAccessStep("personalization", personalizationId, completedSteps);
  };

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId) => {
    return userProgress.some(
      (p) => p.lesson_id === lessonId && p.status === "completed"
    );
  };

  // Mark a lesson as completed
  const completeLesson = async (lessonId) => {
    if (!user || !isApproved()) return false;

    try {
      if (isLessonCompleted(lessonId)) {
        return true;
      }

      const { error } = await supabase.from("user_progress").insert({
        user_id: user.id,
        course_id: "en-es",
        lesson_id: lessonId,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error completing lesson:", error);
        return false;
      }

      const newProgress = {
        user_id: user.id,
        course_id: "en-es",
        lesson_id: lessonId,
        status: "completed",
        completed_at: new Date().toISOString(),
      };

      setUserProgress((prev) => [...prev, newProgress]);
      return true;
    } catch (error) {
      console.error("Error in completeLesson:", error);
      return false;
    }
  };

  // Get current step info
  const getCurrentStep = () => {
    return getNextAccessibleStep();
  };

  // Navigation helpers using course flow
  const getNextStepUrl = (currentType, currentId) => {
    const nextStep = getNextStep(currentType, currentId);
    return getStepUrl(nextStep);
  };

  const getPreviousStepUrl = (currentType, currentId) => {
    const prevStep = getPreviousStep(currentType, currentId);
    return getStepUrl(prevStep);
  };

  // Refresh user data (for approval status checks and personalization status)
  const refreshUserData = async () => {
    if (!user) return;

    console.log("🔄 Refreshing user data...");
    await loadUserData(user.id);
  };

  return {
    user,
    loading: loading || flowLoading,
    personalizationData,
    personalizationStatus, // NEW
    userProgress,
    userStatus,
    savePersonalizationData,
    hasPersonalized,
    isApproved,
    isPersonalizationReady, // NEW
    getPersonalizationStatusInfo, // NEW
    canAccessLesson,
    canAccessPersonalization,
    isLessonCompleted,
    completeLesson,
    getCurrentStep,
    getNextStepUrl,
    getPreviousStepUrl,
    getCompletedSteps,
    courseFlow,
    refreshUserData,
    loadPersonalizationStatus, // NEW - expose for manual refresh
  };
}