import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentsPage from "./pages/admin/StudentsPage";
import TeachersPage from "./pages/admin/TeachersPage";
import ClassesPage from "./pages/admin/ClassesPage";
import FeesPage from "./pages/admin/FeesPage";
import DormitoryPage from "./pages/admin/DormitoryPage";
import StorePage from "./pages/admin/StorePage";
import RecordsPage from "./pages/admin/RecordsPage";
import UsersPage from "./pages/admin/UsersPage";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import MarksPage from "./pages/teacher/MarksPage";
import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";
import AttendancePage from "./pages/teacher/AttendancePage";

// Headteacher Pages
import HeadteacherDashboard from "./pages/headteacher/HeadteacherDashboard";
import StaffPage from "./pages/headteacher/StaffPage";
import StudentsPageHead from "./pages/headteacher/StudentsPage";
import AcademicPage from "./pages/headteacher/AcademicPage";
import ReportsPage from "./pages/headteacher/ReportsPage";
import FinancesPage from "./pages/headteacher/FinancesPage";
// Burser Pages
import BurserDashboard from "./pages/burser/BurserDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TeachersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/fees"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <FeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dormitory"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DormitoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/store"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/records"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            
            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/marks"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <MarksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            
            {/* Headteacher Routes */}
            <Route
              path="/headteacher"
              element={
                <ProtectedRoute allowedRoles={['headteacher']}>
                  <HeadteacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/headteacher/staff"
              element={
                <ProtectedRoute allowedRoles={['headteacher']}>
                  <StaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/headteacher/students"
              element={
                <ProtectedRoute allowedRoles={['headteacher']}>
                  <StudentsPageHead />
                </ProtectedRoute>
              }
            />
            <Route
              path="/headteacher/academic"
              element={
                <ProtectedRoute allowedRoles={['headteacher']}>
                  <AcademicPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/headteacher/reports"
              element={
                <ProtectedRoute allowedRoles={['headteacher']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/headteacher/finances"
              element={
                <ProtectedRoute allowedRoles={['headteacher']}>
                  <FinancesPage />
                </ProtectedRoute>
              }
            />
            
            {/* Burser Routes */}
            <Route
              path="/burser"
              element={
                <ProtectedRoute allowedRoles={['burser']}>
                  <BurserDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
