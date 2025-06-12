// pages/api/personalize.js
// Enhanced with hybrid translation and clean sentence storage

import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Predefined translation dictionary
const TRANSLATION_DICTIONARY = {
  // Countries
  'United States': 'Estados Unidos',
  'United Kingdom': 'Reino Unido', 
  'Canada': 'Canadá',
  'Australia': 'Australia',
  'New Zealand': 'Nueva Zelanda',
  'Ireland': 'Irlanda',
  'South Africa': 'Sudáfrica',
  'Other country': 'otro país',
  
  // Housing
  'A house': 'una casa',
  'An apartment': 'un apartamento', 
  'A flat': 'un piso',
  'A dorm/residence': 'una residencia',
  'A room': 'una habitación',
  
  // Family
  'A small family': 'una familia pequeña',
  'A medium family': 'una familia mediana', 
  'A large family': 'una familia grande',
  'I live alone': 'vivo solo',
  
  // Hobbies
  'Music': 'la música',
  'Reading books': 'leer libros',
  'Watching movies': 'ver películas',
  'Exercising': 'hacer ejercicio',
  'Cooking': 'cocinar',
  'Traveling': 'viajar',
  'Video games': 'los videojuegos',
  'Photography': 'la fotografía',
  
  // Foods
  'Pizza': 'pizza',
  'Pasta': 'pasta', 
  'Salad': 'ensalada',
  'Chicken': 'pollo',
  'Fish': 'pescado',
  'Rice': 'arroz',
  'Bread': 'pan',
  'Fruit': 'fruta',
  'Vegetables': 'la verdura',
  'Seafood': 'los mariscos',
  'Spicy food': 'la comida picante',
  'Mushrooms': 'los hongos',
  'Cheese': 'el queso',
  'Olives': 'las aceitunas',
  
  // Activities
  'Walking': 'caminar',
  'Running': 'correr',
  'Swimming': 'nadar',
  'Dancing': 'bailar',
  'Studying': 'estudiar',
  'Gardening': 'trabajar en el jardín',
  'Shopping': 'ir de compras',
  'Talking with friends': 'hablar con amigos',
  
  // Settings
  'The city': 'la ciudad',
  'The countryside': 'el campo',
  'The beach': 'la playa',
  'The mountains': 'las montañas',
  'My neighborhood': 'mi barrio',
  
  // Moods  
  'Happy': 'feliz',
  'Calm': 'tranquilo',
  'Busy': 'ocupado',
  'Excited': 'emocionado',
  'Relaxed': 'relajado',
  'Motivated': 'motivado',
  
  // Learning styles
  'Slowly and carefully': 'despacio',
  'Quickly': 'rápido',
  'With examples': 'con ejemplos',
  'With practice': 'con práctica',
  'By listening': 'escuchando',
  
  // Goals
  'For work': 'por trabajo',
  'For travel': 'para viajar',
  'For fun': 'por diversión',
  'To speak with family': 'para hablar con familia',
  'For studies': 'para estudiar',
  'For culture': 'por cultura',
  
  // Future plans
  'Visit Spain': 'visitar España',
  'Live in a Spanish-speaking country': 'vivir en un país hispano',
  'Work in Spanish': 'trabajar en español',
  'Make Spanish-speaking friends': 'hacer amigos hispanos',
  'Read books in Spanish': 'leer libros en español',
  'Watch movies in Spanish': 'ver películas en español',
  
  // Destinations
  'Spain': 'España',
  'Mexico': 'México',
  'Argentina': 'Argentina',
  'Colombia': 'Colombia',
  'Peru': 'Perú',
  'Costa Rica': 'Costa Rica',
  'Chile': 'Chile',
  'Ecuador': 'Ecuador'
};

