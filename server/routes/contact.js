const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

console.log('CONTACT ROUTE LOADED');
console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || '❌ NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✓ SET' : '❌ NOT SET');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ message: 'Name and message are required' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Borngreat International Schools" <${process.env.SMTP_USER}>`,
      to: 'borngreatschool@gmail.com',
      replyTo: email || process.env.SMTP_USER,
      subject: `New Message: ${subject || 'Contact Form Submission'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background: #1a6b3c; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 1.4rem;">New Contact Form Message</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 0.9rem;">Borngreat International Schools Website</p>
          </div>
          <div style="background: white; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; width: 120px;">
                  <strong style="color: #6b7280; font-size: 0.85rem; text-transform: uppercase;">From</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;">${name}</td>
              </tr>
              ${email ? `<tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                  <strong style="color: #6b7280; font-size: 0.85rem; text-transform: uppercase;">Email</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                  <a href="mailto:${email}" style="color: #1a6b3c;">${email}</a>
                </td>
              </tr>` : ''}
              ${subject ? `<tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                  <strong style="color: #6b7280; font-size: 0.85rem; text-transform: uppercase;">Subject</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${subject}</td>
              </tr>` : ''}
            </table>

            <div style="margin-top: 20px;">
              <strong style="color: #6b7280; font-size: 0.85rem; text-transform: uppercase; display: block; margin-bottom: 10px;">Message</strong>
              <div style="background: #f9fafb; border-left: 4px solid #1a6b3c; padding: 16px; border-radius: 0 8px 8px 0; color: #374151; line-height: 1.7; white-space: pre-wrap;">${message}</div>
            </div>

            ${email ? `<div style="margin-top: 24px; text-align: center;">
              <a href="mailto:${email}?subject=Re: ${subject || 'Your message to Borngreat International Schools'}"
                 style="background: #1a6b3c; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Reply to ${name}
              </a>
            </div>` : ''}
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 0.78rem; margin-top: 16px;">
            Sent from the contact form at Borngreat International Schools website
          </p>
        </div>
      `,
    });

    console.log(`✓ Email sent from ${name} (${email || 'no email'})`);
    res.json({ message: 'Message sent successfully' });

  } catch (err) {
    console.error('CONTACT EMAIL ERROR:', err.message);
    res.status(500).json({ message: 'Failed to send message. Please try again.', error: err.message });
  }
});

module.exports = router;