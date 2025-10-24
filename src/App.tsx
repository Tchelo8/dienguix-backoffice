import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Users from "./pages/Users";
import ExchangeRates from "./pages/ExchangeRates";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import TopSenders from "./pages/TopSenders";
import Settings from "./pages/Settings";
import UserHistory from "./pages/UserHistory";
import ActiveUsers from "./pages/ActiveUsers";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (email: string, password: string) => {
    // Simple auth simulation - in real app, validate with backend
    console.log("Login attempt:", { email, password });
    setIsAuthenticated(true);
  };

  const handleRegister = (data: any) => {
    // Registration simulation - in real app, send to backend
    console.log("Registration attempt:", data);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!isAuthenticated ? (
            <Auth 
              isAuthenticated={isAuthenticated}
              onLogin={handleLogin}
              onRegister={handleRegister}
            />
          ) : (
            <DashboardLayout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/users" element={<Users />} />
                <Route path="/analytics" element={<div>Page Statistiques - En développement</div>} />
                <Route path="/exchange-rates" element={<ExchangeRates />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/top-senders" element={<TopSenders />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/active-users" element={<ActiveUsers />} />
                <Route path="/user-history" element={<UserHistory />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<div>Page non trouvée</div>} />
              </Routes>
            </DashboardLayout>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;