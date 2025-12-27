import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Record {
  id: string;
  type: string;
  title: string;
  date: string;
  createdBy: string;
  status: string;
}

const initialRecords: Record[] = [
  { id: "1", type: "Academic", title: "Term 1 Results 2024", date: "2024-03-15", createdBy: "Admin", status: "Published" },
  { id: "2", type: "Financial", title: "Monthly Fee Report - January", date: "2024-02-01", createdBy: "Accountant", status: "Published" },
  { id: "3", type: "Attendance", title: "Weekly Attendance Summary", date: "2024-01-29", createdBy: "System", status: "Published" },
  { id: "4", type: "Disciplinary", title: "Incident Report #45", date: "2024-01-25", createdBy: "Head Teacher", status: "Draft" },
  { id: "5", type: "Academic", title: "Class Performance Analysis", date: "2024-01-20", createdBy: "Teacher", status: "Published" },
  { id: "6", type: "Inventory", title: "Stock Audit Report Q4", date: "2024-01-15", createdBy: "Store Manager", status: "Published" },
];

const columns = [
  {
    key: "type",
    label: "Type",
    render: (value: string) => (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        {value}
      </span>
    ),
  },
  { key: "title", label: "Title" },
  { key: "date", label: "Date" },
  { key: "createdBy", label: "Created By" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === "Published"
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {value}
      </span>
    ),
  },
];

export default function RecordsPage() {
  const [records] = useState<Record[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || record.type === filterType;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = [...new Set(records.map((r) => r.type))];

  return (
    <DashboardLayout>
      <PageHeader
        title="Records & Reports"
        description="View and manage all school records and reports"
        icon={FileText}
        action={{
          label: "Generate Report",
          onClick: () => toast.info("Report generation feature"),
        }}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 border border-border shadow-md mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-md"
      >
        <DataTable
          columns={columns}
          data={filteredRecords.map((record) => ({
            ...record,
            actions: (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.success(`Downloading ${record.title}...`);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            ),
          }))}
        />
      </motion.div>
    </DashboardLayout>
  );
}
