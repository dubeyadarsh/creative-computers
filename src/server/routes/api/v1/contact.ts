import { defineEventHandler, readBody, getMethod, createError } from 'h3';
import { supabase } from '../../../utils/supabase';

interface ContactBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  }

  const body = (await readBody(event)) as ContactBody;
  const name = body.name?.trim();
  const email = body.email?.trim();
  const subject = body.subject?.trim() || 'New contact enquiry';
  const message = body.message?.trim();

  if (!name || !email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Name, email and message are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email address.' });
  }

  // 1) Persist to Supabase so nothing is lost even if email delivery fails.
  const { error: dbError } = await supabase
    .from('contact_messages')
    .insert({ name, email, subject, message });
  if (dbError) {
    // Non-fatal for the user, but surface for debugging.
    console.error('[contact] failed to store message:', dbError.message);
  }

  // 2) Best-effort email via SMTP (only if configured).
  const to = process.env['CONTACT_TO_EMAIL'] || 'helpdesk@creativecomputersmariahu.in';
  const host = process.env['SMTP_HOST'];
  const user = process.env['SMTP_USER'];
  const pass = process.env['SMTP_PASS'];

  let emailed = false;
  if (host && user && pass) {
    try {
      // Indirect specifier + @vite-ignore so the bundler doesn't try to resolve
      // nodemailer at build time (it's an optional dependency for email).
      const moduleName = 'nodemailer';
      const nodemailer = await import(/* @vite-ignore */ moduleName).then((m: any) => m.default ?? m);
      const port = parseInt(process.env['SMTP_PORT'] || '465', 10);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        // Some networks (corporate proxy / antivirus) intercept TLS and present a
        // certificate whose root isn't in the trust store, which breaks verification.
        // Relaxing verification lets mail send in those environments.
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"Creative Computers" <${user}>`,
        to,
        replyTo: email,
        subject: `[Contact] ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
        html: `
          <h2>New contact enquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${message}</p>
        `,
      });
      emailed = true;
    } catch (err: any) {
      console.error('[contact] email send failed:', err?.message);
    }
  }

  return { status: 'success', message: 'Message received', emailed };
});
