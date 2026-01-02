import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Building2,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  children?: { label: string; href: string }[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "Students", icon: Users, href: "/admin/students" },
    { label: "Teachers", icon: GraduationCap, href: "/admin/teachers" },
    { label: "Users", icon: Users, href: "/admin/users" },
    { label: "Classes", icon: BookOpen, href: "/admin/classes" },
    { label: "Fees", icon: DollarSign, href: "/admin/fees" },
    { label: "Dormitory", icon: Building2, href: "/admin/dormitory" },
    { label: "Store", icon: ShoppingCart, href: "/admin/store" },
    { label: "Item Requests", icon: FileText, href: "/admin/item-requests" },
    { label: "Records", icon: FileText, href: "/admin/records" },
    { label: "Settings", icon: Settings, href: "/admin/settings" },
  ],
  teacher: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/teacher" },
    { label: "My Classes", icon: BookOpen, href: "/teacher/classes" },
    { label: "Students", icon: Users, href: "/teacher/students" },
    { label: "Marks", icon: FileText, href: "/teacher/marks" },
    { label: "Attendance", icon: GraduationCap, href: "/teacher/attendance" },
  ],
  headteacher: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/headteacher" },
    { label: "Staff", icon: GraduationCap, href: "/headteacher/staff" },
    { label: "Students", icon: Users, href: "/headteacher/students" },
    { label: "Academic", icon: BookOpen, href: "/headteacher/academic" },
    { label: "Reports", icon: FileText, href: "/headteacher/reports" },
    { label: "Finances", icon: DollarSign, href: "/headteacher/finances" },
    { label: "Item Requests", icon: FileText, href: "/headteacher/item-requests" },
  ],
  burser: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/burser" },
    { label: "Transactions", icon: DollarSign, href: "/burser" },
    { label: "Fees", icon: FileText, href: "/burser" },
  ],
  store: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/store" },
    { label: "Inventory", icon: ShoppingCart, href: "/admin/store" },
  ],
  dormitory: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dormitory" },
    { label: "Dormitories", icon: Building2, href: "/admin/dormitory" },
  ],
};

const roleLabels = {
  admin: "Administrator",
  teacher: "Teacher",
  headteacher: "Head Teacher",
  burser: "Burser",
  store: "Store Manager",
  dormitory: "Dormitory Manager",
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return null; // ProtectedRoute should handle this, but just in case
  }

  const role = user.role;
  const userName = `${user.first_name} ${user.last_name}`;
  const items = navItems[role] || [];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col gradient-hero fixed h-screen z-40"
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-secondary-foreground" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-xl font-bold text-primary-foreground whitespace-nowrap">
                  EduManage
                </h1>
                <p className="text-xs text-primary-foreground/70">
                  {roleLabels[role]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-lg"
                    : "text-primary-foreground/80 hover:bg-sidebar-accent hover:text-primary-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Toggle & Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary-foreground/80 hover:bg-sidebar-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary-foreground/80 hover:bg-destructive/20 hover:text-destructive-foreground transition-colors mt-1"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 h-full w-72 gradient-hero z-50 lg:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-primary-foreground">
                      EduManage
                    </h1>
                    <p className="text-xs text-primary-foreground/70">
                      {roleLabels[role]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-primary-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-primary-foreground/80 hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-sidebar-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary-foreground/80 hover:bg-destructive/20"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]"
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-48"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-muted">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[role] || role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
