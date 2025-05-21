import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/dashboard/projects";
import Messages from "@/pages/dashboard/messages";
import Settings from "@/pages/dashboard/settings";
import SubmitProject from "@/pages/submit-project";
import Subscriptions from "@/pages/subscriptions";
import Schedule from "@/pages/schedule";
import ProjectDetail from "@/pages/project/[id]";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/schedule" component={Schedule} />
      
      {/* Auth Required Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/projects" component={Projects} />
      <Route path="/dashboard/messages" component={Messages} />
      <Route path="/dashboard/settings" component={Settings} />
      <Route path="/submit-project" component={SubmitProject} />
      <Route path="/project/:id" component={ProjectDetail} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
