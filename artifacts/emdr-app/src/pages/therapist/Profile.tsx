import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetMe, useUpdateProfile, useChangePassword } from "@workspace/api-client-react";
import { ArrowLeft, User, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { data: user, refetch } = useGetMe();
  const { toast } = useToast();
  
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const [pwdData, setPwdData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ data: { name, email } }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        refetch();
      },
      onError: (err) => {
        toast({ title: "Update failed", description: (err.data as any)?.error, variant: "destructive" });
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ data: pwdData }, {
      onSuccess: () => {
        toast({ title: "Password changed successfully" });
        setPwdData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      },
      onError: (err) => {
        toast({ title: "Failed to change password", description: (err.data as any)?.error, variant: "destructive" });
      }
    });
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
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-4 focus:ring-primary/10 transition-all"
                />
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

          {/* Security */}
          <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Shield className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-xl font-semibold">Security</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Current Password</label>
                <input
                  type="password"
                  required
                  value={pwdData.currentPassword}
                  onChange={(e) => setPwdData({...pwdData, currentPassword: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-4 focus:ring-rose-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={pwdData.newPassword}
                  onChange={(e) => setPwdData({...pwdData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-4 focus:ring-rose-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={pwdData.confirmPassword}
                  onChange={(e) => setPwdData({...pwdData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:ring-4 focus:ring-rose-500/10 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full py-3 mt-4 rounded-xl font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center"
              >
                {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Password
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
