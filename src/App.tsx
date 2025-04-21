import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./components/Layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Index from "./pages/Index";
import Departments from "./pages/Admin/Departments";
import DataImport from "./pages/Admin/DataImport";
import DepartmentHeadDashboard from "./pages/DepartmentHead/Dashboard";
import TopicManagement from "./pages/DepartmentHead/TopicManagement";
import NewTopic from "./pages/DepartmentHead/NewTopic";
import ClassroomManagement from "./pages/DepartmentHead/ClassroomManagement";
import JuryAssignment from "./pages/DepartmentHead/JuryAssignment";
import ScheduleManagement from "./pages/DepartmentHead/ScheduleManagement";
import ParticipationTracker from "./pages/DepartmentHead/ParticipationTracker";
import TeacherDashboard from "./pages/Teacher/Dashboard";
import TeachersList from "./pages/Admin/TeachersList";
import NewTeacher from "./pages/Admin/NewTeacher";
import EditTeacher from "./pages/Admin/EditTeacher";
import StudentSupervision from "./pages/Teacher/StudentSupervision";
import ParticipationView from "./pages/Teacher/ParticipationView";
import TeacherAvailability from "./pages/Teacher/TeacherAvailability";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Index />} />
          
          {/* Dashboard routes based on role */}
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
            path="/departments"
            element={
              <AppLayout allowedRoles={["admin"]}>
                <Departments />
              </AppLayout>
            }
          />
          
          <Route
            path="/data-import"
            element={
              <AppLayout allowedRoles={["admin", "departmentHead"]}>
                <DataImport />
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

          {/* Teacher management routes */}
          <Route
            path="/teachers"
            element={
              <AppLayout allowedRoles={["admin", "departmentHead"]}>
                <TeachersList />
              </AppLayout>
            }
          />
          
          <Route path="/admin/teachers">
            <Route
              path=""
              element={
                <AppLayout allowedRoles={["admin", "departmentHead"]}>
                  <TeachersList />
                </AppLayout>
              }
            />
            <Route
              path="new"
              element={
                <AppLayout allowedRoles={["admin", "departmentHead"]}>
                  <NewTeacher />
                </AppLayout>
              }
            />
            <Route
              path=":id/edit"
              element={
                <AppLayout allowedRoles={["admin", "departmentHead"]}>
                  <EditTeacher />
                </AppLayout>
              }
            />
          </Route>
          
          {/* Department Head routes */}
          <Route
            path="/department-dashboard"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin"]}>
                <DepartmentHeadDashboard />
              </AppLayout>
            }
          />
          
          <Route
            path="/topics"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin"]}>
                <TopicManagement />
              </AppLayout>
            }
          />
          
          <Route
            path="/classrooms"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin"]}>
                <ClassroomManagement />
              </AppLayout>
            }
          />
          
          <Route
            path="/topics/new"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin"]}>
                <NewTopic />
              </AppLayout>
            }
          />
          
          <Route
            path="/topics/:id/edit"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin"]}>
                <Dashboard />
              </AppLayout>
            }
          />
          
          <Route
            path="/topics/import"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin"]}>
                <DataImport />
              </AppLayout>
            }
          />
          
          <Route
            path="/juries"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin"]}>
                <JuryAssignment />
              </AppLayout>
            }
          />
          
          <Route
            path="/schedule"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin", "student", "teacher"]}>
                <ScheduleManagement />
              </AppLayout>
            }
          />
          
          <Route
            path="/participation"
            element={
              <AppLayout allowedRoles={["departmentHead", "admin", "teacher"]}>
                <ParticipationTracker />
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
            path="/teacher-dashboard"
            element={
              <AppLayout allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </AppLayout>
            }
          />
          
          <Route
            path="/student-supervision"
            element={
              <AppLayout allowedRoles={["teacher"]}>
                <StudentSupervision />
              </AppLayout>
            }
          />
          
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
                <TeacherAvailability />
              </AppLayout>
            }
          />
          
          <Route
            path="/teacher-participation"
            element={
              <AppLayout allowedRoles={["teacher"]}>
                <ParticipationView />
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
