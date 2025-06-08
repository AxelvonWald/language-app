// pages/api/personalize.js
// Enhanced to create TTS requests when user personalizes

import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, profileData } = req.body;

    if (!userId || !profileData) {
      return res.status(400).json({ error: 'Missing userId or profileData' });
    }

    // 1. Save personalization data
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ 
        user_id: userId, 
        profile_data: profileData,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error saving profile:', profileError);
      return res.status(500).json({ error: 'Failed to save profile' });
    }

    // 2. Generate TTS requests for all lessons
    const ttsRequestsCreated = await generateTTSRequests(userId, profileData);

    // 3. Send admin notification about TTS requests
    await sendTTSNotification(userId, ttsRequestsCreated);

    res.status(200).json({ 
      success: true, 
      message: 'Personalization saved and TTS requests created',
      ttsRequestsCreated 
    });

  } catch (error) {
    console.error('Error in personalization API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateTTSRequests(userId, profileData) {
  const requests = [];
  
  try {
    // Load all lessons and sentences
    for (let lessonId = 1; lessonId <= 32; lessonId++) {
      try {
        // Dynamic import for lesson data
        const lessonModule = await import(`../../data/courses/en-es/lessons/lesson-${lessonId.toString().padStart(3, '0')}.json`);
        const sentencesModule = await import(`../../data/courses/en-es/sentences.json`);
        
        const lesson = lessonModule.default;
        const sentences = sentencesModule.default;

        // Process each section that has audio
        const sectionsWithAudio = ['listenRead', 'listenRepeat', 'translation'];
        
        for (const sectionName of sectionsWithAudio) {
          const section = lesson.sections[sectionName];
          if (!section || !section.sentence_ids) continue;

          // Process each sentence in the section
          for (const sentenceId of section.sentence_ids) {
            const sentence = sentences[sentenceId.toString()];
            if (!sentence || !sentence.variables || sentence.variables.length === 0) continue;

            // Personalize the sentence
            let personalizedText = sentence.target; // Spanish text
            let hasPersonalization = false;

            sentence.variables.forEach(variable => {
              const value = profileData[variable];
              if (value) {
                personalizedText = personalizedText.replace(`{${variable}}`, value);
                hasPersonalization = true;
              }
            });

            // Only create TTS request if sentence was actually personalized
            if (hasPersonalization) {
              requests.push({
                user_id: userId,
                lesson_id: lessonId,
                sentence_id: sentenceId,
                personalized_text: personalizedText
              });
            }
          }
        }
      } catch (lessonError) {
        console.error(`Error processing lesson ${lessonId}:`, lessonError);
        // Continue with other lessons
      }
    }

    // Batch insert TTS requests
    if (requests.length > 0) {
      const { data, error } = await supabase
        .from('tts_requests')
        .insert(requests);

      if (error) {
        console.error('Error inserting TTS requests:', error);
        return 0;
      }

      console.log(`Created ${requests.length} TTS requests for user ${userId}`);
      return requests.length;
    }

    return 0;
  } catch (error) {
    console.error('Error generating TTS requests:', error);
    return 0;
  }
}

async function sendTTSNotification(userId, requestCount) {
  try {
    // Get user email for the notification
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    
    const emailData = {
      from: 'onboarding@resend.dev',
      to: 'njyoung@disroot.org', // Your email
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
      `
    };

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

  } catch (error) {
    console.error('Error sending TTS notification:', error);
    // Don't fail the whole process if email fails
  }
}