import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sendWhatsAppMessages = async (message: string) => {
  // Implementation of sending WhatsApp messages
  // This should be replaced with your actual implementation
  console.log('Sending WhatsApp message:', message)
  // Simulating an API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { success: true }
}

export const formatTimestamp = () => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai'  // Set to UAE timezone
  }).format(new Date())
}