# Example Implementations for Remaining Pages

## Template: How to Update Other Pages

This guide shows how to update remaining pages using the Supabase hooks.

---

## 1. FeesPage.tsx Example

```tsx
import { useState } from "react";
import { useFees, useCreateFee, useUpdateFee } from "@/hooks/useDatabase";
import { toast } from "sonner";

export default function FeesPage() {
  const { data: fees, isLoading } = useFees();
  const createMutation = useCreateFee();
  const updateMutation = useUpdateFee();
  
  const [paymentDialog, setPaymentDialog] = useState<string | null>(null);

  const handleRecordPayment = async (feeId: string) => {
    try {
      await updateMutation.mutateAsync({
        id: feeId,
        updates: { 
          payment_status: "paid",
          paid_date: new Date().toISOString()
        }
      });
      setPaymentDialog(null);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  const totalCollected = fees
    ?.filter(f => f.payment_status === "paid")
    .reduce((sum, f) => sum + f.amount, 0) || 0;
    
  const totalPending = fees
    ?.filter(f => f.payment_status === "pending")
    .reduce((sum, f) => sum + f.amount, 0) || 0;
    
  const totalOverdue = fees
    ?.filter(f => f.payment_status === "overdue")
    .reduce((sum, f) => sum + f.amount, 0) || 0;

  return (
    <DashboardLayout role="admin" userName="Admin User">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Collected"
          value={`$${totalCollected.toLocaleString()}`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending"
          value={`$${totalPending.toLocaleString()}`}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Overdue"
          value={`$${totalOverdue.toLocaleString()}`}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Table with fees data */}
      <DataTable
        columns={columns}
        data={fees || []}
        onEdit={(row) => handleRecordPayment(row.id)}
      />
    </DashboardLayout>
  );
}
```

---

## 2. AttendancePage.tsx Example

```tsx
import { useState } from "react";
import { useAttendanceByClass, useBulkCreateAttendance } from "@/hooks/useDatabase";
import { Attendance } from "@/lib/types";

export default function AttendancePage() {
  const classId = "some-class-id"; // Get from URL params
  const { data: attendance, isLoading } = useAttendanceByClass(classId);
  const bulkCreateMutation = useBulkCreateAttendance();
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<
    Omit<Attendance, "id" | "created_at" | "updated_at">[]
  >([]);

  const handleSubmitAttendance = async () => {
    try {
      await bulkCreateMutation.mutateAsync(attendanceRecords);
      setAttendanceRecords([]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout role="teacher" userName="Teacher User">
      <PageHeader
        title="Attendance Management"
        icon={Users}
      />

      {/* Date picker */}
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      {/* Attendance table with checkboxes */}
      <Button onClick={handleSubmitAttendance}>
        Submit Attendance
      </Button>
    </DashboardLayout>
  );
}
```

---

## 3. MarksPage.tsx Example

```tsx
import { useState } from "react";
import { useMarksByClass, useBulkCreateMarks } from "@/hooks/useDatabase";
import { Mark } from "@/lib/types";

export default function MarksPage() {
  const classId = "some-class-id";
  const { data: marks, isLoading } = useMarksByClass(classId);
  const bulkCreateMutation = useBulkCreateMarks();
  
  const [examType, setExamType] = useState("midterm");
  const [marksData, setMarksData] = useState<
    Omit<Mark, "id" | "created_at" | "updated_at">[]
  >([]);

  const handleSubmitMarks = async () => {
    try {
      await bulkCreateMutation.mutateAsync(marksData);
      setMarksData([]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout role="teacher" userName="Teacher User">
      <PageHeader title="Marks Management" />
      
      <Select value={examType} onValueChange={setExamType}>
        <SelectTrigger>
          <SelectValue placeholder="Select exam type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="midterm">Midterm</SelectItem>
          <SelectItem value="final">Final</SelectItem>
          <SelectItem value="quiz">Quiz</SelectItem>
        </SelectContent>
      </Select>

      {/* Table for entering marks */}
      <Button onClick={handleSubmitMarks} disabled={bulkCreateMutation.isPending}>
        {bulkCreateMutation.isPending ? "Submitting..." : "Submit Marks"}
      </Button>
    </DashboardLayout>
  );
}
```

---

## 4. ClassesPage.tsx Example

