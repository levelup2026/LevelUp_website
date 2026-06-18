'use strict';

const nodemailer = require('nodemailer');
const Busboy     = require('busboy');

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Gmail credentials not configured.');
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

/** Parse multipart/form-data from a Netlify Function event. */
function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let fileBuffer   = null;
    let fileName     = null;
    let fileMimeType = null;

    const busboy = Busboy({
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type'],
      },
    });

    busboy.on('file', (_fieldname, file, info) => {
      fileName     = info.filename;
      fileMimeType = info.mimeType;
      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end',  () => { fileBuffer = Buffer.concat(chunks); });
    });

    busboy.on('field', (name, value) => { fields[name] = value; });
    busboy.on('finish', () => resolve({ fields, fileBuffer, fileName, fileMimeType }));
    busboy.on('error', reject);

    // Netlify may base64-encode the body for binary payloads
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body || '', 'utf8');

    busboy.end(rawBody);
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method not allowed.' }) };
  }

  let fields, fileBuffer, fileName;
  try {
    ({ fields, fileBuffer, fileName } = await parseMultipart(event));
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Failed to parse form data.' }) };
  }

  const { name, email, phone, university, national_id, dob } = fields;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid email address.' }) };
  }

  const submittedAt = new Date().toLocaleString('en-US', {
    timeZone: 'Africa/Cairo',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const attachments = [];
  if (fileBuffer && fileName) {
    attachments.push({ filename: fileName, content: fileBuffer });
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
          <tr><th style="padding:10px;border-bottom:1px solid #333;color:#9b5de5;">Receipt Uploaded?</th><td style="padding:10px;border-bottom:1px solid #333;">${fileBuffer ? '✅ Yes (See Attachments)' : '❌ No'}</td></tr>
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
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Email error:`, err.message);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Failed to send email. Please try again.' }) };
  }
};
