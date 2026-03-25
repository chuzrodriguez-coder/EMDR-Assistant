import { logger } from "./logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || "https://localhost";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@emdrapp.com";

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logger.warn({ to, subject }, "RESEND_API_KEY not set, logging email instead");
    logger.info({ to, subject, html }, "Email would be sent");
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ err, to, subject }, "Failed to send email via Resend");
      return false;
    }

    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Error sending email");
    return false;
  }
}

export async function sendConfirmationEmail(to: string, token: string): Promise<boolean> {
  const confirmUrl = `${APP_URL}/confirm/${token}`;
  return sendEmail(
    to,
    "Confirm your EMDR Therapy Assistant account",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2a6496;">EMDR Therapy Assistant</h1>
        <p>Thank you for registering as a therapist. Please confirm your email address to activate your account.</p>
        <p>
          <a href="${confirmUrl}" style="
            display: inline-block;
            background-color: #2a6496;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
          ">Confirm My Email</a>
        </p>
        <p style="color: #666; font-size: 14px;">If you did not register for this account, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
      </div>
    `
  );
}

export async function sendPatientInviteEmail(to: string, appUrl: string): Promise<boolean> {
  return sendEmail(
    to,
    "You've been invited to an EMDR therapy session",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2a6496;">EMDR Therapy Assistant</h1>
        <p>Your therapist has invited you to use the EMDR Therapy Assistant app for your upcoming session.</p>
        <p>
          <a href="${appUrl}" style="
            display: inline-block;
            background-color: #2a6496;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
          ">Access the App</a>
        </p>
        <p style="color: #666; font-size: 14px;">Your therapist will provide you with a 6-digit session code when you are ready to begin.</p>
      </div>
    `
  );
}
