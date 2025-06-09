// app/personalize/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import styles from "./PersonalizePage.module.css";

export default function PersonalizePage({ params }) {
  const router = useRouter();
  const {
    user,
    loading,
    personalizationData,
    savePersonalizationData,
    isApproved,
  } = useProgress();
  const [formConfig, setFormConfig] = useState(null);
  const [courseFlow, setCourseFlow] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const personalizationId = params.id;

// Load form configuration and course flow
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        console.log('🔍 Loading configs for personalizationId:', personalizationId)
        
        const [formsModule, flowModule] = await Promise.all([
          import('../../../data/courses/en-es/personalization-forms.json'),
          import('../../../data/courses/en-es/course-flow.json')
        ])
        
        const forms = formsModule.default
        const flow = flowModule.default
        
        console.log('📝 Loaded forms object:', forms)
        console.log('🔍 Looking for form with ID:', personalizationId)
        console.log('📋 Available form IDs:', Object.keys(forms))
        
        if (!forms[personalizationId]) {
          console.error('❌ Personalization form not found:', personalizationId)
          console.error('Available forms:', Object.keys(forms))
          router.push('/lessons/1')
          return
        }
        
        const selectedForm = forms[personalizationId]
        console.log('✅ Found form config:', selectedForm)
        console.log('📝 Form fields:', selectedForm.fields)
        
        setFormConfig(selectedForm)
        setCourseFlow(flow)
        
        // Initialize form data with existing values
        if (personalizationData) {
          const initialData = {}
          selectedForm.fields.forEach(field => {
            if (personalizationData[field.id] !== undefined) {
              initialData[field.id] = personalizationData[field.id]
            }
          })
          console.log('🔄 Initialized form data:', initialData)
          setFormData(initialData)
        }
        
      } catch (error) {
        console.error('💥 Error loading form config:', error)
        router.push('/lessons/1')
      } finally {
        setLoadingConfig(false)
      }
    }

    loadConfigs()
  }, [personalizationId, personalizationData, router])

  // Load form configuration and course flow
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const [formsModule, flowModule] = await Promise.all([
          import("../../../data/courses/en-es/personalization-forms.json"),
          import("../../../data/courses/en-es/course-flow.json"),
        ]);

        const forms = formsModule.default;
        const flow = flowModule.default;

        if (!forms[personalizationId]) {
          console.error("Personalization form not found:", personalizationId);
          router.push("/lessons/1");
          return;
        }

        setFormConfig(forms[personalizationId]);
        setCourseFlow(flow);

        // Initialize form data with existing values
        if (personalizationData) {
          const initialData = {};
          forms[personalizationId].fields.forEach((field) => {
            if (personalizationData[field.id] !== undefined) {
              initialData[field.id] = personalizationData[field.id];
            }
          });
          setFormData(initialData);
        }
      } catch (error) {
        console.error("Error loading form config:", error);
        router.push("/lessons/1");
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfigs();
  }, [personalizationId, personalizationData, router]);

  // Check authentication and approval
  useEffect(() => {
    if (!loading && !loadingConfig) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (!isApproved()) {
        router.push("/pending");
        return;
      }
    }
  }, [user, loading, loadingConfig, isApproved, router]);

  const handleInputChange = (fieldId, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user || !formConfig || !courseFlow) return
    
    setSaving(true)
    
    try {
      // Merge new data with existing personalization data
      const updatedData = {
        ...personalizationData,
        ...formData
      }
      
      // Call the enhanced API that creates TTS requests and sends notifications
      const response = await fetch('/api/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profileData: updatedData
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // No need to call savePersonalizationData again - the API already saved it
        
        // Show success message if TTS requests were created
        if (result.ttsRequestsCreated > 0) {
          alert(`Success! ${result.ttsRequestsCreated} personalized audio requests created. You'll receive these after admin approval.`)
        }
        
        // Find next step in course flow
        const currentStepIndex = courseFlow.flow.findIndex(
          step => step.type === 'personalization' && step.id === personalizationId
        )
        
        if (currentStepIndex !== -1 && currentStepIndex < courseFlow.flow.length - 1) {
          const nextStep = courseFlow.flow[currentStepIndex + 1]
          
          if (nextStep.type === 'lesson') {
            router.push(`/lessons/${nextStep.id}`)
          } else if (nextStep.type === 'personalization') {
            router.push(`/personalize/${nextStep.id}`)
          }
        } else {
          // Fallback to lessons if flow is complete
          router.push('/lessons/1')
        }
      } else {
        console.error('API Error:', result)
        alert('Error saving your information. Please try again.')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving your information. Please try again.')
    } finally {
      setSaving(false)
    }
  };

  const isFormValid = () => {
    if (!formConfig) return false;

    return formConfig.fields.every((field) => {
      if (!field.required) return true;
      const value = formData[field.id];
      return value !== undefined && value !== "" && value !== null;
    });
  };

  const renderField = (field) => {
    const value = formData[field.id] || "";

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={saving}
            className={styles.textInput}
            maxLength={field.validation?.maxLength}
            minLength={field.validation?.minLength}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={saving}
            className={styles.numberInput}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            disabled={saving}
            className={styles.selectInput}
          >
            <option value="">Choose an option...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <div className={styles.multiselectContainer}>
            {field.options?.map((option) => (
              <label key={option.value} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(value) ? value.includes(option.value) : false
                  }
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleInputChange(field.id, [
                        ...currentValues,
                        option.value,
                      ]);
                    } else {
                      handleInputChange(
                        field.id,
                        currentValues.filter((v) => v !== option.value)
                      );
                    }
                  }}
                  disabled={saving}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Loading states
  if (loading || loadingConfig) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div>Loading personalization form...</div>
      </div>
    );
  }

  if (!user || !formConfig) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <div className={styles.icon}>{formConfig.icon}</div>
          <h1 className={styles.title}>{formConfig.title}</h1>
          <p className={styles.description}>{formConfig.description}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {formConfig.fields.map((field) => (
            <div key={field.id} className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {field.label}
                {field.required && <span className={styles.required}>*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

          <button
            type="submit"
            disabled={!isFormValid() || saving}
            className={styles.submitButton}
          >
            {saving ? "Saving..." : "Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
