import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacy() {
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
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mt-1">Last updated: April 2026</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none space-y-8">
          <section className="bg-white p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-semibold mb-3">1. What We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect only the minimum data required to operate the EMDR Therapy Assistant:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Therapist name and email address</strong> — provided when you create an account, used to identify your account and communicate with you.</li>
              <li><strong className="text-foreground">Session settings</strong> — dot color, background color, and animation speed that you configure for your sessions. These are stored so your preferences persist between sessions.</li>
              <li><strong className="text-foreground">Session codes</strong> — temporary 6-digit codes used to connect patients to your session. These expire automatically after 24 hours.</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-semibold mb-3">2. What We Do Not Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Patient privacy is fundamental to our design:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Patients are <strong className="text-foreground">fully anonymous</strong> — no name, email, or identity is ever collected from patients.</li>
              <li>No session recordings, audio, video, or clinical notes are stored.</li>
              <li>No health or medical information is collected from anyone.</li>
              <li>We do not sell or share your data with third parties for marketing purposes.</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-semibold mb-3">3. How Long We Retain Data</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Active sessions</strong> are automatically deleted after 24 hours of creation.</li>
              <li><strong className="text-foreground">Session code history</strong> is retained for up to 30 days to prevent code reuse, then permanently deleted.</li>
              <li><strong className="text-foreground">Expired session records</strong> older than 7 days are automatically purged from our database.</li>
              <li><strong className="text-foreground">Therapist account data</strong> (name, email, saved themes) is retained until you request account deletion.</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-semibold mb-3">4. Your Rights &amp; Account Deletion</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the right to access, correct, or delete your personal data at any time.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To permanently delete your account and all associated data (name, email, saved color themes, and session history), go to your{" "}
              <Link href="/therapist/profile" className="text-primary underline hover:no-underline">Profile Settings</Link>{" "}
              and use the <strong>Delete Account</strong> option. This action is immediate and irreversible.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Deleting your account removes all your data from our systems. Any active session codes will stop working immediately.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-semibold mb-3">5. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Authentication is handled by Clerk, a security-certified identity provider. Your password is never stored by us — it is managed entirely by Clerk. Data in transit is encrypted using TLS. The database is encrypted at rest by our hosting provider.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-semibold mb-3">6. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this privacy policy or wish to exercise your data rights, please use the account deletion feature in your Profile Settings or contact us directly via the support channel provided by your organization.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