async function translateWithHybrid(text, fieldType = 'general') {
  // For names and numbers, use as-is (no translation needed)
  if (fieldType === 'name' || fieldType === 'story_character' || fieldType === 'age') {
    return {
      translation: text,
      source: 'passthrough',
      needsReview: false
    };
  }
  
  // First try predefined dictionary (exact match)
  if (TRANSLATION_DICTIONARY[text]) {
    return {
      translation: TRANSLATION_DICTIONARY[text],
      source: 'predefined',
      needsReview: false
    };
  }
  
  // For numbers, use as-is
  if (!isNaN(text) && !isNaN(parseFloat(text))) {
    return {
      translation: text,
      source: 'number',
      needsReview: false
    };
  }
  
  // Try Azure Translator for unknown entries
  try {
    if (!process.env.AZURE_TRANSLATOR_KEY) {
      // No Azure key available, flag for manual review
      return {
        translation: `[TRANSLATE: ${text}]`,
        source: 'manual_needed',
        needsReview: true
      };
    }
    
    const response = await fetch('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=es', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATOR_REGION || 'global',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ text }])
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        translation: result[0]?.translations[0]?.text || `[TRANSLATE: ${text}]`,
        source: 'azure',
        needsReview: true // Always review Azure translations
      };
    }
  } catch (error) {
    console.error('Azure translation error:', error);
  }
  
  // Fallback: flag for manual translation
  return {
    translation: `[TRANSLATE: ${text}]`,
    source: 'manual_needed', 
    needsReview: true
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, profileData, formId } = req.body;

    if (!userId || !profileData || !formId) {
      return res.status(400).json({ error: "Missing userId, profileData, or formId" });
    }

    // 1. Save personalization data
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("user_status, id")
      .eq("user_id", userId)
      .single();

    let profileError;

    if (existingProfile) {
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({
          profile_data: profileData,
          user_status: existingProfile.user_status,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      profileError = error;
    } else {
      const { error } = await supabaseAdmin.from("user_profiles").insert({
        user_id: userId,
        profile_data: profileData,
        user_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      profileError = error;
    }

    if (profileError) {
      console.error("Error saving profile:", profileError);
      return res.status(500).json({ error: "Failed to save profile" });
    }

    // 2. Generate clean TTS requests with hybrid translation
    const ttsRequestsCreated = await generateCleanTTSRequests(userId, profileData, formId);

    // 3. Send admin notification if requests created
    if (ttsRequestsCreated > 0) {
      await sendTTSNotification(userId, ttsRequestsCreated);
    }

    res.status(200).json({
      success: true,
      message: "Personalization saved and clean TTS requests created",
      ttsRequestsCreated,
    });
  } catch (error) {
    console.error("Error in personalization API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function generateCleanTTSRequests(userId, profileData, formId) {
  const requests = [];

  try {
    // Load personalization forms to determine which lessons need TTS
    const formsModule = await import(
      `../../data/courses/en-es/personalization-forms.json`
    );
    const forms = formsModule.default;
    
    if (!forms[formId]) {
      console.error(`Form ${formId} not found in personalization forms`);
      return 0;
    }
    
    const formConfig = forms[formId];
    const lessonsToProcess = formConfig.usedInLessons || [];
    
    console.log(`Processing clean TTS for form "${formId}", lessons:`, lessonsToProcess);

    // Load sentences database
    const sentencesModule = await import(
      `../../data/courses/en-es/sentences.json`
    );
    const sentences = sentencesModule.default;

    for (const lessonId of lessonsToProcess) {
      try {
        // Load lesson data
        const lessonModule = await import(
          `../../data/courses/en-es/lessons/lesson-${lessonId
            .toString()
            .padStart(3, "0")}.json`
        );
        const lesson = lessonModule.default;

        // Group sections by their audio files
        const audioFileGroups = {};

        const sectionsWithAudio = [
          { name: "listenRead", trackType: "bilingual" },
          { name: "listenRepeat", trackType: "repetition" },
          { name: "translation", trackType: "bilingual" }
        ];

        // Group sections by audio filename
        for (const section of sectionsWithAudio) {
          const sectionData = lesson.sections[section.name];
          if (!sectionData || !sectionData.sentence_ids || !sectionData.audio)
            continue;

          const audioFile = sectionData.audio;

          if (!audioFileGroups[audioFile]) {
            audioFileGroups[audioFile] = {
              filename: audioFile,
              sections: [],
              sentenceIds: sectionData.sentence_ids,
              trackType: section.trackType
            };
          }

          audioFileGroups[audioFile].sections.push(section.name);
        }

        // Create one clean TTS request per unique audio file
        for (const [audioFile, group] of Object.entries(audioFileGroups)) {
          // Build clean sentence arrays (no repetition)
          const cleanTargetSentences = [];
          const cleanNativeSentences = [];
          const translationFlags = [];

          for (const sentenceId of group.sentenceIds) {
            const sentence = sentences[sentenceId.toString()];
            if (!sentence) continue;

            // Start with base sentences
            let targetText = sentence.target;
            let nativeText = sentence.native || sentence.fallback_native || "";
            let hasCustomTranslation = false;

            // Apply personalization with hybrid translation
            if (sentence.variables && sentence.variables.length > 0) {
              for (const variable of sentence.variables) {
                const userValue = profileData[variable];
                if (userValue) {
                  // Determine field type for translation strategy
                  const fieldType = variable === 'name' || variable === 'story_character' ? variable : 'general';
                  
                  // Translate the user value
                  const translationResult = await translateWithHybrid(userValue, fieldType);
                  
                  // Replace in target sentence
                  targetText = targetText.replace(`{${variable}}`, translationResult.translation);
                  
                  // Replace in native sentence (keep original user input)
                  nativeText = nativeText.replace(`{${variable}}`, userValue);
                  
                  // Track if needs review
                  if (translationResult.needsReview) {
                    hasCustomTranslation = true;
                    translationFlags.push(`${variable}: ${translationResult.source}`);
                  }
                }
              }
            }

            cleanTargetSentences.push(targetText.replace(/\.$/, '')); // Remove trailing period
            cleanNativeSentences.push(nativeText.replace(/\.$/, ''));
          }

          // Create clean TTS request
          if (cleanTargetSentences.length > 0) {
            requests.push({
              user_id: userId,
              lesson_id: lessonId,
              section_name: group.sections.join(","),
              audio_filename: audioFile,
              track_type: group.trackType, // NEW: store track type
              clean_target_sentences: cleanTargetSentences, // NEW: array of clean sentences
              clean_native_sentences: cleanNativeSentences,
              sentence_count: group.sentenceIds.length,
              translation_flags: translationFlags.length > 0 ? translationFlags.join('; ') : null,
              needs_review: translationFlags.length > 0
            });
          }
        }
      } catch (lessonError) {
        console.log(`Lesson ${lessonId} not found, skipping:`, lessonError.message);
      }
    }

    // Insert clean TTS requests
    if (requests.length > 0) {
      const { data, error } = await supabaseAdmin.from("tts_requests").insert(
        requests.map((req) => ({
          user_id: req.user_id,
          lesson_id: req.lesson_id,
          section_name: req.section_name,
          audio_filename: req.audio_filename,
          track_type: req.track_type,
          // NEW: Store as JSON arrays
          clean_target_sentences: req.clean_target_sentences,
          clean_native_sentences: req.clean_native_sentences,
          // OLD: Also fill legacy columns for backward compatibility
          personalized_text: req.clean_target_sentences.join('. '),
          native_text: req.clean_native_sentences.join('. '),
          sentence_count: req.sentence_count,
          translation_flags: req.translation_flags,
          status: req.needs_review ? 'pending' : 'approved', // Auto-approve if no custom translations
          notes: req.translation_flags ? `Translation sources: ${req.translation_flags}` : null
        }))
      );

      if (error) {
        console.error("Error inserting clean TTS requests:", error);
        return 0;
      }

      console.log(`Created ${requests.length} clean TTS requests for user ${userId}, form ${formId}`);
      return requests.length;
    }

    return 0;
  } catch (error) {
    console.error("Error generating clean TTS requests:", error);
    return 0;
  }
}

async function sendTTSNotification(userId, requestCount) {
  try {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);

    const emailData = {
      from: "onboarding@resend.dev",
      to: "njyoung@disroot.org",
      subject: `🎙️ Clean TTS Requests Ready: ${user.user?.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Clean TTS Requests Created! 🎙️</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>User:</strong> ${user.user?.email}</p>
            <p><strong>TTS Requests Created:</strong> ${requestCount}</p>
            <p><strong>Format:</strong> Clean sentences (no repetition)</p>
            <p><strong>Status:</strong> Ready for review/generation</p>
          </div>
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; border-left: 4px solid #0288d1;">
            <h3 style="margin-top: 0; color: #01579b;">🎯 New Workflow</h3>
            <p>Requests now contain clean individual sentences. TTS GUI will handle repetition automatically based on track type.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://your-app.vercel.app/admin/tts-review" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
               👉 Review TTS Requests
            </a>
          </div>
        </div>
      `,
    };

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });
  } catch (error) {
    console.error("Error sending TTS notification:", error);
  }
}