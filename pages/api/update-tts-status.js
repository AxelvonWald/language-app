// pages/api/update-tts-status.js
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, lessonId, status, audioFilename } = req.body;

    // Validate required fields
    if (!userId || !lessonId || !status) {
      return res.status(400).json({ 
        error: "Missing required fields: userId, lessonId, status" 
      });
    }

    // Validate status value
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Also update completed_at if status is completed
    const updateData = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Build query conditions
    let query = supabaseAdmin
      .from("tts_requests")
      .update(updateData)
      .eq("user_id", userId)
      .eq("lesson_id", lessonId);

    // Add audio filename filter if provided
    if (audioFilename) {
      query = query.eq("audio_filename", audioFilename);
    }

    // Also update completed_at if status is completed
    if (status === 'completed') {
      query = query.update({ 
        status,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error updating TTS status:", error);
      return res.status(500).json({ error: "Failed to update TTS status" });
    }

    console.log(`Updated TTS status for user ${userId}, lesson ${lessonId} to ${status}`);

    res.status(200).json({
      success: true,
      message: `TTS status updated to ${status}`,
      userId,
      lessonId,
      status
    });

  } catch (error) {
    console.error("Error in update-tts-status API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Helper function to update all TTS requests for a user to completed
export async function markUserTTSCompleted(userId, lessonIds = [7]) {
  try {
    const updateData = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let query = supabaseAdmin
      .from("tts_requests")
      .update(updateData)
      .eq("user_id", userId);

    if (lessonIds.length > 0) {
      query = query.in("lesson_id", lessonIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error marking TTS completed:", error);
      return false;
    }

    console.log(`Marked TTS completed for user ${userId}, lessons:`, lessonIds);
    return true;

  } catch (error) {
    console.error("Error in markUserTTSCompleted:", error);
    return false;
  }
}