import { Link } from "wouter";
import { ArrowLeft, HelpCircle, Mail, Shield } from "lucide-react";

export default function Support() {
  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <header className="bg-white border-b border-border px-6 py-4 flex items-center mb-8">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <HelpCircle className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Support</h1>
            <p className="text-sm text-muted-foreground mt-1">We're here to help</p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For technical issues, account questions, or feedback, please reach out by email.
              We aim to respond within one business day.
            </p>
            <a
              href="mailto:support@emdrtherapy.app"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <Mail className="w-4 h-4" />
              support@emdrtherapy.app
            </a>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-semibold mb-3">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">How do I start a session?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Log in to your therapist account and tap "Create Session". Share the 6-digit code
                  with your patient so they can join on their device.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">My patient can't connect — what do I do?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Make sure the session is still active and the patient has entered the correct 6-digit
                  code. Sessions expire after a period of inactivity. Create a new session if needed.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">How do I delete my account?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Account deletion can be requested by emailing us at support@emdrtherapy.app. All
                  data will be permanently removed within 30 days.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Privacy</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your privacy is important to us. Read our{" "}
              <Link href="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>{" "}
              to learn how we handle your data.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
