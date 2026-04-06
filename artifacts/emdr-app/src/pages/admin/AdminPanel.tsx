import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser, useClerk } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import {
  adminListTherapists,
  adminSearchTherapists,
  useAdminActivateTherapist,
  useAdminToggleAdminStatus,
  useSyncTherapist,
  useGetMe,
} from "@workspace/api-client-react";
import {
  Loader2,
  Search,
  Shield,
  ShieldOff,
  CheckCircle,
  Clock,
  LogOut,
  ArrowLeft,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPanel() {
  const { toast } = useToast();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const [synced, setSynced] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const syncMutation = useSyncTherapist();
  const activateMutation = useAdminActivateTherapist();
  const toggleAdminMutation = useAdminToggleAdminStatus();

  const { data: currentUser, isLoading: checkingAuth, refetch: refetchMe } = useGetMe({
    query: { enabled: isSignedIn === true && synced },
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn || synced) return;
    const name =
      user?.fullName ||
      user?.firstName ||
      user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "Admin";
    const email = user?.primaryEmailAddress?.emailAddress || "";
    if (!email) return;
    syncMutation.mutate(
      { data: { name, email } },
      {
        onSuccess: () => { setSynced(true); refetchMe(); },
        onError: () => { setSynced(true); },
      }
    );
  }, [isLoaded, isSignedIn, synced]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: therapists = [], isLoading: loadingTherapists, refetch: refetchTherapists } = useQuery({
    queryKey: ["adminTherapists", debouncedQuery],
    queryFn: () =>
      debouncedQuery
        ? adminSearchTherapists({ q: debouncedQuery })
        : adminListTherapists(),
    enabled: currentUser?.isAdmin === true,
  });

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const handleActivate = (id: number) => {
    activateMutation.mutate(
      { id },
      {
        onSuccess: (data) => {
          toast({ title: `${data.name} has been activated` });
          refetchTherapists();
        },
        onError: () => {
          toast({ title: "Failed to activate account", variant: "destructive" });
        },
      }
    );
  };

  const handleToggleAdmin = (id: number, name: string, currentIsAdmin: boolean) => {
    toggleAdminMutation.mutate(
      { id },
      {
        onSuccess: (data) => {
          toast({
            title: data.isAdmin
              ? `${name} is now an admin`
              : `${name} is no longer an admin`,
          });
          refetchTherapists();
        },
        onError: (err: any) => {
          toast({
            title: "Failed to update admin status",
            description: err.error?.error,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!isLoaded || (isSignedIn && !synced) || (synced && checkingAuth)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-white text-xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-slate-400 mb-6">You must be signed in to access the admin panel.</p>
          <a
            href="/sign-in"
            className="inline-block px-6 py-3 rounded-xl font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-all"
          >
            Sign In
          </a>
          <div className="mt-6">
            <a href="/" className="text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to app
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <h1 className="text-white text-xl font-bold">Access Denied</h1>
          </div>
          <p className="text-slate-400 mb-6">
            Your account (<strong className="text-slate-300">{currentUser?.email}</strong>) does not have admin privileges.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-xl font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all"
            >
              Sign Out
            </button>
            <a href="/" className="text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to app
            </a>
          </div>
        </div>
      </div>
    );
  }

  const pending = therapists.filter((t) => t.status === "pending");
  const active = therapists.filter((t) => t.status === "active");

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <h1 className="font-bold text-lg">Admin Panel</h1>
          {currentUser && (
            <span className="text-slate-400 text-sm hidden sm:block">
              — {currentUser.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Welcome Screen</span>
          </a>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              Total
            </div>
            <div className="text-2xl font-bold">{therapists.length}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Active
            </div>
            <div className="text-2xl font-bold">{active.length}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Pending
            </div>
            <div className="text-2xl font-bold">{pending.length}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* Therapist List */}
        {loadingTherapists ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : therapists.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery ? "No therapists match your search." : "No therapists registered yet."}
          </div>
        ) : (
          <div className="space-y-2">
            {therapists.map((t) => {
              const isExpanded = expandedId === t.id;
              const isSelf = currentUser?.id === t.id;

              return (
                <div
                  key={t.id}
                  className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
                >
                  {/* Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{t.name}</span>
                        {t.isAdmin && (
                          <span className="inline-flex items-center gap-1 text-xs bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-xs text-slate-500">(you)</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 truncate">{t.email}</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          t.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {t.status === "active" ? "Active" : "Pending"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500 mb-0.5">Email</div>
                          <div className="text-white">{t.email}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-0.5">Registered</div>
                          <div className="text-white">{formatDate(t.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-0.5">Status</div>
                          <div className={t.status === "active" ? "text-emerald-400" : "text-amber-400"}>
                            {t.status === "active" ? "Active" : "Pending Activation"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-0.5">Admin</div>
                          <div className={t.isAdmin ? "text-cyan-400" : "text-slate-400"}>
                            {t.isAdmin ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {t.status === "pending" && (
                          <button
                            onClick={() => handleActivate(t.id)}
                            disabled={activateMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Activate Account
                          </button>
                        )}

                        {!isSelf && (
                          <button
                            onClick={() => handleToggleAdmin(t.id, t.name, t.isAdmin)}
                            disabled={toggleAdminMutation.isPending}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                              t.isAdmin
                                ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                : "bg-cyan-700 hover:bg-cyan-600 text-white"
                            }`}
                          >
                            {t.isAdmin ? (
                              <>
                                <ShieldOff className="w-4 h-4" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4" />
                                Make Admin
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
