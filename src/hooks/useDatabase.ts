import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  studentService,
  teacherService,
  classService,
  feeService,
  attendanceService,
  markService,
  dormitoryService,
  roomService,
  assignmentLogService,
  occupancyService,
  storeService,
  dutyService,
  ratingService,
  paymentRequestService,
} from "@/lib/services";
import {
  Student,
  Teacher,
  Class,
  Fee,
  Attendance,
  Mark,
  Dormitory,
  StoreItem,
  TeacherDuty,
  DutyRating,
  PaymentRequest,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const QUERY_KEYS = {
  students: ["students"],
  studentById: (id: string) => ["students", id],
  teachers: ["teachers"],
  teacherById: (id: string) => ["teachers", id],
  classes: ["classes"],
  classById: (id: string) => ["classes", id],
  fees: ["fees"],
  feesByStudent: (studentId: string) => ["fees", "student", studentId],
  attendance: ["attendance"],
  attendanceByStudent: (studentId: string) => [
    "attendance",
    "student",
    studentId,
  ],
  attendanceByClass: (classId: string) => ["attendance", "class", classId],
  marks: ["marks"],
  marksByStudent: (studentId: string) => ["marks", "student", studentId],
  marksByClass: (classId: string) => ["marks", "class", classId],
  dormitories: ["dormitories"],
  rooms: ["rooms"],
  assignmentLogs: ["assignment_logs"],
  occupancySnapshots: ["occupancy_snapshots"],
  dormitoryById: (id: string) => ["dormitories", id],
  storeItems: ["store_items"],
  storeItemById: (id: string) => ["store_items", id],
  lowStockItems: ["store_items", "low-stock"],
  itemRequests: ["item_requests"],
  itemRequestsByStatus: (status: string) => ["item_requests", status],
  duties: ["duties"],
  dutyById: (id: string) => ["duties", id],
  dutiesByTeacher: (teacherId: string) => ["duties", "teacher", teacherId],
  ratings: ["ratings"],
  ratingById: (id: string) => ["ratings", id],
  ratingsByDuty: (dutyId: string) => ["ratings", "duty", dutyId],
  ratingsByTeacher: (teacherId: string) => ["ratings", "teacher", teacherId],
  paymentRequests: ["payment_requests"],
  paymentRequestById: (id: string) => ["payment_requests", id],
  paymentRequestsByTeacher: (teacherId: string) => [
    "payment_requests",
    "teacher",
    teacherId,
  ],
};

// STUDENT HOOKS
export const useStudents = () => {
  return useQuery({
    queryKey: QUERY_KEYS.students,
    queryFn: () => studentService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.studentById(id),
    queryFn: () => studentService.getById(id),
    enabled: !!id,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (student: Omit<Student, "id" | "createdAt" | "updatedAt">) =>
      studentService.create(student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students });
      toast({ title: "Success", description: "Student created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create student",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Student> }) =>
      studentService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.studentById(data.id),
      });
      toast({ title: "Success", description: "Student updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => studentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students });
      toast({ title: "Success", description: "Student deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    },
  });
};

// TEACHER HOOKS
export const useTeachers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.teachers,
    queryFn: () => teacherService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTeacher = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.teacherById(id),
    queryFn: () => teacherService.getById(id),
    enabled: !!id,
  });
};

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (teacher: Omit<Teacher, "id" | "createdAt" | "updatedAt">) =>
      teacherService.create(teacher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teachers });
      toast({ title: "Success", description: "Teacher created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create teacher",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Teacher> }) =>
      teacherService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teachers });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.teacherById(data.id),
      });
      toast({ title: "Success", description: "Teacher updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update teacher",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => teacherService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teachers });
      toast({ title: "Success", description: "Teacher deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher",
        variant: "destructive",
      });
    },
  });
};

// Teacher class assignment
export const useTeacherClasses = (teacherId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.classes,
    queryFn: () => classService.getByTeacher(teacherId),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAssignClassToTeacher = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ classId, teacherId }: { classId: string; teacherId: string }) =>
      classService.update(classId, { teacher_id: teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classes });
      toast({
        title: "Success",
        description: "Class assigned to teacher successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign class",
        variant: "destructive",
      });
    },
  });
};

