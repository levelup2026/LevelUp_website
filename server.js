'use strict';

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the landing page and its assets (logo, etc.) from this folder
app.use(express.static(path.join(__dirname)));

// ── Gmail transporter ─────────────────────────────────────────
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass || pass === 'your_16_char_app_password_here') {
    throw new Error(
      'Gmail credentials not configured. ' +
      'Open .env and set GMAIL_USER and GMAIL_APP_PASSWORD.'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// ── POST /subscribe ───────────────────────────────────────────
app.post('/subscribe', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();

  // Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  const submittedAt = new Date().toLocaleString('en-US', {
    timeZone: 'Africa/Cairo',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // ── Email to YOU (the admin) ──────────────────────────────
  const adminMail = {
    from: `"LevelUp AI Waitlist" <${process.env.GMAIL_USER}>`,
    to:   process.env.GMAIL_USER,
    subject: '🚀 New LevelUp AI Waitlist Signup!',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;
                  background:#080810;color:#ffffff;border-radius:16px;overflow:hidden;
                  border:1px solid rgba(0,240,255,0.2);box-shadow:0 0 40px rgba(0,240,255,0.06);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(155,93,229,0.15));
                    padding:32px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <h1 style="margin:0;font-size:1.6rem;color:#00f0ff;letter-spacing:-0.02em;">
            New Waitlist Signup 🎉
          </h1>
          <p style="margin:6px 0 0;color:#6b7280;font-size:0.875rem;">
            Someone just joined the LevelUp AI early access list.
          </p>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;">
          <p style="margin:0 0 8px;font-size:0.78rem;font-weight:600;letter-spacing:.1em;
                    text-transform:uppercase;color:#6b7280;">Email Address</p>
          <div style="background:rgba(0,240,255,0.07);border:1px solid rgba(0,240,255,0.2);
                      border-radius:10px;padding:14px 18px;font-size:1.1rem;
                      font-weight:600;color:#ffffff;word-break:break-all;">
            ${email}
          </div>

          <p style="margin:20px 0 0;font-size:0.82rem;color:#4b5563;">
            📅 Submitted: ${submittedAt}
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);
                    background:rgba(255,255,255,0.02);">
          <p style="margin:0;font-size:0.75rem;color:#374151;">
            LevelUp AI · Automated notification · Do not reply to this email
          </p>
        </div>
      </div>
    `,
  };

  // ── Confirmation email to the subscriber ──────────────────
  const userMail = {
    from: `"LevelUp AI" <${process.env.GMAIL_USER}>`,
    to:   email,
    subject: "You're on the list 🚀 — LevelUp AI",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;
                  background:#080810;color:#ffffff;border-radius:16px;overflow:hidden;
                  border:1px solid rgba(0,240,255,0.2);box-shadow:0 0 40px rgba(0,240,255,0.06);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(155,93,229,0.15));
                    padding:36px 32px 28px;text-align:center;
                    border-bottom:1px solid rgba(255,255,255,0.07);">
          <div style="font-size:2.5rem;margin-bottom:12px;">🎓</div>
          <h1 style="margin:0;font-size:1.8rem;color:#00f0ff;letter-spacing:-0.02em;">
            You're on the list!
          </h1>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:0.95rem;">
            Welcome to the LevelUp AI early access community.
          </p>
        </div>

        <!-- Body -->
        <div style="padding:32px;text-align:center;">
          <p style="margin:0 0 20px;color:#d1d5db;line-height:1.7;font-size:0.95rem;">
            We're building an <strong style="color:#fff;">8-stage AI curriculum</strong>
            designed for your generation — structured, fast, and entirely project-based.
          </p>

          <!-- Stats row -->
          <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;
                      margin:24px 0;padding:20px;background:rgba(255,255,255,0.03);
                      border-radius:12px;border:1px solid rgba(255,255,255,0.07);">
            <div style="text-align:center;">
              <div style="font-size:1.6rem;font-weight:700;color:#00f0ff;">8</div>
              <div style="font-size:0.72rem;color:#6b7280;letter-spacing:.05em;">STAGES</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:1.6rem;font-weight:700;color:#9b5de5;">60+</div>
              <div style="font-size:0.72rem;color:#6b7280;letter-spacing:.05em;">HOURS</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:1.6rem;font-weight:700;color:#00f0ff;">15+</div>
              <div style="font-size:0.72rem;color:#6b7280;letter-spacing:.05em;">PROJECTS</div>
            </div>
          </div>

          <p style="margin:0;color:#6b7280;font-size:0.85rem;line-height:1.6;">
            We'll notify you the moment early access opens.<br />
            No spam — ever. Unsubscribe anytime.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);
                    background:rgba(255,255,255,0.02);text-align:center;">
          <p style="margin:0;font-size:0.75rem;color:#374151;">
            © 2026 LevelUp AI · You signed up at levelup-ai.com
          </p>
        </div>
      </div>
    `,
  };

  // ── Send both emails ──────────────────────────────────────
  try {
    const transporter = createTransporter();
    await Promise.all([
      transporter.sendMail(adminMail),
      transporter.sendMail(userMail),
    ]);

    console.log(`[${new Date().toISOString()}] ✅ Signup: ${email}`);
    return res.json({ success: true });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Email error:`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
  }
});

// ── POST /register (Handles file uploads) ───────────────────────
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/register', upload.single('receipt'), async (req, res) => {
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
          <p style="margin:8px 0 0;color:#9ca3af;">Thank you for applying to LevelUp AI.</p>
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

    console.log(`[${new Date().toISOString()}] ✅ Registration: ${email}`);
    return res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Email error:`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
  }
});

// ── POST /comment (Handles comment form submission) ──────────────
app.post('/comment', async (req, res) => {
  const { name, email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ success: false, message: 'Missing email or message.' });
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
    return res.json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Email error (Comment):`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});

// ── Fallback: serve index.html for any unmatched route ────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log(`  ║  🚀 LevelUp AI server ready              ║`);
  console.log(`  ║  → http://localhost:${PORT}                 ║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');

  if (!process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === 'your_16_char_app_password_here') {
    console.warn('  ⚠️  WARNING: Gmail not configured.');
    console.warn('     Open .env and set GMAIL_APP_PASSWORD.');
    console.warn('     See .env for instructions on getting an App Password.\n');
  } else {
    console.log(`  📧 Emails will be sent to: ${process.env.GMAIL_USER}\n`);
  }
});
