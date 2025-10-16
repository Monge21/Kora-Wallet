'use server';

import { Resend } from 'resend';

interface SendSupportEmailParams {
  subject: string;
  message: string;
  shop?: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Replace with the email address you verified with Resend
const FROM_EMAIL = 'frutasma0512@gmail.com';
// Replace with the email address where you want to receive support requests
const TO_EMAIL = 'frutasma0512@gmail.com';

export async function sendSupportEmail({
  subject,
  message,
  shop,
}: SendSupportEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured.');
      return { success: false, error: 'Email service is not configured.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Kora Wallet Support <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject: `[Support Request] - ${subject}`,
      html: `
        <h1>New Support Request</h1>
        <p><strong>Shop:</strong> ${shop || 'N/A'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <h2>Message:</h2>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return { success: false, error: 'Failed to send message via email provider.' };
    }

    return { success: true };

  } catch (error) {
    console.error('Failed to send support email:', error);
    return { success: false, error: 'Failed to send message.' };
  }
}
