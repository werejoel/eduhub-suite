import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Users, Phone, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useTeachers } from "@/hooks/useDatabase";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export default function TeachersPage() {
  const { data: teachers = [], isLoading } = useTeachers();
  const [search, setSearch] = useState("");

  const filtered = teachers.filter((t: any) => 
    t.first_name.toLowerCase().includes(search.toLowerCase()) || 
    t.last_name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate analytics
  const analytics = useMemo(() => {
    const active = teachers.filter((t: any) => t.status === 'active' || !t.status).length;
    const inactive = teachers.filter((t: any) => t.status === 'inactive').length;
    const withSubject = teachers.filter((t: any) => t.subject && t.subject !== "").length;
    const total = teachers.length;
    
    return { active, inactive, withSubject, total };
  }, [teachers]);

  return (
    <DashboardLayout>
      <PageHeader title="Monitor Teachers" description="View active teachers and their status" icon={Users} />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Teachers</p>
              <p className="text-3xl font-bold">{analytics.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Teachers</p>
              <p className="text-3xl font-bold text-green-600">{analytics.active}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Inactive Teachers</p>
              <p className="text-3xl font-bold text-red-600">{analytics.inactive}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">With Subject</p>
              <p className="text-3xl font-bold text-purple-600">{analytics.withSubject}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Teachers List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-md"
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Teachers Directory</h3>
          <div className="flex gap-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={search} 
              onChange={(e: any) => setSearch(e.target.value)} 
              className="pl-2"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading teachers...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No teachers found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((teacher: any, index: number) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 border-2 rounded-xl transition-all hover:shadow-lg ${
                  teacher.status === 'active' || !teacher.status
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-transparent'
                    : 'border-red-200 bg-gradient-to-br from-red-50 to-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-foreground">{teacher.first_name} {teacher.last_name}</h4>
                    <p className="text-xs text-muted-foreground">{teacher.subject || "No subject assigned"}</p>
                  </div>
                  {teacher.status === 'active' || !teacher.status ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-green-100 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 text-green-700" />
                      <span className="text-xs font-medium text-green-700">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-red-100 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                      <span className="text-xs font-medium text-red-700">Inactive</span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <a href={`mailto:${teacher.email}`} className="text-sm text-blue-600 hover:underline truncate">
                      {teacher.email}
                    </a>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{teacher.phone}</span>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="mt-3 pt-3 border-t space-y-1 text-xs">
                  {teacher.qualification && (
                    <p className="text-muted-foreground"><strong>Qualification:</strong> {teacher.qualification}</p>
                  )}
                  {teacher.employment_date && (
                    <p className="text-muted-foreground"><strong>Joined:</strong> {new Date(teacher.employment_date).toLocaleDateString()}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
