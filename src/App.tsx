
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./components/Layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route
              path="/"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            {/* Admin routes */}
            <Route
              path="/users"
              element={
                <AppLayout allowedRoles={["admin"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/data-sync"
              element={
                <AppLayout allowedRoles={["admin"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            {/* Department Head routes */}
            <Route
              path="/topics"
              element={
                <AppLayout allowedRoles={["departmentHead", "admin"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/juries"
              element={
                <AppLayout allowedRoles={["departmentHead", "admin"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/schedule"
              element={
                <AppLayout allowedRoles={["departmentHead", "admin", "student"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/participation"
              element={
                <AppLayout allowedRoles={["departmentHead", "admin", "teacher"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/reports"
              element={
                <AppLayout allowedRoles={["departmentHead", "admin"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            {/* Teacher routes */}
            <Route
              path="/presentations"
              element={
                <AppLayout allowedRoles={["teacher"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/availability"
              element={
                <AppLayout allowedRoles={["teacher"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            {/* Student routes */}
            <Route
              path="/my-topic"
              element={
                <AppLayout allowedRoles={["student"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            <Route
              path="/documents"
              element={
                <AppLayout allowedRoles={["student"]}>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            {/* Common routes */}
            <Route
              path="/profile"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
