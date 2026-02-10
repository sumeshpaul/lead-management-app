import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
  }
  return twilio(accountSid, authToken);
}

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.startsWith('971')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+971' + cleaned.substring(1);
  }
  return '+971' + cleaned;
}

export async function sendWhatsAppVerification(to: string, messageBody: string) {
  try {
    const client = getClient();
    const formattedNumber = formatPhoneNumber(to);

    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: `whatsapp:${formattedNumber}`
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
    };
  }
}

export async function sendWhatsAppMessage(to: string, message: string) {
  return sendWhatsAppVerification(to, message);
}
