import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
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
import { ShoppingCart, Search, Package, DollarSign, AlertTriangle, Plus, Loader } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import { useStoreItems, useCreateStoreItem } from "@/hooks/useDatabase";
import { StoreItem } from "@/lib/types";

const columns = [
  { key: "item_name", label: "Item Name" },
  { key: "category", label: "Category" },
  { key: "quantity_in_stock", label: "Qty" },
  {
    key: "unit_price",
    label: "Unit Price",
    render: (value: number) => `$${value.toFixed(2)}`,
  },
  { key: "supplier", label: "Supplier" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => {
      const getStatus = (qty: number, reorder: number) => {
        if (qty <= 0) return "Out of Stock";
        if (qty <= reorder) return "Low Stock";
        return "In Stock";
      };
      const styles: { [key: string]: string } = {
        "In Stock": "bg-success/10 text-success",
        "Low Stock": "bg-warning/10 text-warning",
        "Out of Stock": "bg-destructive/10 text-destructive",
      };
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[value]}`}>
          {value}
        </span>
      );
    },
  },
];

export default function StorePage() {
  const { data: items, isLoading } = useStoreItems();
  const createMutation = useCreateStoreItem();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: "",
    item_code: "",
    category: "",
    quantity_in_stock: 0,
    reorder_level: 10,
    unit_price: 0,
    supplier: "",
  });

  const filteredItems = (items || []).filter((item) => {
    const matchesSearch = item.item_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = (items || []).reduce(
    (sum, item) => sum + item.quantity_in_stock,
    0
  );
  const totalValue = (items || []).reduce(
    (sum, item) => sum + item.quantity_in_stock * item.unit_price,
    0
  );
  const lowStockItems = (items || []).filter(
    (i) => i.quantity_in_stock <= i.reorder_level
  ).length;

  const uniqueCategories = [...new Set((items || []).map((i) => i.category))];

  const handleAddItem = async () => {
    if (!newItem.item_name || !newItem.category || !newItem.item_code) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createMutation.mutateAsync({
        item_name: newItem.item_name,
        item_code: newItem.item_code,
        category: newItem.category,
        quantity_in_stock: newItem.quantity_in_stock,
        reorder_level: newItem.reorder_level,
        unit_price: newItem.unit_price,
        supplier: newItem.supplier,
      });
      setNewItem({
        item_name: "",
        item_code: "",
        category: "",
        quantity_in_stock: 0,
        reorder_level: 10,
        unit_price: 0,
        supplier: "",
      });
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin" userName="Admin User">
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Store & Inventory"
        description="Manage school store items and inventory"
        icon={ShoppingCart}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Items"
          value={totalItems}
          change={`${items?.length || 0} products`}
          icon={Package}
          iconColor="bg-primary"
          delay={0}
        />
        <StatCard
          title="Inventory Value"
          value={`$${totalValue.toLocaleString()}`}
          icon={DollarSign}
          iconColor="bg-success"
          delay={0.1}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems}
          change="items need restock"
          changeType={lowStockItems > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          iconColor="bg-warning"
          delay={0.2}
        />
      </div>

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
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Package className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input
                    value={newItem.item_name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_name: e.target.value })
                    }
                    placeholder="Enter item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Item Code *</Label>
                  <Input
                    value={newItem.item_code}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_code: e.target.value })
                    }
                    placeholder="e.g., STN001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) =>
                        setNewItem({ ...newItem, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stationery">Stationery</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Uniforms">Uniforms</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={newItem.quantity_in_stock}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantity_in_stock: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.unit_price}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          unit_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reorder Level</Label>
                    <Input
                      type="number"
                      value={newItem.reorder_level}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          reorder_level: parseInt(e.target.value) || 10,
                        })
                      }
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    value={newItem.supplier}
                    onChange={(e) =>
                      setNewItem({ ...newItem, supplier: e.target.value })
                    }
                    placeholder="Supplier name"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddItem}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          data={filteredItems || []}
          isLoading={isLoading}
        />
      </motion.div>
    </DashboardLayout>
  );
}
