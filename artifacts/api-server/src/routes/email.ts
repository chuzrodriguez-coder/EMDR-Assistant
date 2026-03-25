import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { sendPatientInviteEmail } from "../lib/email";

const router: IRouter = Router();

router.post("/send-patient-invite", requireAuth, async (req, res) => {
  try {
    const { patientEmail } = req.body;

    if (!patientEmail || typeof patientEmail !== "string") {
      res.status(400).json({ error: "Patient email is required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientEmail)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }

    const appUrl = process.env.APP_URL || `https://${req.hostname}`;
    const sent = await sendPatientInviteEmail(patientEmail, appUrl);

    if (!sent) {
      res.status(500).json({ error: "Failed to send invitation email" });
      return;
    }

    res.json({ message: "Invitation email sent successfully" });
  } catch (err) {
    req.log.error({ err }, "Send patient invite error");
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

export default router;