export const useUnassignClassFromTeacher = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (classId: string) =>
      classService.update(classId, { teacher_id: "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classes });
      toast({
        title: "Success",
        description: "Class unassigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unassign class",
        variant: "destructive",
      });
    },
  });
};

// CLASS HOOKS
export const useClasses = () => {
  return useQuery({
    queryKey: QUERY_KEYS.classes,
    queryFn: () => classService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useClass = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.classById(id),
    queryFn: () => classService.getById(id),
    enabled: !!id,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (classData: Omit<Class, "id" | "createdAt" | "updatedAt">) =>
      classService.create(classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classes });
      toast({ title: "Success", description: "Class created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Class> }) =>
      classService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classes });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.classById(data.id),
      });
      toast({ title: "Success", description: "Class updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => classService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classes });
      toast({ title: "Success", description: "Class deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class",
        variant: "destructive",
      });
    },
  });
};

// FEE HOOKS
export const useFees = () => {
  return useQuery({
    queryKey: QUERY_KEYS.fees,
    queryFn: () => feeService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFeesByStudent = (studentId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.feesByStudent(studentId),
    queryFn: () => feeService.getByStudent(studentId),
    enabled: !!studentId,
  });
};

export const useCreateFee = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (fee: Omit<Fee, "id" | "createdAt" | "updatedAt">) =>
      feeService.create(fee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fees });
      toast({
        title: "Success",
        description: "Fee record created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create fee record",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFee = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Fee> }) =>
      feeService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fees });
      toast({
        title: "Success",
        description: "Fee record updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fee record",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteFee = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => feeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fees });
      toast({
        title: "Success",
        description: "Fee record deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete fee record",
        variant: "destructive",
      });
    },
  });
};

// ATTENDANCE HOOKS
export const useAttendance = () => {
  return useQuery({
    queryKey: QUERY_KEYS.attendance,
    queryFn: () => attendanceService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAttendanceByStudent = (studentId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.attendanceByStudent(studentId),
    queryFn: () => attendanceService.getByStudent(studentId),
    enabled: !!studentId,
  });
};

export const useAttendanceByClass = (classId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.attendanceByClass(classId),
    queryFn: () => attendanceService.getByClass(classId),
    enabled: !!classId,
  });
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (
      attendance: Omit<Attendance, "id" | "createdAt" | "updatedAt">
    ) => attendanceService.create(attendance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance });
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance",
        variant: "destructive",
      });
    },
  });
};

export const useBulkCreateAttendance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (
      records: Omit<Attendance, "id" | "createdAt" | "updatedAt">[]
    ) => attendanceService.bulkCreate(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance });
      toast({
        title: "Success",
        description: "Attendance records created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create attendance records",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Attendance>;
    }) => attendanceService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance });
      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => attendanceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance });
      toast({
        title: "Success",
        description: "Attendance deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete attendance",
        variant: "destructive",
      });
    },
  });
};

// MARKS HOOKS
export const useMarks = () => {
  return useQuery({
    queryKey: QUERY_KEYS.marks,
    queryFn: () => markService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useMarksByStudent = (studentId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.marksByStudent(studentId),
    queryFn: () => markService.getByStudent(studentId),
    enabled: !!studentId,
  });
};

export const useMarksByClass = (classId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.marksByClass(classId),
    queryFn: () => markService.getByClass(classId),
    enabled: !!classId,
  });
};

export const useCreateMark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (mark: Omit<Mark, "id" | "createdAt" | "updatedAt">) =>
      markService.create(mark),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marks });
      toast({ title: "Success", description: "Mark recorded successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record mark",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Mark> }) =>
      markService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marks });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.marksByStudent(data.student_id),
      });
      toast({ title: "Success", description: "Mark updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update mark",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => markService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marks });
      toast({ title: "Success", description: "Mark deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete mark",
        variant: "destructive",
      });
    },
  });
};

