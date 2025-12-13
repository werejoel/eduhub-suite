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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Search, Package, DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";

interface StoreItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  status: string;
}

const initialItems: StoreItem[] = [
  { id: "1", name: "Notebooks (Pack of 10)", category: "Stationery", quantity: 150, unitPrice: 25, supplier: "ABC Supplies", status: "In Stock" },
  { id: "2", name: "Pens (Blue)", category: "Stationery", quantity: 500, unitPrice: 2, supplier: "ABC Supplies", status: "In Stock" },
  { id: "3", name: "Science Lab Coat", category: "Uniforms", quantity: 45, unitPrice: 35, supplier: "Uniform House", status: "In Stock" },
  { id: "4", name: "Mathematics Textbook Gr.10", category: "Books", quantity: 8, unitPrice: 45, supplier: "EduBooks Ltd", status: "Low Stock" },
  { id: "5", name: "School Bags", category: "Accessories", quantity: 0, unitPrice: 50, supplier: "BagMart", status: "Out of Stock" },
  { id: "6", name: "Ruler Set", category: "Stationery", quantity: 200, unitPrice: 5, supplier: "ABC Supplies", status: "In Stock" },
];

const columns = [
  { key: "name", label: "Item Name" },
  { key: "category", label: "Category" },
  { key: "quantity", label: "Qty" },
  {
    key: "unitPrice",
    label: "Unit Price",
    render: (value: number) => `$${value.toFixed(2)}`,
  },
  { key: "supplier", label: "Supplier" },
  {
    key: "status",
    label: "Status",
    render: (value: string) => {
      const styles = {
        "In Stock": "bg-success/10 text-success",
        "Low Stock": "bg-warning/10 text-warning",
        "Out of Stock": "bg-destructive/10 text-destructive",
      };
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[value as keyof typeof styles]}`}>
          {value}
        </span>
      );
    },
  },
];

export default function StorePage() {
  const [items, setItems] = useState<StoreItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    quantity: 0,
    unitPrice: 0,
    supplier: "",
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const lowStockItems = items.filter((i) => i.status === "Low Stock" || i.status === "Out of Stock").length;

  const uniqueCategories = [...new Set(items.map((i) => i.category))];

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category) {
      toast.error("Please fill in required fields");
      return;
    }
    const item: StoreItem = {
      id: String(Date.now()),
      ...newItem,
      status: newItem.quantity > 10 ? "In Stock" : newItem.quantity > 0 ? "Low Stock" : "Out of Stock",
    };
    setItems([item, ...items]);
    setNewItem({ name: "", category: "", quantity: 0, unitPrice: 0, supplier: "" });
    setDialogOpen(false);
    toast.success("Item added successfully");
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Store & Inventory"
        description="Manage school store items and inventory"
        icon={ShoppingCart}
        action={{
          label: "Add Item",
          onClick: () => setDialogOpen(true),
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Items"
          value={totalItems}
          change={`${items.length} products`}
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
        </div>
      </motion.div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        onEdit={(row) => toast.info(`Edit ${row.name}`)}
        onView={(row) => toast.info(`View ${row.name} details`)}
        onDelete={(row) => {
          setItems(items.filter((i) => i.id !== row.id));
          toast.success("Item removed");
        }}
      />

      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem({ ...newItem, category: value })}
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
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
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
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
