import axios from 'axios';
import { logError } from './logger';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const MAX_RETRIES = 3;

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (!WHATSAPP_API_URL) {
    throw new Error('WHATSAPP_API_URL is not defined');
  }

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const response = await axios.post(
        WHATSAPP_API_URL,
        {
          to,
          message,
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        console.log('WhatsApp message sent successfully');
        return;
      }
      throw new Error(`WhatsApp API responded with status ${response.status}`);
    } catch (error) {
      logError(error as Error, { service: 'whatsapp-service', method: 'sendWhatsApp', to, attempt: retries + 1 });
      console.error(`Failed to send WhatsApp message (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= MAX_RETRIES) {
        throw error;
      }
      // Wait for a short time before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
}