export const useBulkCreateMarks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (records: Omit<Mark, "id" | "createdAt" | "updatedAt">[]) =>
      markService.bulkCreate(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marks });
      toast({ title: "Success", description: "Marks recorded successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record marks",
        variant: "destructive",
      });
    },
  });
};

// DORMITORY HOOKS
export const useDormitories = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dormitories,
    queryFn: () => dormitoryService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRooms = (dormitoryId?: string) => {
  return useQuery({
    queryKey: dormitoryId ? [...QUERY_KEYS.rooms, dormitoryId] : QUERY_KEYS.rooms,
    queryFn: () => roomService.getAll(dormitoryId ? { dormitory_id: dormitoryId } : undefined),
    enabled: true,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (room: any) => roomService.create(room),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      toast({ title: 'Success', description: 'Room created' });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => roomService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      toast({ title: 'Success', description: 'Room updated' });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => roomService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rooms });
      toast({ title: 'Success', description: 'Room deleted' });
    },
  });
};

export const useDormitory = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dormitoryById(id),
    queryFn: () => dormitoryService.getById(id),
    enabled: !!id,
  });
};

export const useCreateDormitory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (
      dormitory: Omit<Dormitory, "id" | "createdAt" | "updatedAt">
    ) => dormitoryService.create(dormitory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dormitories });
      toast({
        title: "Success",
        description: "Dormitory created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create dormitory",
        variant: "destructive",
      });
    },
  });
};

// ASSIGNMENT LOGS
export const useAssignmentLogs = (dormitoryId?: string) => {
  return useQuery({
    queryKey: dormitoryId ? [...QUERY_KEYS.assignmentLogs, dormitoryId] : QUERY_KEYS.assignmentLogs,
    queryFn: () => assignmentLogService.getAll(dormitoryId ? { to_dormitory: dormitoryId } : undefined),
    staleTime: 2 * 60 * 1000,
  });
};

export const exportAssignmentCsv = async (params?: Record<string, any>) => {
  return assignmentLogService.exportCsv(params);
};

// OCCUPANCY SNAPSHOTS
export const useOccupancySnapshots = (dormitoryId?: string) => {
  return useQuery({
    queryKey: dormitoryId ? [...QUERY_KEYS.occupancySnapshots, dormitoryId] : QUERY_KEYS.occupancySnapshots,
    queryFn: () => occupancyService.getAll(dormitoryId ? { dormitory_id: dormitoryId } : undefined),
  });
};

export const useUpdateDormitory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Dormitory>;
    }) => dormitoryService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dormitories });
      toast({
        title: "Success",
        description: "Dormitory updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update dormitory",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteDormitory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => dormitoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dormitories });
      toast({
        title: "Success",
        description: "Dormitory deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete dormitory",
        variant: "destructive",
      });
    },
  });
};

// STORE HOOKS
export const useStoreItems = () => {
  return useQuery({
    queryKey: QUERY_KEYS.storeItems,
    queryFn: () => storeService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useStoreItem = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.storeItemById(id),
    queryFn: () => storeService.getById(id),
    enabled: !!id,
  });
};

export const useLowStockItems = (threshold: number = 10) => {
  return useQuery({
    queryKey: QUERY_KEYS.lowStockItems,
    queryFn: () => storeService.getLowStock(threshold),
  });
};

export const useCreateStoreItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (item: Omit<StoreItem, "id" | "createdAt" | "updatedAt">) =>
      storeService.create(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storeItems });
      toast({
        title: "Success",
        description: "Store item created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create store item",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateStoreItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<StoreItem>;
    }) => storeService.update(id, updates),
    onSuccess: (data: StoreItem) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storeItems });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lowStockItems });
      // Show standard success toast
      toast({
        title: "Success",
        description: "Store item updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update store item",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteStoreItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => storeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storeItems });
      toast({
        title: "Success",
        description: "Store item deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete store item",
        variant: "destructive",
      });
    },
  });
};

