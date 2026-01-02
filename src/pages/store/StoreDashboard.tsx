import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { useStoreItems, useLowStockItems } from "@/hooks/useDatabase";
import { ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  const { data: items = [], isLoading } = useStoreItems();
  const { data: lowStock = [] } = useLowStockItems(10);

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
              <button onClick={() => navigate('/admin/store')} className="text-primary underline text-sm">Manage</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
