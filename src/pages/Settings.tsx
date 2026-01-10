import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Lock,
  Bell,
  Palette,
  LogOut,
  Mail,
  Phone,
  GraduationCap,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  BookOpen,
  Download,
  Clock,
} from "lucide-react";

type ProfileFormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subject: string;
};

type PasswordFormData = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type Preferences = {
  theme: string;
  notifications: boolean;
  email_notifications: boolean;
  sound_alerts: boolean;
  desktop_notifications: boolean;
};

export default function SettingsPage() {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<ProfileFormData>({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: (user as any)?.phone || "",
    subject: (user as any)?.subject || "",
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [preferences, setPreferences] = useState<Preferences>({
    theme: localStorage.getItem("theme") || "system",
    notifications: localStorage.getItem("notifications") !== "false",
    email_notifications: localStorage.getItem("email_notifications") !== "false",
    sound_alerts: localStorage.getItem("sound_alerts") !== "false",
    desktop_notifications: localStorage.getItem("desktop_notifications") !== "false",
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  // Helpers
  const getInitials = () => {
    return `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();
  };

  const roleLabel = useMemo(() => {
    const roles: Record<string, string> = {
      admin: "Administrator",
      teacher: "Teacher",
      headteacher: "Head Teacher",
      bursar: "Bursar", // corrected spelling
      store: "Store Manager",
      dormitory: "Dormitory Manager",
    };
    return roles[user?.role || ""] || user?.role || "User";
  }, [user?.role]);

  const isTeacher = user?.role === "teacher" || user?.role === "headteacher";

  // Handlers
  const handleProfileChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfile(true);

    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          subject: profileData.subject,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      return toast.error("Passwords do not match");
    }

    if (passwordData.new_password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsLoadingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to change password");
      }

      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("Password changed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(key, String(value));
    if (key === "notifications" || key === "email_notifications" || key === "sound_alerts" || key === "desktop_notifications") {
      toast.success(`${key.replace(/_/g, " ")} ${value ? "enabled" : "disabled"}`);
    }
  };

  const handleThemeChange = (theme: string) => {
    setPreferences((prev) => ({ ...prev, theme }));
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    toast.success(`Theme changed to ${theme}`);
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else if (theme === "light") {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }
    }
  };

  // Apply theme on mount
  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const handleExportData = () => {
    const data = {
      user: {
        name: `${user?.first_name} ${user?.last_name}`,
        email: user?.email,
        role: user?.role,
        registered: user?.createdAt,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user-data-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Manage your account, security, and preferences"
        icon={Settings}
      />

      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <Lock className="w-4 h-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Palette className="w-4 h-4" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <FileText className="w-4 h-4" /> Data
            </TabsTrigger>
          </TabsList>

          {/* ── PROFILE ── */}
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {/* Profile Header */}
              <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary-foreground">
                      {getInitials()}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">
                        {user?.first_name} {user?.last_name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline">{roleLabel}</Badge>
                        {user?.status === "active" && (
                          <span className="flex items-center gap-1 text-success text-sm">
                            <CheckCircle2 className="w-4 h-4" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" /> Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileChange} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-muted-foreground">Role</Label>
                        <div className="mt-2 p-3 bg-muted rounded-lg font-medium">{roleLabel}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email Address</Label>
                        <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-between">
                          {profileData.email}
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+256 700 000 000"
                        className="mt-1"
                      />
                    </div>

                    {isTeacher && (
                      <div>
                        <Label htmlFor="subject">Subject / Department</Label>
                        <Input
                          id="subject"
                          value={profileData.subject}
                          onChange={(e) => setProfileData({ ...profileData, subject: e.target.value })}
                          placeholder="e.g. Mathematics, Science"
                          className="mt-1"
                        />
                      </div>
                    )}

                    <Button type="submit" disabled={isLoadingProfile} className="w-full">
                      {isLoadingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── SECURITY / PASSWORD ── */}
          <TabsContent value="password">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Change Password
                  </CardTitle>
                  <CardDescription>Keep your account secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
                    <p className="text-sm flex items-start gap-2 text-blue-800 dark:text-blue-200">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      Use a strong password (min. 6 characters, mix of letters, numbers & symbols recommended)
                    </p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    {(["current", "new", "confirm"] as const).map((field) => (
                      <div key={field}>
                        <Label htmlFor={`${field}_password`}>
                          {field === "current" ? "Current" : field === "new" ? "New" : "Confirm"} Password
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            id={`${field}_password`}
                            type={showPasswords[field] ? "text" : "password"}
                            value={passwordData[`${field}_password` as keyof PasswordFormData]}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                [`${field}_password`]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${field === "current" ? "current" : "new"} password`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                [field]: !prev[field],
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showPasswords[field] ? (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        {field === "new" && (
                          <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
                        )}
                      </div>
                    ))}

                    <Button type="submit" disabled={isLoadingPassword} className="w-full">
                      {isLoadingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── PREFERENCES ── */}
          <TabsContent value="preferences">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" /> Appearance
                  </CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base">Theme</Label>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        {(["system", "light", "dark"] as const).map((theme) => (
                          <button
                            key={theme}
                            onClick={() => handleThemeChange(theme)}
                            className={`p-4 rounded-lg border-2 transition-all text-center capitalize ${
                              preferences.theme === theme
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            {theme === "system" && "🖥️ System"}
                            {theme === "light" && "☀️ Light"}
                            {theme === "dark" && "🌙 Dark"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── NOTIFICATIONS ── */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" /> Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "notifications", label: "Push Notifications", desc: "In-app alerts" },
                    { key: "email_notifications", label: "Email Notifications", desc: "Email updates" },
                    { key: "sound_alerts", label: "Sound Alerts", desc: "Play sound on notification" },
                    { key: "desktop_notifications", label: "Desktop Notifications", desc: "Browser notifications" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-muted/40 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Button
                        variant={preferences[item.key as keyof Preferences] ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          updatePreference(item.key as keyof Preferences, !preferences[item.key as keyof Preferences])
                        }
                      >
                        {preferences[item.key as keyof Preferences] ? "On" : "Off"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── DATA & LOGOUT ── */}
          <TabsContent value="data">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-muted-foreground text-sm">Member Since</Label>
                      <div className="mt-2 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Email Status</Label>
                      <div className="mt-2">
                        <Badge variant={user?.email_confirmed ? "default" : "secondary"}>
                          {user?.email_confirmed ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" /> Export Data
                    </CardTitle>
                    <CardDescription>Download your account data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleExportData} variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Export My Data (JSON)
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <LogOut className="w-5 h-5" /> Sign Out
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleLogout} className="w-full">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}