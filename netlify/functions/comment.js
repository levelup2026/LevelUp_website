'use strict';

const nodemailer = require('nodemailer');

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Gmail credentials not configured.');
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method not allowed.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid request body.' }) };
  }

  const { name, email, message } = body;

  if (!email || !message) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing email or message.' }) };
  }

  const adminMail = {
    from: `"LevelUp AI Contact" <${process.env.GMAIL_USER}>`,
    to:   process.env.GMAIL_USER,
    subject: `💬 New Message/Comment from ${name || email}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080810;color:#fff;padding:20px;border:1px solid #333;border-radius:10px;">
        <h2 style="color:#00f0ff;">New Message</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;text-align:left;">
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">Name</th><td style="padding:10px;border-bottom:1px solid #333;">${name || '-'}</td></tr>
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">Email</th><td style="padding:10px;border-bottom:1px solid #333;">${email || '-'}</td></tr>
        </table>
        <h3 style="color:#9b5de5;margin-top:20px;">Message:</h3>
        <div style="background:#111;padding:15px;border-radius:8px;border:1px solid #333;white-space:pre-wrap;">${message}</div>
        <p style="margin-top:20px;color:#888;">Submitted: ${new Date().toISOString()}</p>
      </div>
    `,
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(adminMail);
    console.log(`[${new Date().toISOString()}] ✅ Comment received from: ${email}`);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Email error:`, err.message);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Failed to send message. Please try again.' }) };
  }
};
