// @ts-expect-error - the africastalking package doesn't ship its own TypeScript types
import AfricasTalkingFactory from 'africastalking';

// Lazily constructed - if this ran eagerly at module load time, it would also
// run during Next.js's build-time "collecting page data" step (which briefly
// imports every route module), before real environment variables are
// guaranteed to be available in the same way they are at runtime. Building
// the client only when actually sending an SMS avoids that entirely.
let cachedClient: any = null;

function getClient() {
  if (!cachedClient) {
    cachedClient = AfricasTalkingFactory({
      apiKey: process.env.AFRICASTALKING_API_KEY ?? '',
      username: process.env.AFRICASTALKING_USERNAME ?? 'sandbox',
    });
  }
  return cachedClient;
}

export async function sendSms(to: string, message: string) {
  const client = getClient();
  return client.SMS.send({
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