import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { useStoreItems, useLowStockItems, useItemRequests } from "@/hooks/useDatabase";
import { ShoppingCart, Plus, TrendingUp, Package, AlertTriangle, Activity, BarChart3, PieChart as PieChartIcon, Download, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUGX } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const StoreDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: items = [], isLoading, refetch } = useStoreItems();
  const { data: lowStock = [] } = useLowStockItems(10);
  const { data: pendingRequests = [] } = useItemRequests("pending");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [requestData, setRequestData] = useState({
    item_name: "",
    category: "",
    quantity_requested: 1,
    unit_price: 0,
    reason: "",
  });

  const inventoryValue = useMemo(() => {
    return items.reduce(
      (sum, it) =>
        sum + (it.quantity_in_stock || 0) * (it.unit_price || 0),
      0
    );
  }, [items]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((s, it) => s + (it.quantity_in_stock || 0), 0);
    const lowCount = lowStock.length;
    const pendingCount = pendingRequests.length;

    return [
      { title: "Total Items", value: totalItems.toString(), change: `${totalQuantity} units`, changeType: "neutral" as const, icon: Package, iconColor: "bg-gradient-to-br from-blue-500 to-blue-600" },
      { title: "Inventory Value", value: formatUGX(inventoryValue), change: "approx.", changeType: "neutral" as const, icon: TrendingUp, iconColor: "bg-gradient-to-br from-green-500 to-green-600" },
      { title: "Low Stock", value: lowCount.toString(), change: "Needs attention", changeType: "negative" as const, icon: AlertTriangle, iconColor: "bg-gradient-to-br from-orange-500 to-orange-600" },
      { title: "Pending Requests", value: pendingCount.toString(), change: "Awaiting approval", changeType: "neutral" as const, icon: Activity, iconColor: "bg-gradient-to-br from-purple-500 to-purple-600" },
    ];
  }, [items, lowStock, inventoryValue, pendingRequests]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    (items || []).forEach((it: any) => {
      const key = it.category || "Uncategorized";
      map[key] = (map[key] || 0) + (it.quantity_in_stock || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const categoryValueData = useMemo(() => {
    const map: Record<string, number> = {};
    (items || []).forEach((it: any) => {
      const key = it.category || "Uncategorized";
      const itemValue = (it.quantity_in_stock || 0) * (it.unit_price || 0);
      map[key] = (map[key] || 0) + itemValue;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const barData = useMemo(() => {
    return categoryData.map((c) => ({ name: c.name, value: c.value }));
  }, [categoryData]);

  const recentRequests = useMemo(() => {
    return (pendingRequests || []).slice(0, 5);
  }, [pendingRequests]);

  const topLow = useMemo(() => {
    return (lowStock || [])
      .map((it: any) => ({ name: it.item_name, qty: it.quantity_in_stock || 0 }))
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 6);
  }, [lowStock]);

  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; total: number; value: number }> = {};
    (items || []).forEach((it: any) => {
      const key = it.category || "Uncategorized";
      if (!map[key]) {
        map[key] = { count: 0, total: 0, value: 0 };
      }
      map[key].count += 1;
      map[key].total += it.quantity_in_stock || 0;
      map[key].value += (it.quantity_in_stock || 0) * (it.unit_price || 0);
    });
    return Object.entries(map)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const handleRequestItem = async () => {
    if (!requestData.item_name || !requestData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/item-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("eduhub_token") || ""}`,
        },
        body: JSON.stringify({
          ...requestData,
          requested_by: user ? `${user.first_name} ${user.last_name}` : "Store Manager",
          status: "pending",
          created_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit request");

      toast.success("Item request submitted for approval");
      setRequestData({
        item_name: "",
        category: "",
        quantity_requested: 1,
        unit_price: 0,
        reason: "",
      });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  const handleExportData = () => {
    const csvContent = [
      ["Category", "Items", "Total Qty", "Total Value"],
      ...categoryStats.map(s => [s.category, s.count, s.total, s.value])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Store Dashboard" description="Overview of inventory" icon={ShoppingCart} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch?.()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse h-32" />
          ))
          : stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Charts Section */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Inventory Distribution</h3>
              <div className="flex gap-2">
                <Button
                  variant={chartType === "pie" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("pie")}
                  className="gap-2"
                >
                  <PieChartIcon className="w-4 h-4" />
                  Pie
                </Button>
                <Button
                  variant={chartType === "bar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Bar
                </Button>
              </div>
            </div>

            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No inventory data</p>
                <p className="text-sm">Add items to see distribution</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "pie" ? (
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : (
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all border border-primary/20 text-left group">
                  <div className="bg-primary p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="font-medium text-sm block">Request New Item</span>
                    <span className="text-xs text-muted-foreground">Submit for approval</span>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Request New Store Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Item Name *</Label>
                    <Input
                      value={requestData.item_name}
                      onChange={(e) =>
                        setRequestData({ ...requestData, item_name: e.target.value })
                      }
                      placeholder="Enter item name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={requestData.category}
                      onValueChange={(value) =>
                        setRequestData({ ...requestData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stationery">Stationery</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Uniforms">Uniforms</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity Requested</Label>
                      <Input
                        type="number"
                        min="1"
                        value={requestData.quantity_requested}
                        onChange={(e) =>
                          setRequestData({
                            ...requestData,
                            quantity_requested: parseInt(e.target.value) || 1,
                          })
                        }
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Est. Unit Price (UGX)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={requestData.unit_price}
                        onChange={(e) =>
                          setRequestData({
                            ...requestData,
                            unit_price: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Request</Label>
                    <Input
                      value={requestData.reason}
                      onChange={(e) =>
                        setRequestData({ ...requestData, reason: e.target.value })
                      }
                      placeholder="Why is this item needed?"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRequestItem}>Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={() => navigate('/admin/store')}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-all border border-border text-left group"
            >
              <div className="bg-secondary p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <span className="font-medium text-sm block">Manage Store</span>
                <span className="text-xs text-muted-foreground">View all items</span>
              </div>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-medium text-sm mb-3">Recent Requests</h4>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent requests</p>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((req: any, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{req.item_name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {req.quantity_requested}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 whitespace-nowrap">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Low Stock Alert
            </h3>
            <button
              onClick={() => navigate('/admin/store')}
              className="text-primary hover:underline text-sm font-medium"
            >
              View All →
            </button>
          </div>

          {topLow.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Package className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">All stocks are healthy!</p>
              <p className="text-sm">No low stock items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topLow.map((it) => (
                <div key={it.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {it.qty} unit{it.qty !== 1 ? 's' : ''} remaining
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-2 transition-all ${it.qty < 5 ? 'bg-red-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(100, (it.qty / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">
                    {Math.min(100, Math.round((it.qty / 10) * 100))}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>

          {categoryStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No categories yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((cat, idx) => (
                <div key={cat.category} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-medium">{cat.category}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatUGX(cat.value)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="text-xs">Items:</span>
                      <span className="ml-1 font-medium text-foreground">{cat.count}</span>
                    </div>
                    <div>
                      <span className="text-xs">Stock:</span>
                      <span className="ml-1 font-medium text-foreground">{cat.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
export default StoreDashboard;