// ITEM REQUESTS HOOKS
export const useItemRequests = (status: string = 'pending') => {
  return useQuery({
    queryKey: QUERY_KEYS.itemRequestsByStatus(status),
    queryFn: async () => {
      const res = await fetch(`/api/item-requests?status=${status}`);
      if (!res.ok) throw new Error('Failed to fetch requests');
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useApproveItemRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, approval_notes }: { id: string; approval_notes: string }) =>
      fetch(`/api/item-requests/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_notes }),
      }).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to approve'))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.itemRequests });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.itemRequestsByStatus('pending') });
      toast({
        title: "Success",
        description: "Item request approved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });
};

export const useRejectItemRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, rejection_reason }: { id: string; rejection_reason: string }) =>
      fetch(`/api/item-requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason }),
      }).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to reject'))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.itemRequests });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.itemRequestsByStatus('pending') });
      toast({
        title: "Success",
        description: "Item request rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });
};

// TEACHER DUTIES HOOKS
export const useDuties = () => {
  return useQuery({
    queryKey: QUERY_KEYS.duties,
    queryFn: () => dutyService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDuty = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dutyById(id),
    queryFn: () => dutyService.getById(id),
  });
};

export const useDutiesByTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.dutiesByTeacher(teacherId),
    queryFn: () => dutyService.getByTeacherId(teacherId),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDuty = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (duty: Omit<TeacherDuty, "id" | "createdAt" | "updatedAt">) =>
      dutyService.create(duty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.duties });
      toast({
        title: "Success",
        description: "Duty assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign duty",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateDuty = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TeacherDuty>;
    }) => dutyService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.duties });
      toast({
        title: "Success",
        description: "Duty updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update duty",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteDuty = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dutyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.duties });
      toast({
        title: "Success",
        description: "Duty deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete duty",
        variant: "destructive",
      });
    },
  });
};

// DUTY RATINGS HOOKS
export const useRatings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.ratings,
    queryFn: () => ratingService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRating = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.ratingById(id),
    queryFn: () => ratingService.getById(id),
  });
};

export const useRatingsByDuty = (dutyId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.ratingsByDuty(dutyId),
    queryFn: () => ratingService.getByDutyId(dutyId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRatingsByTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.ratingsByTeacher(teacherId),
    queryFn: () => ratingService.getByTeacherId(teacherId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRating = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rating: Omit<DutyRating, "id" | "createdAt" | "updatedAt">) =>
      ratingService.create(rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ratings });
      toast({
        title: "Success",
        description: "Rating submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateRating = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<DutyRating>;
    }) => ratingService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ratings });
      toast({
        title: "Success",
        description: "Rating updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update rating",
        variant: "destructive",
      });
    },
  });
};

// PAYMENT REQUESTS HOOKS
export const usePaymentRequests = () => {
  return useQuery({
    queryKey: QUERY_KEYS.paymentRequests,
    queryFn: () => paymentRequestService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePaymentRequest = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.paymentRequestById(id),
    queryFn: () => paymentRequestService.getById(id),
  });
};

export const usePaymentRequestsByTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.paymentRequestsByTeacher(teacherId),
    queryFn: () => paymentRequestService.getByTeacherId(teacherId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePaymentRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      request: Omit<PaymentRequest, "id" | "createdAt" | "updatedAt">
    ) => paymentRequestService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentRequests });
      toast({
        title: "Success",
        description: "Payment request submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment request",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePaymentRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PaymentRequest>;
    }) => paymentRequestService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentRequests });
      toast({
        title: "Success",
        description: "Payment request updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment request",
        variant: "destructive",
      });
    },
  });
};

export const useApprovePaymentRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      approvedBy,
    }: {
      id: string;
      approvedBy: string;
    }) => paymentRequestService.approve(id, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentRequests });
      toast({
        title: "Success",
        description: "Payment request approved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });
};

export const useRejectPaymentRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      rejectionReason,
    }: {
      id: string;
      rejectionReason: string;
    }) => paymentRequestService.reject(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentRequests });
      toast({
        title: "Success",
        description: "Payment request rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });
};
