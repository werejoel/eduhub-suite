import { useState, useMemo } from "react";
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
import { useItemRequests } from "@/hooks/useDatabase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  section?: string;
  children?: { label: string; href: string }[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems: Record<string, NavItem[]> = {
  admin: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      section: "Overview",
    },
    {
      label: "Students",
      icon: Users,
      href: "/admin/students",
      section: "Academics Module",
    },
    {
      label: "Teachers",
      icon: GraduationCap,
      href: "/admin/teachers",
      section: "Academics Module",
    },
    {
      label: "Classes",
      icon: BookOpen,
      href: "/admin/classes",
      section: "Academics Module",
    },
    {
      label: "Fees",
      icon: DollarSign,
      href: "/admin/fees",
      section: "Finance Module",
    },
    {
      label: "Dormitory",
      icon: Building2,
      href: "/admin/dormitory",
      section: "Student Module",
    },
    {
      label: "Dormitory Details",
      icon: FileText,
      href: "/dormitory/details",
      section: "Student Module",
    },
    {
      label: "Dormitory Requirements",
      icon: Building2,
      href: "/dormitory/requirements",
      section: "Student Module",
    },
    {
      label: "Student Status",
      icon: Users,
      href: "/dormitory/student-status",
      section: "Student Module",
    },
    {
      label: "Occupancy Report",
      icon: FileText,
      href: "/dormitory/occupancy",
      section: "Student Module",
    },
    {
      label: "Assign Students",
      icon: Users,
      href: "/dormitory/assignments",
      section: "Student Module",
    },
    {
      label: "Store",
      icon: ShoppingCart,
      href: "/admin/store",
      section: "Operations Module",
    },
    {
      label: "Item Requests",
      icon: FileText,
      href: "/admin/item-requests",
      section: "Operations Module",
    },
    {
      label: "Records",
      icon: FileText,
      href: "/admin/records",
      section: "Operations Module",
    },
    { label: "Users", icon: Users, href: "/admin/users", section: "System" },
    { label: "Settings", icon: Settings, href: "/settings", section: "System" },
  ],
  teacher: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/teacher",
      section: "Overview",
    },
    {
      label: "Students",
      icon: Users,
      href: "/teacher/students",
      section: "Classroom Module",
    },
    {
      label: "Marks",
      icon: FileText,
      href: "/teacher/marks",
      section: "Classroom Module",
    },
    {
      label: "Attendance",
      icon: GraduationCap,
      href: "/teacher/attendance",
      section: "Classroom Module",
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/teacher/reports",
      section: "Reports Module",
    },
    { label: "Settings", icon: Settings, href: "/settings", section: "System" },
  ],
  headteacher: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/headteacher",
      section: "Overview",
    },
    {
      label: "Staff",
      icon: GraduationCap,
      href: "/headteacher/staff",
      section: "Staff Module",
    },
    {
      label: "Students",
      icon: Users,
      href: "/headteacher/students",
      section: "Staff Module",
    },
    {
      label: "Academic",
      icon: BookOpen,
      href: "/headteacher/academic",
      section: "Academics Module",
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/headteacher/reports",
      section: "Academics Module",
    },
    {
      label: "Assign Duties",
      icon: FileText,
      href: "/headteacher/duties",
      section: "Staff Duties Module",
    },
    {
      label: "Duty Ratings",
      icon: FileText,
      href: "/headteacher/ratings",
      section: "Staff Duties Module",
    },
    {
      label: "Payment Requests",
      icon: DollarSign,
      href: "/headteacher/payment-requests",
      section: "Requests Module",
    },
    {
      label: "Item Requests",
      icon: FileText,
      href: "/headteacher/item-requests",
      section: "Requests Module",
    },
    {
      label: "Dormitory Details",
      icon: FileText,
      href: "/dormitory/details",
      section: "Dormitory Module",
    },
    {
      label: "Dormitory Requirements",
      icon: Building2,
      href: "/dormitory/requirements",
      section: "Dormitory Module",
    },
    {
      label: "Student Status",
      icon: Users,
      href: "/dormitory/student-status",
      section: "Dormitory Module",
    },
    {
      label: "Occupancy Report",
      icon: FileText,
      href: "/dormitory/occupancy",
      section: "Dormitory Module",
    },
    { label: "Settings", icon: Settings, href: "/settings", section: "System" },
  ],
  dos: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dos",
      section: "Overview",
    },
    {
      label: "Manage Classes",
      icon: BookOpen,
      href: "/dos/classes",
      section: "Academics Module",
    },
    {
      label: "Brief Notes",
      icon: FileText,
      href: "/dos/notes",
      section: "Academics Module",
    },
    {
      label: "Termly Reports",
      icon: FileText,
      href: "/dos/reports",
      section: "Reports Module",
    },
    {
      label: "Monitor Teachers",
      icon: Users,
      href: "/dos/teachers",
      section: "Staff Module",
    },
    { label: "Settings", icon: Settings, href: "/settings", section: "System" },
  ],
  burser: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/burser",
      section: "Overview",
    },
    {
      label: "Transactions",
      icon: DollarSign,
      href: "/burser",
      section: "Finance Module",
    },
    { label: "Fees", icon: FileText, href: "/burser", section: "Finance" },
    {
      label: "Finances",
      icon: DollarSign,
      href: "/burser/finances",
      section: "Finance Module",
    },
    { label: "Settings", icon: Settings, href: "/settings", section: "System" },
  ],
  store: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/store",
      section: "Overview",
    },
    {
      label: "Inventory",
      icon: ShoppingCart,
      href: "/admin/store",
      section: "Inventory Module",
    },
    { label: "Settings", icon: Settings, href: "/settings", section: "System" },
  ],
  dormitory: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dormitory",
      section: "Overview",
    },
    {
      label: "Dormitories",
      icon: Building2,
      href: "/admin/dormitory",
      section: "Dormitory Module",
    },
    {
      label: "Details",
      icon: FileText,
      href: "/dormitory/details",
      section: "Dormitory Module",
    },
    {
      label: "Requirements",
      icon: Building2,
      href: "/dormitory/requirements",
      section: "Dormitory Module",
    },
    {
      label: "Student Status",
      icon: Users,
      href: "/dormitory/student-status",
      section: "Students Module",
    },
    {
      label: "Assign Students",
      icon: Users,
      href: "/dormitory/assignments",
      section: "Students Module",
    },
    {
      label: "Occupancy Report",
      icon: FileText,
      href: "/dormitory/occupancy",
      section: "Reports Module",
    },
    { label: "Settings", icon: Settings, href: "/settings", section: "System" },
  ],
};

