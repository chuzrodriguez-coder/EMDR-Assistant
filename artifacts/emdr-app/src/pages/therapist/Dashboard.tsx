import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useCreateSession, useSendPatientInvite, useLogoutTherapist } from "@workspace/api-client-react";
import { Plus, User, LogOut, Send, Copy, Check, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";

export default function Dashboard() {
  const { data: user } = useGetMe();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createMutation = useCreateSession();
  const logoutMutation = useLogoutTherapist();
  const inviteMutation = useSendPatientInvite();

  const [activeSessionCode, setActiveSessionCode] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateSession = () => {
    if (user?.status !== 'active') {
      toast({
        title: "Account pending",
        description: "You must confirm your email before creating sessions.",
        variant: "destructive"
      });
      return;
    }
    
    createMutation.mutate(undefined, {
      onSuccess: (data) => {
        setActiveSessionCode(data.sessionCode);
        toast({ title: "Session created successfully" });
      },
      onError: () => {
        toast({ title: "Failed to create session", variant: "destructive" });
      }
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/patient?code=${activeSessionCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied to clipboard" });
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({ data: { patientEmail: inviteEmail } }, {
      onSuccess: () => {
        toast({ title: "Invite sent successfully" });
        setIsInviteOpen(false);
        setInviteEmail("");
      },
      onError: () => {
        toast({ title: "Failed to send invite", variant: "destructive" });
      }
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/therapist/login");
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Navbar */}
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
            E
          </div>
          <span className="font-display font-semibold text-lg">EMDR Assistant</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/therapist/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
            <User className="w-4 h-4" /> {user?.name}
          </Link>
          <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Welcome, Dr. {user?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-lg">Ready to start a new therapy session?</p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Main Action Area */}
          <div className="md:col-span-8">
            {!activeSessionCode ? (
              <div className="bg-white p-10 rounded-3xl border border-border shadow-sm text-center">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Create New Session</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Generate a unique 6-digit session code. Your patient can use this code to sync their screen with your controls.
                </p>
                <button
                  onClick={handleCreateSession}
                  disabled={createMutation.isPending}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 inline-flex items-center"
                >
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Start Session Now
                </button>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-3xl border border-primary/20 shadow-lg shadow-primary/5 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-accent"></div>
                <h2 className="text-xl font-medium text-muted-foreground mb-2">Your Session Code</h2>
                <div className="text-7xl font-display font-bold tracking-[0.2em] text-foreground mb-8">
                  {activeSessionCode}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors w-full sm:w-auto"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy URL
                  </button>
                  <button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center justify-center px-6 py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4 mr-2" /> Send Invite
                  </button>
                </div>

                <Link href={`/therapist/session/${activeSessionCode}`}>
                  <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-md flex items-center justify-center group">
                    Enter Operator Console <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Side Info */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-border">
              <h3 className="font-semibold mb-2">How it works</h3>
              <ul className="text-sm text-muted-foreground space-y-3">
                <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Create a session to get a code.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">2.</span> Share code or email link to patient.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">3.</span> Enter console to control the dot.</li>
                <li className="flex gap-2"><span className="text-primary font-bold">4.</span> Codes expire after 24 hours.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Invite Dialog */}
      <Dialog.Root open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl z-50 animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-2xl font-bold mb-2">Invite Patient</Dialog.Title>
            <Dialog.Description className="text-muted-foreground mb-6">
              Send an email to your patient with a direct link to the app. (Session code must be given separately).
            </Dialog.Description>
            
            <form onSubmit={handleSendInvite}>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 mb-6"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="px-6 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center"
                >
                  {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Link
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
