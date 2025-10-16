'use server';

interface SendSupportEmailParams {
  subject: string;
  message: string;
  shop?: string;
}

export async function sendSupportEmail({
  subject,
  message,
  shop,
}: SendSupportEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real application, you would integrate an email sending service here
    // like SendGrid, Resend, or Nodemailer.
    // For this example, we will just log the details to the console.
    console.log('--- New Support Email ---');
    console.log('Shop:', shop || 'N/A');
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('-------------------------');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // If the logging is successful, return a success response.
    return { success: true };
  } catch (error) {
    console.error('Failed to send support email:', error);
    return { success: false, error: 'Failed to send message.' };
  }
}
