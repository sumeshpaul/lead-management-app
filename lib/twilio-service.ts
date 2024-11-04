import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

if (!accountSid || !authToken) {
  throw new Error('Missing Twilio environment variables');
}

const client = twilio(accountSid, authToken);

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

export async function sendWhatsAppVerification(to: string, code: string) {
  try {
    const formattedNumber = formatPhoneNumber(to);
    console.log(`Attempting to send WhatsApp message to: whatsapp:${formattedNumber}`);
    console.log(`Using Twilio phone number: ${twilioPhoneNumber}`);

    const message = await client.messages.create({
      body: `Your Lead Management App verification code is: ${code}. This code will expire in 10 minutes.`,
      from: twilioPhoneNumber,
      to: `whatsapp:${formattedNumber}`
    });

    console.log('Message sent successfully. Message SID:', message.sid);
    console.log('Message status:', message.status);
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

interface VerificationEntry {
  code: string;
  expires: number;
}

const verificationCodes: { [phoneNumber: string]: VerificationEntry } = {};

export function generateVerificationCode(phoneNumber: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const formattedNumber = formatPhoneNumber(phoneNumber);
  
  verificationCodes[formattedNumber] = {
    code,
    expires: Date.now() + 10 * 60 * 1000 // 10 minutes in milliseconds
  };
  
  return code;
}

export function verifyCode(phoneNumber: string, code: string): boolean {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  const entry = verificationCodes[formattedNumber];
  
  if (!entry) {
    return false;
  }
  
  if (Date.now() > entry.expires) {
    delete verificationCodes[formattedNumber];
    return false;
  }
  
  if (entry.code === code) {
    delete verificationCodes[formattedNumber];
    return true;
  }
  
  return false;
}