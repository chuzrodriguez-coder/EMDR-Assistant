import { Resend } from "resend";
import { logger } from "./logger";

let connectionSettings: any;

async function getResendCredentials(): Promise<{ apiKey: string; fromEmail: string } | null> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
      ? "repl " + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
        ? "depl " + process.env.WEB_REPL_RENEWAL
        : null;

    if (!hostname || !xReplitToken) {
      return null;
    }

    connectionSettings = await fetch(
      "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
      {
        headers: {
          Accept: "application/json",
          "X-Replit-Token": xReplitToken,
        },
      },
    )
      .then((res) => res.json())
      .then((data) => data.items?.[0]);

    if (!connectionSettings || !connectionSettings.settings.api_key) {
      return null;
    }

    return {
      apiKey: connectionSettings.settings.api_key,
      fromEmail: connectionSettings.settings.from_email || "noreply@emdrapp.com",
    };
  } catch (err) {
    logger.error({ err }, "Failed to get Resend credentials");
    return null;
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const credentials = await getResendCredentials();

  if (!credentials) {
    logger.warn({ to, subject }, "Resend not configured, logging email instead");
    logger.info({ to, subject, html }, "Email would be sent");
    return true;
  }

  try {
    const resend = new Resend(credentials.apiKey);
    const { error } = await resend.emails.send({
      from: credentials.fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error({ error, to, subject }, "Failed to send email via Resend");
      return false;
    }

    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Error sending email");
    return false;
  }
}

export async function sendConfirmationEmail(to: string, token: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://localhost";
  const confirmUrl = `${appUrl}/confirm/${token}`;
  return sendEmail(
    to,
    "Confirm your EMDR Therapy Assistant account",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #1a3a4a; font-size: 24px; margin-bottom: 8px;">EMDR Therapy Assistant</h1>
          <p style="color: #4a5568; margin-bottom: 24px;">Thank you for registering as a therapist. Please confirm your email address to activate your account and start creating sessions.</p>
          <a href="${confirmUrl}" style="
            display: inline-block;
            background-color: #0891b2;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 24px;
          ">Confirm My Email</a>
          <p style="color: #718096; font-size: 14px;">If you did not register for this account, you can safely ignore this email.</p>
          <p style="color: #718096; font-size: 14px;">This confirmation link will expire in 24 hours.</p>
        </div>
      </div>
    `,
  );
}

export async function sendPatientInviteEmail(to: string, appUrl: string): Promise<boolean> {
  return sendEmail(
    to,
    "You've been invited to an EMDR therapy session",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #1a3a4a; font-size: 24px; margin-bottom: 8px;">EMDR Therapy Assistant</h1>
          <p style="color: #4a5568; margin-bottom: 24px;">Your therapist has invited you to use the EMDR Therapy Assistant app for your upcoming session.</p>
          <a href="${appUrl}" style="
            display: inline-block;
            background-color: #0891b2;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 24px;
          ">Access the App</a>
          <p style="color: #718096; font-size: 14px;">Your therapist will provide you with a 6-digit session code when you are ready to begin. You can enter the code on the patient page.</p>
        </div>
      </div>
    `,
  );
}
