import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  GraduationCap,
  Users,
  Shield,
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
    color: "bg-success",
  },
  {
    title: "Head Teacher",
    description: "Academic oversight & reports",
    icon: GraduationCap,
    color: "bg-warning",
  },
  {
    title: "Burser",
    description: "Financial management & transactions",
    icon: Users,
    color: "bg-primary",
  },
];

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their dashboards
      const dashboardRoute = getRoleDashboard(user.role);
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, loading, navigate]);
  return (
    <div className="min-h-screen bg-red-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-secondary rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-foreground rounded-full blur-3xl animate-pulse-slow" />
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm border border-secondary/30 rounded-full px-4 py-2 mb-6">
                <GraduationCap className="w-5 h-5 text-secondary" />
                <span className="text-primary-foreground/90 text-sm font-medium">
                  Kabale Parents School Management System
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight"
            >
              Managing School
              <br />
              <span className="text-secondary">Effortlessly</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto"
            >
              A comprehensive solution for managing students, teachers, fees,
              dormitories, and all aspects of school administration in one
              powerful platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
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

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                  className="block group bg-card rounded-2xl p-8 border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className={`${role.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <role.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {role.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {role.description}
                  </p>
                  <div className="flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all">
                    Enter Portal
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-red-900">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-secondary" />
            <span className="text-primary-foreground font-bold text-lg">
              EduManagement
            </span>
          </div>
          <p className="text-primary-foreground/70 text-sm">
            © 2025 Kabale Parents School Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
export default Index;
