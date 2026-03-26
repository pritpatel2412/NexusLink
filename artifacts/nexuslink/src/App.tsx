import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Loader2 } from "lucide-react";

// Pages
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";
import DashboardPage from "@/pages/dashboard/index";
import ContactsPage from "@/pages/contacts/index";
import NewContactPage from "@/pages/contacts/new";
import ContactDetailPage from "@/pages/contacts/detail";
import TimelinePage from "@/pages/timeline/index";
import TasksPage from "@/pages/tasks/index";
import RemindersPage from "@/pages/reminders/index";
import AiAssistantPage from "@/pages/ai-assistant/index";
import SettingsPage from "@/pages/settings/index";
import PricingPage from "@/pages/pricing/index";
import PrivacyPage from "@/pages/privacy/index";
import TermsPage from "@/pages/terms/index";
import ContactPage from "@/pages/contact/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/contacts/new">
        {() => <ProtectedRoute component={NewContactPage} />}
      </Route>
      <Route path="/contacts/:id">
        {() => <ProtectedRoute component={ContactDetailPage} />}
      </Route>
      <Route path="/contacts">
        {() => <ProtectedRoute component={ContactsPage} />}
      </Route>
      <Route path="/timeline">
        {() => <ProtectedRoute component={TimelinePage} />}
      </Route>
      <Route path="/tasks">
        {() => <ProtectedRoute component={TasksPage} />}
      </Route>
      <Route path="/reminders">
        {() => <ProtectedRoute component={RemindersPage} />}
      </Route>
      <Route path="/ai-assistant">
        {() => <ProtectedRoute component={AiAssistantPage} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} />}
      </Route>
      <Route path="/pricing" component={PricingPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />

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
