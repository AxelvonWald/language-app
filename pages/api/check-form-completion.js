// pages/api/check-form-completion.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, formId, lessonIds } = req.body;

    if (!userId || !formId || !lessonIds || !Array.isArray(lessonIds)) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Check if TTS requests exist for any of the lessons this form affects
    const { data: existingRequests, error } = await supabaseAdmin
      .from("tts_requests")
      .select("id, lesson_id, status")
      .eq("user_id", userId)
      .in("lesson_id", lessonIds);

    if (error) {
      console.error("Error checking form completion:", error);
      return res.status(500).json({ error: "Database error" });
    }

    // If any TTS requests exist for these lessons, the form has been completed
    const alreadyCompleted = existingRequests && existingRequests.length > 0;

    if (alreadyCompleted) {
      console.log(`Form ${formId} already completed for user ${userId}. Found ${existingRequests.length} existing TTS requests.`);
    }

    res.status(200).json({
      alreadyCompleted,
      existingRequestsCount: existingRequests ? existingRequests.length : 0,
      formId,
      lessonIds
    });

  } catch (error) {
    console.error("Error in check-form-completion API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}