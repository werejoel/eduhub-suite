import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  ShoppingCart,
  Search,
  Package,
  DollarSign,
  AlertTriangle,
  Plus,
  Loader,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import {
  useStoreItems,
  useCreateStoreItem,
  useDeleteStoreItem,
  useUpdateStoreItem,
  useStudents,
  useClasses,
  useUpdateStudent,
  useStudentStoreIntakes,
  useCreateStudentStoreIntake,
} from "@/hooks/useDatabase";
import { StoreItem, StudentRequirement } from "@/lib/types";
import { formatUGX } from "@/lib/utils";
import {
  STORE_ITEM_CATALOG,
  getStudentRequirements,
} from "@/lib/schoolConfig";
import { Textarea } from "@/components/ui/textarea";

const columns = [
  { key: "item_name", label: "Item Name" },
  { key: "category", label: "Category" },
  { key: "quantity_in_stock", label: "Qty" },
  {
    key: "unit_price",
    label: "Unit Price",
    render: (value: number) => formatUGX(value, { decimals: 2 }),
  },
  { key: "supplier", label: "Supplier" },
  {
    key: "status",
    label: "Status",
    render: (_: any, row: StoreItem) => {
      const qty = row.quantity_in_stock ?? 0;
      const reorder = row.reorder_level ?? 0;
      const status =
        qty <= 0 ? "Out of Stock" : qty <= reorder ? "Low Stock" : "In Stock";
      const styles: { [key: string]: string } = {
        "In Stock": "bg-success/10 text-success",
        "Low Stock": "bg-warning/10 text-warning",
        "Out of Stock": "bg-destructive/10 text-destructive",
      };
      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
        >
          {status}
        </span>
      );
    },
  },
];

