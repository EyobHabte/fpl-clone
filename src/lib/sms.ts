// @ts-expect-error - the africastalking package doesn't ship its own TypeScript types
import AfricasTalking from 'africastalking';

const credentials = {
  apiKey: process.env.AFRICASTALKING_API_KEY ?? '',
  // 'sandbox' is the required username for Africa's Talking's free test environment
  username: process.env.AFRICASTALKING_USERNAME ?? 'sandbox',
};

const client = AfricasTalking(credentials);
const smsService = client.SMS;

export async function sendSms(to: string, message: string) {
  return smsService.send({
    to: [to],
    message,
    ...(process.env.AFRICASTALKING_SENDER_ID ? { from: process.env.AFRICASTALKING_SENDER_ID } : {}),
  });
}

/**
 * Normalizes an Ethiopian phone number to E.164 (+251XXXXXXXXX).
 * Accepts local format (09XXXXXXXX / 07XXXXXXXX), with or without the
 * country code, with or without a leading +.
 * Returns null if the input doesn't look like a valid Ethiopian mobile number.
 */
export function normalizeEthiopianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');

  if (/^0[79]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
  if (/^251[79]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^[79]\d{8}$/.test(digits)) return `+251${digits}`;

  return null;
}
