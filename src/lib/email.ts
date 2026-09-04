import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared sandbox address (onboarding@resend.dev) works with zero setup,
// but until you verify your own domain in the Resend dashboard, it can only
// deliver to the email address on your own Resend account. Verify a domain
// and set EMAIL_FROM to send to real users.
const FROM = process.env.EMAIL_FROM ?? 'Weekly Fantasy <onboarding@resend.dev>';

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Confirm your email — Weekly Fantasy',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #37003C;">Welcome to Weekly Fantasy</h2>
        <p>Confirm your email address to activate your account.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;background:#00FF85;color:#37003C;
             font-weight:bold;padding:12px 24px;border-radius:999px;text-decoration:none;">
            Confirm email
          </a>
        </p>
        <p style="color:#888;font-size:13px;">This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
      </div>
    `,
  });
}
