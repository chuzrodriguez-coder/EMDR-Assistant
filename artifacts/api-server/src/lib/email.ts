import { Resend } from "resend";
import { logger } from "./logger";

const ADMIN_EMAIL = "chuzrodriguez@gmail.com";

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

    const connectionSettings = await fetch(
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

export async function sendAdminNotificationEmail(
  therapistName: string,
  therapistEmail: string,
  activationToken: string,
  appUrl: string,
): Promise<boolean> {
  const activationLink = `${appUrl}/api/auth/activate/${activationToken}`;
  const adminPanelLink = `${appUrl}/?admin=admin`;

  return sendEmail(
    ADMIN_EMAIL,
    `New therapist registration: ${therapistName}`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #1a3a4a; font-size: 24px; margin-bottom: 8px;">EMDR Therapy Assistant</h1>
          <h2 style="color: #2d6a8a; font-size: 18px; margin-bottom: 16px;">New Therapist Registration</h2>

          <p style="color: #4a5568; margin-bottom: 8px;">A new therapist has registered and is pending activation:</p>

          <div style="background-color: #f0f7ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #0891b2;">
            <p style="margin: 0 0 8px 0; color: #1a3a4a;"><strong>Name:</strong> ${therapistName}</p>
            <p style="margin: 0; color: #1a3a4a;"><strong>Email:</strong> ${therapistEmail}</p>
          </div>

          <p style="color: #4a5568; margin-bottom: 20px;">Click the button below to activate this therapist's account:</p>

          <a href="${activationLink}" style="
            display: inline-block;
            background-color: #059669;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 24px;
          ">Activate Account</a>

          <p style="color: #718096; font-size: 13px; margin-top: 8px; margin-bottom: 16px;">
            Or copy this link: <a href="${activationLink}" style="color: #0891b2; word-break: break-all;">${activationLink}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

          <p style="color: #718096; font-size: 13px;">
            You can also manage all therapists from the 
            <a href="${adminPanelLink}" style="color: #0891b2;">Admin Panel</a>.
          </p>
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
