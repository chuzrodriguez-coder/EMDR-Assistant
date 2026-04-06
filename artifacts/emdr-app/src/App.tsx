import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "@/pages/Landing";
import PatientLanding from "@/pages/patient/Landing";
import PatientSessionView from "@/pages/patient/SessionView";
import TherapistDashboard from "@/pages/therapist/Dashboard";
import TherapistProfile from "@/pages/therapist/Profile";
import TherapistSessionView from "@/pages/therapist/SessionView";
import AdminPanel from "@/pages/admin/AdminPanel";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/therapist/dashboard`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 gap-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/therapist/dashboard`}
      />
      <p className="text-sm text-muted-foreground">
        By creating an account you agree to our{" "}
        <a href={`${basePath}/privacy`} className="underline hover:no-underline">Privacy Policy</a>.
      </p>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/therapist/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ClerkQueryCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const uid = user?.id ?? null;
      if (prevUserId.current !== undefined && prevUserId.current !== uid) {
        qc.clear();
      }
      prevUserId.current = uid;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

const isAdminRoute = new URLSearchParams(window.location.search).get("admin") === "admin";

function AppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryCacheInvalidator />
        <TooltipProvider>
          {isAdminRoute ? (
            <AdminPanel />
          ) : (
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />

              {/* Patient Routes (no auth required) */}
              <Route path="/patient" component={PatientLanding} />
              <Route path="/patient/session/:sessionCode" component={PatientSessionView} />

              {/* Protected Therapist Routes */}
              <Route path="/therapist/dashboard">
                {() => <ProtectedRoute><TherapistDashboard /></ProtectedRoute>}
              </Route>
              <Route path="/therapist/profile">
                {() => <ProtectedRoute><TherapistProfile /></ProtectedRoute>}
              </Route>
              <Route path="/therapist/session/:sessionCode">
                {() => <ProtectedRoute><TherapistSessionView /></ProtectedRoute>}
              </Route>

              <Route path="/privacy" component={Privacy} />

              <Route component={NotFound} />
            </Switch>
          )}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
