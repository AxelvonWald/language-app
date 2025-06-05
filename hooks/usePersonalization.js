"use client";

// hooks/usePersonalization.js
import { useState, useEffect } from 'react';

export default function usePersonalization() {
  const [personalization, setPersonalization] = useState(null);

  useEffect(() => {
    // Load personalization data from localStorage
    const saved = localStorage.getItem('userPersonalization');
    if (saved) {
      setPersonalization(JSON.parse(saved));
    }
  }, []);

  // Function to apply personalization to a sentence
  const personalizeSentence = (sentence) => {
    if (!personalization || !sentence.variables) {
      // Return fallback if no personalization or no variables
      return {
        target: sentence.fallback_target || sentence.target,
        native: sentence.fallback_native || sentence.native
      };
    }

    let personalizedTarget = sentence.target;
    let personalizedNative = sentence.native;

    // Replace each variable with user's data
    sentence.variables.forEach(variable => {
      const value = personalization[variable];
      if (value) {
        personalizedTarget = personalizedTarget.replace(`{${variable}}`, value);
        personalizedNative = personalizedNative.replace(`{${variable}}`, value);
      }
    });

    return {
      target: personalizedTarget,
      native: personalizedNative
    };
  };

  return {
    personalization,
    personalizeSentence,
    hasPersonalization: !!personalization
  };
}