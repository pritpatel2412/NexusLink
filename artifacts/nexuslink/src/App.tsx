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
import DashboardPage from "@/pages/dashboard/index";
import ContactsPage from "@/pages/contacts/index";
import ContactDetailPage from "@/pages/contacts/detail";
import AiAssistantPage from "@/pages/ai-assistant/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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
      
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/contacts">
        {() => <ProtectedRoute component={ContactsPage} />}
      </Route>
      <Route path="/contacts/:id">
        {() => <ProtectedRoute component={ContactDetailPage} />}
      </Route>
      <Route path="/ai-assistant">
        {() => <ProtectedRoute component={AiAssistantPage} />}
      </Route>

      {/* Placeholders for routes specified but simpler pages */}
      <Route path="/timeline">
        {() => <ProtectedRoute component={() => <div className="p-8 text-white">Timeline coming soon</div>} />}
      </Route>
      <Route path="/tasks">
        {() => <ProtectedRoute component={() => <div className="p-8 text-white">Tasks coming soon</div>} />}
      </Route>
      <Route path="/reminders">
        {() => <ProtectedRoute component={() => <div className="p-8 text-white">Reminders coming soon</div>} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={() => <div className="p-8 text-white">Settings coming soon</div>} />}
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
