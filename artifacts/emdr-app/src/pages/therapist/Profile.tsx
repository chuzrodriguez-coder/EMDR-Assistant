import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useUpdateProfile, customFetch, ApiError } from "@workspace/api-client-react";
import { ArrowLeft, User, Shield, Loader2, CheckCircle2, AlertCircle, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClerk } from "@clerk/react";

export default function Profile() {
  const { data: user, refetch } = useGetMe();
  const { toast } = useToast();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  const updateProfileMutation = useUpdateProfile();
  const [name, setName] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ data: { name } }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        refetch();
      },
      onError: (err) => {
        toast({ title: "Update failed", description: (err.data as any)?.error, variant: "destructive" });
      }
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await customFetch("/api/auth/account", { method: "DELETE" });
      toast({ title: "Account deleted", description: "Your account and all data have been removed." });
      await signOut();
      setLocation("/");
    } catch (err: unknown) {
      const description =
        err instanceof ApiError && typeof err.data === "object" && err.data !== null
          ? String((err.data as Record<string, unknown>).error ?? "Could not delete account. Please try again.")
          : "Could not delete account. Please try again.";
      toast({ title: "Deletion failed", description, variant: "destructive" });
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <header className="bg-white border-b border-border px-6 py-4 flex items-center mb-8">
        <Link href="/therapist/dashboard" className="flex items-center text-muted-foreground hover:text-foreground font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          {user?.status === 'active' ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Active Account
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
              <AlertCircle className="w-4 h-4 mr-1.5" /> Pending Confirmation
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* General Info */}
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
              <div className="p-3 bg-primary/10 rounded-xl">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">General Info</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email is managed via your account settings.</p>
              </div>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full py-3 mt-4 rounded-xl font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center"
              >
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </button>
            </form>
          </div>

          {/* Security & Account */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="p-3 bg-rose-100 rounded-xl">
                  <Shield className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-xl font-semibold">Security &amp; Account</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Password changes, email management, connected accounts (Google, Apple), and two-factor authentication are all managed through your secure account portal.
              </p>

              <a
                href="/sign-in"
                className="w-full py-3 rounded-xl font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                Manage Account <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Privacy & Data */}
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">Privacy &amp; Data</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                We only store your name, email, and session settings. No patient data is ever collected.{" "}
                <Link href="/privacy" className="text-primary underline hover:no-underline">
                  Read our privacy policy
                </Link>
                .
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 rounded-xl font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-700 bg-red-50 px-4 py-3 rounded-xl">
                    This will permanently delete your account, all saved themes, and all session history. This cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="w-full py-3 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {isDeletingAccount ? "Deleting…" : "Yes, Delete My Account"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeletingAccount}
                    className="w-full py-3 rounded-xl font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
