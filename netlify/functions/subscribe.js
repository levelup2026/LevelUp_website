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

  const email = (body.email || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid email address.' }) };
  }

  const submittedAt = new Date().toLocaleString('en-US', {
    timeZone: 'Africa/Cairo',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const adminMail = {
    from: `"LevelUp AI Waitlist" <${process.env.GMAIL_USER}>`,
    to:   process.env.GMAIL_USER,
    subject: '🚀 New LevelUp AI Waitlist Signup!',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;
                  background:#080810;color:#ffffff;border-radius:16px;overflow:hidden;
                  border:1px solid rgba(0,240,255,0.2);box-shadow:0 0 40px rgba(0,240,255,0.06);">
        <div style="background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(155,93,229,0.15));
                    padding:32px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <h1 style="margin:0;font-size:1.6rem;color:#00f0ff;">New Waitlist Signup 🎉</h1>
          <p style="margin:6px 0 0;color:#6b7280;font-size:0.875rem;">Someone just joined the LevelUp AI early access list.</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 8px;font-size:0.78rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;">Email Address</p>
          <div style="background:rgba(0,240,255,0.07);border:1px solid rgba(0,240,255,0.2);border-radius:10px;padding:14px 18px;font-size:1.1rem;font-weight:600;color:#ffffff;word-break:break-all;">
            ${email}
          </div>
          <p style="margin:20px 0 0;font-size:0.82rem;color:#4b5563;">📅 Submitted: ${submittedAt}</p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(255,255,255,0.02);">
          <p style="margin:0;font-size:0.75rem;color:#374151;">LevelUp AI · Automated notification · Do not reply to this email</p>
        </div>
      </div>
    `,
  };

  const userMail = {
    from: `"LevelUp AI" <${process.env.GMAIL_USER}>`,
    to:   email,
    subject: "You're on the list 🚀 — LevelUp AI",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#080810;color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,240,255,0.2);box-shadow:0 0 40px rgba(0,240,255,0.06);">
        <div style="background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(155,93,229,0.15));padding:36px 32px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
          <div style="font-size:2.5rem;margin-bottom:12px;">🎓</div>
          <h1 style="margin:0;font-size:1.8rem;color:#00f0ff;">You're on the list!</h1>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:0.95rem;">Welcome to the LevelUp AI early access community.</p>
        </div>
        <div style="padding:32px;text-align:center;">
          <p style="margin:0 0 20px;color:#d1d5db;line-height:1.7;font-size:0.95rem;">
            We're building an <strong style="color:#fff;">8-stage AI curriculum</strong> designed for your generation — structured, fast, and entirely project-based.
          </p>
          <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin:24px 0;padding:20px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.07);">
            <div style="text-align:center;"><div style="font-size:1.6rem;font-weight:700;color:#00f0ff;">8</div><div style="font-size:0.72rem;color:#6b7280;letter-spacing:.05em;">STAGES</div></div>
            <div style="text-align:center;"><div style="font-size:1.6rem;font-weight:700;color:#9b5de5;">60+</div><div style="font-size:0.72rem;color:#6b7280;letter-spacing:.05em;">HOURS</div></div>
            <div style="text-align:center;"><div style="font-size:1.6rem;font-weight:700;color:#00f0ff;">15+</div><div style="font-size:0.72rem;color:#6b7280;letter-spacing:.05em;">PROJECTS</div></div>
          </div>
          <p style="margin:0;color:#6b7280;font-size:0.85rem;line-height:1.6;">We'll notify you the moment early access opens.<br />No spam — ever. Unsubscribe anytime.</p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(255,255,255,0.02);text-align:center;">
          <p style="margin:0;font-size:0.75rem;color:#374151;">© 2026 LevelUp AI · You signed up at levelup-ai.com</p>
        </div>
      </div>
    `,
  };

  try {
    const transporter = createTransporter();
    await Promise.all([
      transporter.sendMail(adminMail),
      transporter.sendMail(userMail),
    ]);
    console.log(`[${new Date().toISOString()}] ✅ Signup: ${email}`);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Email error:`, err.message);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Failed to send email. Please try again.' }) };
  }
};
