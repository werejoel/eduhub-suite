import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { useStoreItems, useLowStockItems } from "@/hooks/useDatabase";
import { ShoppingCart, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "recharts";

export default function StoreDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: items = [], isLoading } = useStoreItems();
  const { data: lowStock = [] } = useLowStockItems(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    item_name: "",
    category: "",
    quantity_requested: 1,
    unit_price: 0,
    reason: "",
  });

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((s, it) => s + (it.quantity_in_stock || 0), 0);
    const lowCount = lowStock.length;
    return [
      { title: "Total Items", value: totalItems.toString(), change: `${totalQuantity} units`, changeType: "neutral" as const, icon: ShoppingCart, iconColor: "bg-primary" },
      { title: "Low Stock", value: lowCount.toString(), change: "Needs attention", changeType: "negative" as const, icon: ShoppingCart, iconColor: "bg-warning" },
    ];
  }, [items, lowStock]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    (items || []).forEach((it: any) => {
      const key = it.category || "Uncategorized";
      map[key] = (map[key] || 0) + (it.quantity_in_stock || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const topLow = useMemo(() => {
    return (lowStock || [])
      .map((it: any) => ({ name: it.item_name, qty: it.quantity_in_stock || 0 }))
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 6);
  }, [lowStock]);

  const handleRequestItem = async () => {
    if (!requestData.item_name || !requestData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/item-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <DashboardLayout>
      <PageHeader title="Store Dashboard" description="Overview of inventory" icon={ShoppingCart} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse" />
            ))
          : stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
            <h3 className="text-lg font-semibold mb-4">Inventory Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-56">
                {categoryData.length === 0 ? (
                  <div className="text-muted-foreground">No inventory data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="value" data={categoryData} cx="50%" cy="50%" outerRadius={80} label>
                        {categoryData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={
                            ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][idx % 6]
                          } />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Low Stock (top)</h4>
                {topLow.length === 0 ? (
                  <div className="text-muted-foreground">No low stock items</div>
                ) : (
                  <div className="space-y-3">
                    {topLow.map((it) => (
                      <div key={it.name} className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{it.name}</div>
                          <div className="text-sm text-muted-foreground">Qty: {it.qty}</div>
                        </div>
                        <div className="w-32">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-2 bg-warning" style={{ width: `${Math.min(100, (it.qty / 10) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-right">
                  <button onClick={() => navigate('/admin/store')} className="text-primary underline text-sm">View All</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left">
                  <div className="bg-primary p-2 rounded-lg">
                    <Plus className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-medium text-sm">Request New Item</span>
                </button>
              </DialogTrigger>
              <DialogContent>
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
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="bg-secondary p-2 rounded-lg">
                <ShoppingCart className="w-4 h-4 text-secondary-foreground" />
              </div>
              <span className="font-medium text-sm">Manage Store</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
