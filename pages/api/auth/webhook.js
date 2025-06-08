// pages/api/auth/webhook.js
// ⚠️ IMPORTANT: This file must be in /pages/api/auth/webhook.js (not /app/api/)

export default async function handler(req, res) {
  // Log all incoming requests for debugging
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('========================');

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, table, record } = req.body;
    
    console.log('Parsed webhook data:', { type, table, record });

    // Only handle user signup events
    if (type === 'INSERT' && table === 'users') {
      console.log('✅ Processing signup notification for:', record?.email);
      await sendSignupNotification(record);
      console.log('✅ Notification sent successfully');
    } else {
      console.log('ℹ️ Ignoring webhook - not a user INSERT event');
    }

    res.status(200).json({ received: true, processed: type === 'INSERT' && table === 'users' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook failed', message: error.message });
  }
}

async function sendSignupNotification(user) {
  const emailData = {
    from: 'onboarding@resend.dev', // ✅ Use Resend's verified domain
    to: 'nathan@disroot.org', // ❗ UPDATE THIS to your actual email
    subject: `🎓 New Language App Signup: ${user.email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New User Signup! 🎉</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>User ID:</strong> ${user.id}</p>
          <p><strong>Signup Time:</strong> ${new Date(user.created_at).toLocaleString()}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">⚡ Action Required</h3>
          <p>Please approve this user in your Supabase dashboard:</p>
          <ol>
            <li>Go to Supabase → Authentication → Users</li>
            <li>Find user: <strong>${user.email}</strong></li>
            <li>Set <code>email_confirmed_at</code> to current timestamp</li>
            <li>User can then access the app</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://supabase.com/dashboard" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            👉 Open Supabase Dashboard
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated notification from your Language Learning App.
        </p>
      </div>
    `
  };

  await sendEmail(emailData);
}

async function sendEmail(emailData) {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Resend API error:', error);
    throw new Error(`Failed to send email: ${error}`);
  }

  const result = await response.json();
  console.log('✅ Email sent successfully:', result);
  return result;
}