const roleLabels = {
  admin: "Administrator",
  teacher: "Teacher",
  headteacher: "Head Teacher",
  burser: "Burser",
  store: "Store Manager",
  dormitory: "Dormitory Manager",
  dos: "Director of Studies",
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Always fetch item requests (hook must be called unconditionally)
  const { data: itemRequests = [] } = useItemRequests();

  if (!user) {
    return null; // ProtectedRoute should handle this, but just in case
  }

  const role = user.role;
  const userName = `${user.first_name} ${user.last_name}`;
  const items = navItems[role] || [];

  // Count pending notifications (pending item requests) - only for admin
  const pendingCount = useMemo(() => {
    if (role !== "admin") return 0;
    return (itemRequests as any[]).filter((r: any) => r.status === "pending")
      .length;
  }, [itemRequests, role]);

  // Search through navigation items
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    items.forEach((item) => {
      if (item.label.toLowerCase().includes(query)) {
        results.push({ label: item.label, href: item.href });
      }
      if (item.children) {
        item.children.forEach((child) => {
          if (child.label.toLowerCase().includes(query)) {
            results.push({
              label: `${item.label} > ${child.label}`,
              href: child.href,
            });
          }
        });
      }
    });
    return results;
  }, [searchQuery, items]);

  const handleNavigate = (href: string) => {
    navigate(href);
    setSearchQuery("");
    setSearchOpen(false);
  };

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
        className="hidden lg:flex flex-col bg-red-900 dark:bg-slate-900 fixed h-screen z-40"
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
                <h1 className="max-w-[150px] text-lg font-bold leading-tight text-white dark:text-white whitespace-normal break-words">
                  Kabale Parents SMS
                </h1>
                <p className="text-xs text-white/70 dark:text-white/70">
                  {roleLabels[role]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item, index) => {
            const isActive = location.pathname === item.href;
            const showSection =
              item.section && items[index - 1]?.section !== item.section;
            return (
              <div key={item.href}>
                {showSection && sidebarOpen && (
                  <p className="px-4 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    {item.section}
                  </p>
                )}
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-lg"
                      : "text-white/80 dark:text-white/80 hover:bg-white/10 hover:text-white dark:hover:bg-white/10 dark:hover:text-white",
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden text-white dark:text-white"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Toggle & Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
            {sidebarOpen && (
              <span className="font-medium text-white dark:text-white">
                Collapse
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-red-600/40 hover:text-white dark:text-white/80 dark:hover:bg-red-600/40 dark:hover:text-white transition-colors mt-1"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && (
              <span className="font-medium text-white dark:text-white">
                Logout
              </span>
            )}
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
              className="fixed left-0 top-0 h-full w-72 bg-red-900 dark:bg-slate-900 z-50 lg:hidden flex flex-col"
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
                {items.map((item, index) => {
                  const isActive = location.pathname === item.href;
                  const showSection =
                    item.section && items[index - 1]?.section !== item.section;
                  return (
                    <div key={item.href}>
                      {showSection && (
                        <p className="px-4 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 first:pt-0">
                          {item.section}
                        </p>
                      )}
                      <Link
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                          isActive
                            ? "bg-secondary text-secondary-foreground"
                            : "text-primary-foreground/80 hover:bg-sidebar-accent",
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </div>
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
          sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]",
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

              {/* Search Bar */}
              <div className="relative hidden sm:block">
                <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2 hover:bg-muted/80 transition">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                    className="bg-transparent border-none outline-none text-sm w-48 cursor-text"
                  />
                </div>
                {searchOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg p-0 z-50">
                    <div className="space-y-1 p-2">
                      {searchResults.length > 0 ? (
                        searchResults.map((result, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleNavigate(result.href)}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm transition"
                          >
                            {result.label}
                          </button>
                        ))
                      ) : searchQuery.trim() ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          No results found
                        </p>
                      ) : (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Type to search pages...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications - Only for Admin */}
              {role === "admin" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="relative p-2 rounded-lg hover:bg-muted transition">
                      <Bell className="w-5 h-5" />
                      {pendingCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        <p className="text-xs text-muted-foreground">
                          {pendingCount} pending item request
                          {pendingCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {pendingCount > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {(itemRequests as any[])
                            .filter((r) => r.status === "pending")
                            .slice(0, 5)
                            .map((request) => (
                              <div
                                key={request._id}
                                className="p-2 bg-muted rounded-md border-l-2 border-amber-500"
                              >
                                <p className="text-sm font-medium">
                                  {request.item_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Requested by: {request.requested_by}
                                </p>
                              </div>
                            ))}
                          {pendingCount > 5 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              +{pendingCount - 5} more pending requests
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigate("/admin/item-requests");
                            }}
                            className="w-full"
                          >
                            View All Requests
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No pending notifications
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {role !== "admin" && (
                <button className="p-2 rounded-lg hover:bg-muted transition">
                  <Bell className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary overflow-hidden flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={`${userName} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  )}
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
