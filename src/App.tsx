import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import MarksPage from "./pages/teacher/MarksPage";
import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";
import AttendancePage from "./pages/teacher/AttendancePage";

// Headteacher Pages
import HeadteacherDashboard from "./pages/headteacher/HeadteacherDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route path="/admin/teachers" element={<TeachersPage />} />
          <Route path="/admin/classes" element={<ClassesPage />} />
          <Route path="/admin/fees" element={<FeesPage />} />
          <Route path="/admin/dormitory" element={<DormitoryPage />} />
          <Route path="/admin/store" element={<StorePage />} />
          <Route path="/admin/records" element={<RecordsPage />} />
          
          {/* Teacher Routes */}
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/classes" element={<TeacherDashboard />} />
          <Route path="/teacher/students" element={<TeacherStudentsPage />} />
          <Route path="/teacher/marks" element={<MarksPage />} />
          <Route path="/teacher/attendance" element={<AttendancePage />} />
          
          {/* Headteacher Routes */}
          <Route path="/headteacher" element={<HeadteacherDashboard />} />
          <Route path="/headteacher/staff" element={<HeadteacherDashboard />} />
          <Route path="/headteacher/students" element={<HeadteacherDashboard />} />
          <Route path="/headteacher/academic" element={<HeadteacherDashboard />} />
          <Route path="/headteacher/reports" element={<HeadteacherDashboard />} />
          <Route path="/headteacher/finances" element={<HeadteacherDashboard />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