//Main Function
const StorePage = () => {
  const { user } = useAuth();
  const { data: items, isLoading } = useStoreItems();
  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const { data: intakes = [] } = useStudentStoreIntakes();
  const createMutation = useCreateStoreItem();
  const updateMutation = useUpdateStoreItem();
  const deleteMutation = useDeleteStoreItem();
  const updateStudent = useUpdateStudent();
  const createIntake = useCreateStudentStoreIntake();

  const [showLowOnly, setShowLowOnly] = useState(false);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [intakeForm, setIntakeForm] = useState({
    student_id: "",
    catalog_key: "",
    custom_name: "",
    quantity: 1,
    requiredQuantity: 0,
    unit: "kgs",
    notes: "",
  });

  const intakeTotals = useMemo(() => {
    const byItem: Record<string, number> = {};
    intakes.forEach((row) => {
      const key = row.item_name || "Unknown";
      byItem[key] = (byItem[key] || 0) + (row.quantity || 0);
    });
    return Object.entries(byItem).map(([name, qty]) => ({ name, qty }));
  }, [intakes]);

  const recordStudentIntake = async () => {
    if (!intakeForm.student_id || intakeForm.quantity <= 0) {
      toast.error("Select a student and enter quantity");
      return;
    }
    const catalog = STORE_ITEM_CATALOG.find((c) => c.key === intakeForm.catalog_key);
    const itemName =
      intakeForm.custom_name.trim() || catalog?.label || intakeForm.catalog_key;
    if (!itemName) {
      toast.error("Select or enter an item name");
      return;
    }
    const student = students.find((s) => s.id === intakeForm.student_id);
    if (!student) return;

    const className =
      classes.find((c) => c.id === student.class_id)?.class_name || "";
    const checklist = getStudentRequirements(
      student.boarding_status || "day",
      className,
      student.requirements_checklist || [],
    );
    const normalizedItemName = itemName.trim().toLowerCase();
    const requirementIndex = checklist.findIndex(
      (requirement) =>
        (intakeForm.catalog_key &&
          requirement.catalogKey === intakeForm.catalog_key) ||
        requirement.name.trim().toLowerCase() === normalizedItemName,
    );
    const updatedChecklist: StudentRequirement[] = checklist.map((req, index) => {
      if (index !== requirementIndex) return req;
      const brought = (req.broughtQuantity ?? 0) + intakeForm.quantity;
      const required = req.requiredQuantity ?? 0;
      return {
        ...req,
        broughtQuantity: brought,
        completed: required > 0 ? brought >= required : brought > 0,
        completedDate:
          required > 0 && brought >= required
            ? new Date().toISOString()
            : req.completedDate,
      };
    });
      if (requirementIndex < 0) {
        const requiredQuantity =
          intakeForm.requiredQuantity ||
          catalog?.defaultRequired ||
          intakeForm.quantity;
        updatedChecklist.push({
          id: `intake-${intakeForm.catalog_key || normalizedItemName.replace(/\s+/g, "-")}-${Date.now()}`,
          name: itemName,
          catalogKey: intakeForm.catalog_key || undefined,
          requiredQuantity,
          broughtQuantity: intakeForm.quantity,
          unit: intakeForm.unit || catalog?.unit,
          completed: intakeForm.quantity >= requiredQuantity,
          completedDate:
            intakeForm.quantity >= requiredQuantity
              ? new Date().toISOString()
              : undefined,
        });
      }

    const storeMatch = (items || []).find((it) =>
        it.item_name.trim().toLowerCase() === normalizedItemName,
    );

    try {
      await createIntake.mutateAsync({
        student_id: intakeForm.student_id,
        item_name: itemName,
        catalog_key: intakeForm.catalog_key || undefined,
        quantity: intakeForm.quantity,
        unit: intakeForm.unit || catalog?.unit,
        recorded_by: user ? `${user.first_name} ${user.last_name}` : "Admin",
        notes: intakeForm.notes,
      });
      await updateStudent.mutateAsync({
        id: student.id,
        updates: { requirements_checklist: updatedChecklist },
      });
      if (storeMatch) {
        await updateMutation.mutateAsync({
          id: storeMatch.id,
          updates: {
            quantity_in_stock: Math.max(
              0,
              (storeMatch.quantity_in_stock || 0) + intakeForm.quantity,
            ),
          },
        });
      }
      setIntakeForm({
        student_id: "",
        catalog_key: "",
        custom_name: "",
        quantity: 1,
        requiredQuantity: 0,
        unit: "kgs",
        notes: "",
      });
      toast.success("Items recorded for student and store updated");
    } catch (e) {
      console.error(e);
    }
  };

  //filteredItems
  const filteredItems = (items || []).filter((item) => {
    const matchesSearch = item.item_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const visibleItems = showLowOnly
    ? (filteredItems || []).filter(
        (i) => (i.quantity_in_stock ?? 0) <= (i.reorder_level ?? 0)
      )
    : filteredItems;

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
      toast.error("All required fields must be completed.");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          updates: {
            item_name: newItem.item_name,
            item_code: newItem.item_code,
            category: newItem.category,
            quantity_in_stock: newItem.quantity_in_stock,
            reorder_level: newItem.reorder_level,
            unit_price: newItem.unit_price,
            supplier: newItem.supplier,
          },
        });
      } else {
        await createMutation.mutateAsync({
          item_name: newItem.item_name,
          item_code: newItem.item_code,
          category: newItem.category,
          quantity_in_stock: newItem.quantity_in_stock,
          reorder_level: newItem.reorder_level,
          unit_price: newItem.unit_price,
          supplier: newItem.supplier,
        });
      }
      setNewItem({
        item_name: "",
        item_code: "",
        category: "",
        quantity_in_stock: 0,
        reorder_level: 10,
        unit_price: 0,
        supplier: "",
      });
      setEditingId(null);
      setDialogOpen(false);
    } catch (error) {
      console.error(
        editingId ? "Error updating item:" : "Error creating item:",
        error
      );
    }
  };

  //handleEdit
  const handleEdit = (it: StoreItem) => {
    setEditingId(it.id as string);
    setNewItem({
      item_name: it.item_name || "",
      item_code: it.item_code || "",
      category: it.category || "",
      quantity_in_stock: it.quantity_in_stock || 0,
      reorder_level: it.reorder_level || 10,
      unit_price: it.unit_price || 0,
      supplier: it.supplier || "",
    });
    setDialogOpen(true);
  };

  //handleDelete
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Store & Inventory"
        description="Manage school store items and inventory"
        icon={ShoppingCart}
      />

      {lowStockItems > 0 && (
        <div className="mb-6 p-3 rounded-md bg-warning/10 text-warning flex items-center justify-between">
          <div className="font-medium">
            {lowStockItems} item(s) are low or out of stock
          </div>
          <div>
            <Button
              size="sm"
              variant={showLowOnly ? "hero-outline" : "outline"}
              onClick={() => setShowLowOnly((s) => !s)}
            >
              {showLowOnly ? "Show all items" : "Show low stock"}
            </Button>
          </div>
        </div>
      )}

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
          value={formatUGX(totalValue)}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 border border-border shadow-md mb-6"
      >
        <h3 className="text-lg font-semibold mb-4">Record items brought by student</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select
              value={intakeForm.student_id}
              onValueChange={(v) =>
                setIntakeForm({ ...intakeForm, student_id: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.admission_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Item (dropdown)</Label>
            <Select
              value={intakeForm.catalog_key}
              onValueChange={(v) => {
                const cat = STORE_ITEM_CATALOG.find((c) => c.key === v);
                setIntakeForm({
                  ...intakeForm,
                  catalog_key: v,
                  requiredQuantity: cat?.defaultRequired || 0,
                  unit: cat?.unit || intakeForm.unit,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose item" />
              </SelectTrigger>
              <SelectContent>
                {STORE_ITEM_CATALOG.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Or custom item name</Label>
            <Input
              value={intakeForm.custom_name}
              onChange={(e) =>
                setIntakeForm({ ...intakeForm, custom_name: e.target.value })
              }
              placeholder="If not in list"
            />
          </div>
          <div className="space-y-2">
            <Label>Quantity brought</Label>
            <Input
              type="number"
              min={0}
              value={intakeForm.quantity}
              onChange={(e) =>
                setIntakeForm({
                  ...intakeForm,
                  quantity: Number(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Required quantity</Label>
            <Input
              type="number"
              min={0}
              value={intakeForm.requiredQuantity}
              onChange={(e) =>
                setIntakeForm({
                  ...intakeForm,
                  requiredQuantity: Number(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Input
              value={intakeForm.unit}
              onChange={(e) =>
                setIntakeForm({ ...intakeForm, unit: e.target.value })
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={intakeForm.notes}
              onChange={(e) =>
                setIntakeForm({ ...intakeForm, notes: e.target.value })
              }
              rows={2}
            />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={recordStudentIntake}
          disabled={createIntake.isPending}
        >
          Save intake & update balance
        </Button>
        {intakeTotals.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Store intake totals (all students)</p>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {intakeTotals.map((t) => (
                <li key={t.name} className="rounded-md bg-muted px-2 py-1">
                  {t.name}: {t.qty}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

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
                <DialogTitle>
                  {editingId ? "Edit Item" : "Add New Item"}
                </DialogTitle>
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
                    <Label>Unit Price (UGX)</Label>
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
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddItem}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingId
                    ? updateMutation.isPending
                      ? "Saving..."
                      : "Save Changes"
                    : createMutation.isPending
                    ? "Adding..."
                    : "Add Item"}
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
          data={(visibleItems || []).map((item) => ({
            ...item,
            actions: (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            ),
          }))}
          isLoading={isLoading}
        />
      </motion.div>
    </DashboardLayout>
  );
}
export default StorePage;