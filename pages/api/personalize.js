// pages/api/personalize.js
// Enhanced to create TTS requests when user personalizes

import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Need to add this to env vars
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, profileData, formId } = req.body; // ADD formId parameter

    if (!userId || !profileData || !formId) {
      return res.status(400).json({ error: "Missing userId, profileData, or formId" });
    }

    // 1. Save personalization data (handle existing records properly)
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("user_status, id")
      .eq("user_id", userId)
      .single();

    let profileError;

    if (existingProfile) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({
          profile_data: profileData,
          user_status: existingProfile.user_status, // Preserve existing status
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      profileError = error;
    } else {
      // Insert new record
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

    // 2. Generate TTS requests for lessons that use this form's data
    const ttsRequestsCreated = await generateTTSRequests(userId, profileData, formId);

    // 3. Send admin notification about TTS requests
    if (ttsRequestsCreated > 0) {
      await sendTTSNotification(userId, ttsRequestsCreated);
    }

    res.status(200).json({
      success: true,
      message: "Personalization saved and TTS requests created",
      ttsRequestsCreated,
    });
  } catch (error) {
    console.error("Error in personalization API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function generateTTSRequests(userId, profileData, formId) {
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
    
    console.log(`Processing TTS for form "${formId}", lessons:`, lessonsToProcess);

    // Load sentences database
    const sentencesModule = await import(
      `../../data/courses/en-es/sentences.json`
    );
    const sentences = sentencesModule.default;

    for (const lessonId of lessonsToProcess) {
      try {
        // Dynamic import for lesson data
        const lessonModule = await import(
          `../../data/courses/en-es/lessons/lesson-${lessonId
            .toString()
            .padStart(3, "0")}.json`
        );
        const lesson = lessonModule.default;

        // Group sections by their audio files to avoid duplicates
        const audioFileGroups = {};

        const sectionsWithAudio = [
          { name: "listenRead", repeatCount: 1 },
          { name: "listenRepeat", repeatCount: 5 },
          { name: "translation", repeatCount: 1 },
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
            };
          }

          audioFileGroups[audioFile].sections.push({
            name: section.name,
            repeatCount: section.repeatCount,
          });
        }

        // Create one TTS request per unique audio file
        for (const [audioFile, group] of Object.entries(audioFileGroups)) {
          // Determine repeat count - use the maximum from all sections using this file
          const maxRepeatCount = Math.max(
            ...group.sections.map((s) => s.repeatCount)
          );

          // Build complete text for this audio file
          const audioSentences = [];
          const nativeSentences = []; // Add native language tracking

          for (const sentenceId of group.sentenceIds) {
            const sentence = sentences[sentenceId.toString()];
            if (!sentence) continue;

            // Personalize both target (Spanish) and native (English) sentences
            let finalTargetText = sentence.target;
            let finalNativeText =
              sentence.native || sentence.fallback_native || "";

            if (sentence.variables && sentence.variables.length > 0) {
              sentence.variables.forEach((variable) => {
                const value = profileData[variable];
                if (value) {
                  finalTargetText = finalTargetText.replace(
                    `{${variable}}`,
                    value
                  );
                  finalNativeText = finalNativeText.replace(
                    `{${variable}}`,
                    value
                  );
                }
              });
            }

            // Add to sentences (repeated based on max repeat count for this file)
            for (let i = 0; i < maxRepeatCount; i++) {
              audioSentences.push(finalTargetText);
              nativeSentences.push(finalNativeText);
            }
          }

          // Create one TTS request per audio file
          if (audioSentences.length > 0) {
            const combinedTargetText = audioSentences.join(". ");
            const combinedNativeText = nativeSentences.join(". ");

            requests.push({
              user_id: userId,
              lesson_id: lessonId,
              section_name: group.sections.map((s) => s.name).join(","),
              audio_filename: audioFile,
              combined_target_text: combinedTargetText,
              combined_native_text: combinedNativeText,
              sentence_count: group.sentenceIds.length,
              repeat_count: maxRepeatCount,
            });
          }
        }
      } catch (lessonError) {
        console.log(
          `Lesson ${lessonId} not found, skipping:`,
          lessonError.message
        );
      }
    }

    // Batch insert TTS requests
    if (requests.length > 0) {
      const { data, error } = await supabaseAdmin.from("tts_requests").insert(
        requests.map((req) => ({
          user_id: req.user_id,
          lesson_id: req.lesson_id,
          section_name: req.section_name,
          audio_filename: req.audio_filename,
          personalized_text: req.combined_target_text,
          native_text: req.combined_native_text, // Add native text column

          sentence_count: req.sentence_count,
        }))
      );

      if (error) {
        console.error("Error inserting TTS requests:", error);
        return 0;
      }

      console.log(
        `Created ${requests.length} TTS requests for user ${userId}, form ${formId}, lessons: ${lessonsToProcess.join(', ')}`
      );
      return requests.length;
    }

    return 0;
  } catch (error) {
    console.error("Error generating TTS requests:", error);
    return 0;
  }
}

async function sendTTSNotification(userId, requestCount) {
  try {
    // Get user email for the notification
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);

    const emailData = {
      from: "onboarding@resend.dev",
      to: "njyoung@disroot.org", // Your email
      subject: `🎙️ TTS Requests Ready for Review: ${user.user?.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">TTS Requests Created! 🎙️</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>User:</strong> ${user.user?.email}</p>
            <p><strong>TTS Requests Created:</strong> ${requestCount}</p>
            <p><strong>Status:</strong> Pending Review</p>
          </div>
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; border-left: 4px solid #0288d1;">
            <h3 style="margin-top: 0; color: #01579b;">🎯 Action Required</h3>
            <p>Please review and approve TTS requests:</p>
            <ol>
              <li>Go to the TTS Review page</li>
              <li>Review personalized sentences</li>
              <li>Approve quality requests</li>
              <li>TTS generation will begin automatically</li>
            </ol>
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
    // Don't fail the whole process if email fails
  }
}