```tsx
import { useState } from "react";
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass } from "@/hooks/useDatabase";
import { useTeachers } from "@/hooks/useDatabase";
import { Class } from "@/lib/types";

export default function ClassesPage() {
  const { data: classes, isLoading } = useClasses();
  const { data: teachers } = useTeachers();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    class_name: "",
    class_code: "",
    form_number: 0,
    teacher_id: "",
    capacity: 0,
  });

  const handleAddClass = async () => {
    try {
      await createMutation.mutateAsync({
        class_name: newClass.class_name,
        class_code: newClass.class_code,
        form_number: newClass.form_number,
        teacher_id: newClass.teacher_id,
        capacity: newClass.capacity,
      });
      setNewClass({
        class_name: "",
        class_code: "",
        form_number: 0,
        teacher_id: "",
        capacity: 0,
      });
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Classes Management"
        action={{
          label: "Add Class",
          onClick: () => setDialogOpen(true),
        }}
      />

      <DataTable columns={columns} data={classes || []} />

      {/* Add Class Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          
          <Input
            placeholder="Class Name"
            value={newClass.class_name}
            onChange={(e) => setNewClass({...newClass, class_name: e.target.value})}
          />
          
          <Input
            placeholder="Class Code"
            value={newClass.class_code}
            onChange={(e) => setNewClass({...newClass, class_code: e.target.value})}
          />
          
          <Select value={newClass.teacher_id} onValueChange={(val) => setNewClass({...newClass, teacher_id: val})}>
            <SelectTrigger>
              <SelectValue placeholder="Select Teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers?.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleAddClass} disabled={createMutation.isPending}>
            Add Class
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
```

---

## 5. StorePage.tsx Example

```tsx
import { useStoreItems, useLowStockItems, useUpdateStoreItem } from "@/hooks/useDatabase";
import { StoreItem } from "@/lib/types";

export default function StorePage() {
  const { data: items } = useStoreItems();
  const { data: lowStockItems } = useLowStockItems(10);
  const updateMutation = useUpdateStoreItem();

  const handleUpdateStock = async (itemId: string, newQuantity: number) => {
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        updates: { quantity_in_stock: newQuantity }
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Store Management"
        description="Manage inventory and stock levels"
      />

      {/* Low Stock Alert */}
      {lowStockItems && lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Low Stock Items</AlertTitle>
          <AlertDescription>
            {lowStockItems.length} items are below reorder level
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={items || []}
      />
    </DashboardLayout>
  );
}
```

---

## 6. DormitoryPage.tsx Example

```tsx
import { useDormitories, useCreateDormitory, useUpdateDormitory } from "@/hooks/useDatabase";

export default function DormitoryPage() {
  const { data: dormitories, isLoading } = useDormitories();
  const createMutation = useCreateDormitory();
  const updateMutation = useUpdateDormitory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDormitory, setNewDormitory] = useState({
    dormitory_name: "",
    dormitory_type: "boys" as const,
    capacity: 0,
    location: "",
  });

  const handleAddDormitory = async () => {
    try {
      await createMutation.mutateAsync({
        dormitory_name: newDormitory.dormitory_name,
        dormitory_type: newDormitory.dormitory_type,
        capacity: newDormitory.capacity,
        location: newDormitory.location,
      });
      setNewDormitory({
        dormitory_name: "",
        dormitory_type: "boys",
        capacity: 0,
        location: "",
      });
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <PageHeader
        title="Dormitory Management"
        action={{
          label: "Add Dormitory",
          onClick: () => setDialogOpen(true),
        }}
      />

      <DataTable columns={columns} data={dormitories || []} />

      {/* Add Dormitory Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {/* Form fields */}
          <Button onClick={handleAddDormitory}>
            Add Dormitory
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
```

---

## Pattern Summary

All remaining pages follow this pattern:

1. **Import hooks** from `@/hooks/useDatabase`
2. **Fetch data** using `useQuery` hooks (useStudents, useClasses, etc.)
3. **Handle mutations** with mutation hooks (useCreate*, useUpdate*, useDelete*)
4. **Display loading** state while data is being fetched
5. **Show data** in DataTable or custom components
6. **Handle actions** (add, edit, delete) by calling mutation functions
7. **Show errors/success** via toast notifications (automatic from hooks)

## Copy-Paste Framework

```tsx
import { useXxx, useCreateXxx, useUpdateXxx, useDeleteXxx } from "@/hooks/useDatabase";

export default function XxxPage() {
  const { data: items, isLoading } = useXxx();
  const createMutation = useCreateXxx();
  const updateMutation = useUpdateXxx();
  const deleteMutation = useDeleteXxx();

  const handleAction = async () => {
    try {
      await createMutation.mutateAsync({ /* data */ });
      // Dialog closes automatically
    } catch (error) {
      // Toast shows error automatically
    }
  };

  if (isLoading) return <Loader />;

  return (
    <DashboardLayout>
      <PageHeader title="Title" />
      <DataTable data={items} />
    </DashboardLayout>
  );
}
```

That's all! The hooks handle everything else.
