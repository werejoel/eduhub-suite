import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  GraduationCap,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDashboard } from "@/lib/roleRoutes";

const features = [
  "Complete Student Management",
  "Academic Records & Grades",
  "Fee Collection & Tracking",
  "Dormitory Management",
  "Inventory & Store",
  "Staff & Teacher Portal",
];

const roleCards = [
  {
    title: "Teacher",
    description: "Manage students, marks & attendance",
    icon: BookOpen,
    color: "bg-emerald-600",
    surface: "border-emerald-200 bg-emerald-50/70",
    accent: "text-emerald-700",
  },
  {
    title: "Head Teacher",
    description: "Academic oversight & reports",
    icon: GraduationCap,
    color: "bg-amber-500",
    surface: "border-amber-200 bg-amber-50/70",
    accent: "text-amber-700",
  },
  {
    title: "Burser",
    description: "Financial management & transactions",
    icon: Users,
    color: "bg-[#800020]",
    surface: "border-rose-200 bg-rose-50/70",
    accent: "text-[#800020]",
  },
  {
    title: "Director of Studies",
    description: "Manage academics, classes & reports",
    icon: BookOpen,
    color: "bg-sky-600",
    surface: "border-sky-200 bg-sky-50/70",
    accent: "text-sky-700",
  },
  {
    title: "Store Manager",
    description: "Manage inventory and item requests",
    icon: Users,
    color: "bg-emerald-600",
    surface: "border-emerald-200 bg-emerald-50/70",
    accent: "text-emerald-700",
  },
  {
    title: "Dormitory Manager",
    description: "Manage rooms, occupancy & students",
    icon: GraduationCap,
    color: "bg-orange-500",
    surface: "border-orange-200 bg-orange-50/70",
    accent: "text-orange-700",
  },
];

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their dashboards
      const dashboardRoute = getRoleDashboard(user.role);
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, loading, navigate]);
  return (
    <div className="min-h-screen bg-[#800020]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-[#b8860b] blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-white blur-3xl animate-pulse-slow" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/20 px-4 py-2 backdrop-blur-sm mb-6">
                <GraduationCap className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium text-primary-foreground/90">
                  Kabale Parents School Management System
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl"
            >
              Managing School
              <br />
              <span className="text-secondary">Effortlessly</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80 lg:mx-0"
            >
              A comprehensive solution for managing students, teachers, fees,
              dormitories, and all aspects of school administration in one
              powerful platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Button asChild variant="hero" size="xl">
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="hero-outline" size="xl">
                <Link to="/login">Sign In</Link>
              </Button>
            </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-black/20 shadow-2xl"
            >
              <img
                src="/student-classroom.jpg"
                alt="Students learning together in a classroom"
                className="aspect-[4/3] w-full object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-5 pb-5 pt-16 text-left">
                <p className="text-sm font-semibold text-white">Every learner in view</p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">Track progress, attendance, fees, and achievement in one place.</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete suite of tools to streamline school operations
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {features.map((feature, idx) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
              >
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-foreground font-medium text-sm">
                  {feature}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section id="roles" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Choose Your Portal
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Access the dashboard tailored to your role
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roleCards.map((role, idx) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <Link
                  to="/login"
                  className={`group block h-full rounded-xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#800020] focus-visible:ring-offset-2 ${role.surface}`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className={`${role.color} flex h-10 w-10 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-110`}
                    >
                      <role.icon className="h-5 w-5 text-white" />
                    </div>
                    <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${role.accent}`} />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">
                    {role.title}
                  </h3>
                  <p className="mb-4 min-h-10 text-xs leading-5 text-muted-foreground">
                    {role.description}
                  </p>
                  <div className={`border-t pt-3 text-xs font-semibold ${role.accent} border-current/20`}>
                    Enter Portal
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#800020] py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-secondary" />
            <span className="text-primary-foreground font-bold text-lg">
             Kabale Parents School Management System
            </span>
          </div>
          <p className="text-primary-foreground/70 text-sm">
            © {currentYear} Kabale Parents School Management System. All rights reserved. Powered By Koboko WebTech Solutions Ltd
          </p>
        </div>
      </footer>
    </div>
  );
};
export default Index;
