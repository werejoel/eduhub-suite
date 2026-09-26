import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Star, Search, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTeachers,
  useDosTeacherRatings,
  useCreateDosTeacherRating,
} from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EXAM_TERMS } from "@/lib/schoolConfig";

const getCurrentAcademicYear = () => {
  const y = new Date().getFullYear();
  return `${y}/${y + 1}`;
};

export default function DosTeacherRatingsPage() {
  const { user } = useAuth();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: ratings = [], isLoading: ratingsLoading } =
    useDosTeacherRatings();
  const createRating = useCreateDosTeacherRating();

  const [teacherSearch, setTeacherSearch] = useState("");
  const [form, setForm] = useState({
    teacher_id: "",
    rating: "4",
    comments: "",
    term: EXAM_TERMS[0],
    academic_year: getCurrentAcademicYear(),
  });

  const teachersByName = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teachers
      .filter((t) => t.role === "teacher" || !t.role)
      .filter((t) => {
        if (!q) return true;
        const name = `${t.first_name} ${t.last_name}`.toLowerCase();
        return (
          name.includes(q) ||
          (t.email || "").toLowerCase().includes(q) ||
          (t.employee_id || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`,
        ),
      );
  }, [teachers, teacherSearch]);

  const teacherName = (id: string) => {
    const t = teachers.find((x) => x.id === id);
    return t ? `${t.first_name} ${t.last_name}` : "Unknown";
  };

  const submitRating = async () => {
    if (!form.teacher_id || !user?.id) return;
    await createRating.mutateAsync({
      teacher_id: form.teacher_id,
      rating: Number(form.rating),
      comments: form.comments.trim(),
      term: form.term,
      academic_year: form.academic_year,
      rated_by: user.id,
      rating_date: new Date().toISOString(),
    });
    setForm((prev) => ({ ...prev, comments: "", rating: "4" }));
  };

  const loading = teachersLoading || ratingsLoading;

  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Ratings"
        description="Rate teachers by name — comments and scores per term"
        icon={Star}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-md space-y-4">
            <h3 className="font-semibold">New rating</h3>
            <div className="space-y-2">
              <Label>Find teacher by name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search teacher name…"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Teacher *</Label>
              <Select
                value={form.teacher_id}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, teacher_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachersByName.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.first_name} {t.last_name}
                      {t.subject ? ` — ${t.subject}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rating (1–5)</Label>
                <Select
                  value={form.rating}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, rating: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} —{" "}
                        {n >= 4 ? "Good" : n === 3 ? "Fair" : "Needs improvement"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Select
                  value={form.term}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, term: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TERMS.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Academic year</Label>
              <Input
                value={form.academic_year}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    academic_year: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea
                rows={4}
                value={form.comments}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, comments: e.target.value }))
                }
                placeholder="Lesson delivery, punctuality, student engagement…"
              />
            </div>
            <Button
              onClick={submitRating}
              disabled={!form.teacher_id || createRating.isPending}
              className="w-full"
            >
              {createRating.isPending ? "Saving…" : "Save rating"}
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-md">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Recent ratings</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No ratings yet
                    </TableCell>
                  </TableRow>
                ) : (
                  [...ratings]
                    .sort(
                      (a, b) =>
                        new Date(b.rating_date).getTime() -
                        new Date(a.rating_date).getTime(),
                    )
                    .slice(0, 25)
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {teacherName(r.teacher_id)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.term}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {r.academic_year}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {r.rating}/5
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {r.comments || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
