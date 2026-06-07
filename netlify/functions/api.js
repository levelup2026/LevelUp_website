'use strict';

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const multer     = require('multer');
const serverless = require('serverless-http');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Gmail transporter ─────────────────────────────────────────
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass || pass === 'your_16_char_app_password_here') {
    throw new Error(
      'Gmail credentials not configured. ' +
      'Set GMAIL_USER and GMAIL_APP_PASSWORD in Netlify environment variables.'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// ── POST /subscribe ───────────────────────────────────────────
app.post('/.netlify/functions/api/subscribe', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
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
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#080810;color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,240,255,0.2);box-shadow:0 0 40px rgba(0,240,255,0.06);">
        <div style="background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(155,93,229,0.15));padding:32px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <h1 style="margin:0;font-size:1.6rem;color:#00f0ff;letter-spacing:-0.02em;">New Waitlist Signup 🎉</h1>
          <p style="margin:6px 0 0;color:#6b7280;font-size:0.875rem;">Someone just joined the LevelUp AI early access list.</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 8px;font-size:0.78rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;">Email Address</p>
          <div style="background:rgba(0,240,255,0.07);border:1px solid rgba(0,240,255,0.2);border-radius:10px;padding:14px 18px;font-size:1.1rem;font-weight:600;color:#ffffff;word-break:break-all;">
            ${email}
          </div>
          <p style="margin:20px 0 0;font-size:0.82rem;color:#4b5563;">📅 Submitted: ${submittedAt}</p>
        </div>
      </div>
    `,
  };

  const userMail = {
    from: `"LevelUp AI" <${process.env.GMAIL_USER}>`,
    to:   email,
    subject: "You're on the list 🚀 — LevelUp AI",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#080810;color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,240,255,0.2);">
        <div style="background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(155,93,229,0.15));padding:36px 32px 28px;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:12px;">🎓</div>
          <h1 style="margin:0;font-size:1.8rem;color:#00f0ff;">You're on the list!</h1>
        </div>
        <div style="padding:32px;text-align:center;">
          <p style="margin:0 0 20px;color:#d1d5db;line-height:1.7;font-size:0.95rem;">
            We'll notify you the moment early access opens. No spam — ever.
          </p>
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
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
  }
});

// ── POST /register (Handles file uploads) ───────────────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/.netlify/functions/api/register', upload.single('receipt'), async (req, res) => {
  const { name, email, phone, university, national_id, dob } = req.body;
  const file = req.file;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  const submittedAt = new Date().toLocaleString('en-US', {
    timeZone: 'Africa/Cairo',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const attachments = [];
  if (file) {
    attachments.push({
      filename: file.originalname,
      content: file.buffer,
    });
  }

  const adminMail = {
    from: `"LevelUp AI Registration" <${process.env.GMAIL_USER}>`,
    to:   process.env.GMAIL_USER,
    subject: `📝 New Registration: ${name || email}`,
    attachments,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080810;color:#fff;padding:20px;border:1px solid #333;border-radius:10px;">
        <h2 style="color:#00f0ff;">New Course Registration</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;text-align:left;">
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">Name</th><td style="padding:10px;border-bottom:1px solid #333;">${name || '-'}</td></tr>
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">Email</th><td style="padding:10px;border-bottom:1px solid #333;">${email || '-'}</td></tr>
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">Phone</th><td style="padding:10px;border-bottom:1px solid #333;">${phone || '-'}</td></tr>
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">University</th><td style="padding:10px;border-bottom:1px solid #333;">${university || '-'}</td></tr>
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">National ID</th><td style="padding:10px;border-bottom:1px solid #333;">${national_id || '-'}</td></tr>
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">DOB</th><td style="padding:10px;border-bottom:1px solid #333;">${dob || '-'}</td></tr>
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">Receipt Uploaded?</th><td style="padding:10px;border-bottom:1px solid #333;">${file ? '✅ Yes (See Attachments)' : '❌ No'}</td></tr>
        </table>
        <p style="margin-top:20px;color:#888;">Submitted: ${submittedAt}</p>
      </div>
    `,
  };

  const userMail = {
    from: `"LevelUp AI" <${process.env.GMAIL_USER}>`,
    to:   email,
    subject: "Registration Received 🚀 — LevelUp AI",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#080810;color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,240,255,0.2);">
        <div style="background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(155,93,229,0.15));padding:36px 32px 28px;text-align:center;">
          <h1 style="margin:0;font-size:1.8rem;color:#00f0ff;">Registration Received!</h1>
        </div>
        <div style="padding:32px;text-align:center;">
          <p style="margin:0 0 20px;color:#d1d5db;line-height:1.7;">
            We are currently reviewing your payment receipt and details. We will confirm your seat within 24 hours via email.
          </p>
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
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
  }
});

// Wrap the Express app for Serverless
module.exports.handler = serverless(app, {
  binary: ['multipart/form-data']
});
