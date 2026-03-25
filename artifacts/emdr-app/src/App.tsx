import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Landing from "@/pages/Landing";
import PatientLanding from "@/pages/patient/Landing";
import PatientSessionView from "@/pages/patient/SessionView";
import TherapistLogin from "@/pages/auth/Login";
import TherapistRegister from "@/pages/auth/Register";
import ConfirmEmail from "@/pages/auth/ConfirmEmail";
import TherapistDashboard from "@/pages/therapist/Dashboard";
import TherapistProfile from "@/pages/therapist/Profile";
import TherapistSessionView from "@/pages/therapist/SessionView";
import NotFound from "@/pages/not-found";

// Components
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      {/* Patient Routes */}
      <Route path="/patient" component={PatientLanding} />
      <Route path="/patient/session/:sessionCode" component={PatientSessionView} />

      {/* Auth Routes */}
      <Route path="/therapist/login" component={TherapistLogin} />
      <Route path="/therapist/register" component={TherapistRegister} />
      <Route path="/confirm/:token" component={ConfirmEmail} />

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

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
