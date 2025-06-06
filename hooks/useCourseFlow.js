// hooks/useCourseFlow.js
"use client";

import { useState, useEffect } from 'react';

export function useCourseFlow() {
  const [courseFlow, setCourseFlow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseFlow = async () => {
      try {
        const flowModule = await import('../data/courses/en-es/course-flow.json');
        setCourseFlow(flowModule.default);
      } catch (error) {
        console.error('Error loading course flow:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourseFlow();
  }, []);

  // Find current step in flow
  const findCurrentStep = (type, id) => {
    if (!courseFlow) return null;
    
    return courseFlow.flow.find(step => 
      step.type === type && step.id.toString() === id.toString()
    );
  };

  // Get next step in the flow
  const getNextStep = (type, id) => {
    if (!courseFlow) return null;
    
    const currentStepIndex = courseFlow.flow.findIndex(step => 
      step.type === type && step.id.toString() === id.toString()
    );
    
    if (currentStepIndex === -1 || currentStepIndex >= courseFlow.flow.length - 1) {
      return null;
    }
    
    return courseFlow.flow[currentStepIndex + 1];
  };

  // Get previous step in the flow
  const getPreviousStep = (type, id) => {
    if (!courseFlow) return null;
    
    const currentStepIndex = courseFlow.flow.findIndex(step => 
      step.type === type && step.id.toString() === id.toString()
    );
    
    if (currentStepIndex <= 0) {
      return null;
    }
    
    return courseFlow.flow[currentStepIndex - 1];
  };

  // Generate navigation URL for a step
  const getStepUrl = (step) => {
    if (!step) return null;
    
    if (step.type === 'lesson') {
      return `/lessons/${step.id}`;
    } else if (step.type === 'personalization') {
      return `/personalize/${step.id}`;
    }
    
    return null;
  };

  // Check if user can access a specific step
  const canAccessStep = (targetType, targetId, completedSteps = []) => {
    if (!courseFlow) return false;
    
    const targetStepIndex = courseFlow.flow.findIndex(step => 
      step.type === targetType && step.id.toString() === targetId.toString()
    );
    
    if (targetStepIndex === -1) return false;
    
    // User can access any step up to their highest completed step + 1
    const highestCompletedIndex = Math.max(
      -1,
      ...completedSteps.map(completed => {
        return courseFlow.flow.findIndex(step => 
          step.type === completed.type && step.id.toString() === completed.id.toString()
        );
      })
    );
    
    return targetStepIndex <= highestCompletedIndex + 1;
  };

  // Get all personalization steps completed so far
  const getCompletedPersonalizationSteps = (personalizationData) => {
    if (!courseFlow || !personalizationData) return [];
    
    return courseFlow.flow
      .filter(step => step.type === 'personalization')
      .filter(step => {
        // Check if this personalization step has been completed
        // by looking for any data that would be collected in this step
        const formsConfig = getPersonalizationFormsConfig();
        if (!formsConfig || !formsConfig[step.id]) return false;
        
        // If any required field from this form is filled, consider it completed
        const form = formsConfig[step.id];
        return form.fields.some(field => 
          field.required && personalizationData[field.id] !== undefined
        );
      });
  };

  // Get progress percentage
  const getProgressPercentage = (completedSteps = []) => {
    if (!courseFlow) return 0;
    
    const totalSteps = courseFlow.totalSteps || courseFlow.flow.length;
    return Math.round((completedSteps.length / totalSteps) * 100);
  };

  // Helper to get personalization forms config (you might want to move this)
  const getPersonalizationFormsConfig = () => {
    // This would ideally be loaded from the forms config
    // For now, return null and handle in the calling component
    return null;
  };

  return {
    courseFlow,
    loading,
    findCurrentStep,
    getNextStep,
    getPreviousStep,
    getStepUrl,
    canAccessStep,
    getCompletedPersonalizationSteps,
    getProgressPercentage
  };
}