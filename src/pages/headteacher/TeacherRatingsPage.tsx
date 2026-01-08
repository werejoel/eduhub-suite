import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, Edit2, TrendingUp, Award, BarChart3 } from "lucide-react";
import {
  useDuties,
  useRatings,
  useCreateRating,
  useUpdateRating,
  useTeachers,
} from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { DutyRating } from "@/lib/types";

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const TeacherRatingsPage = () => {
  const { user } = useAuth();
  const { data: duties = [] } = useDuties();
  const { data: ratings = [] } = useRatings();
  const { data: teachers = [] } = useTeachers();
  const createRatingMutation = useCreateRating();
  const updateRatingMutation = useUpdateRating();

  const [isOpen, setIsOpen] = useState(false);
  const [editingRating, setEditingRating] = useState<DutyRating | null>(null);
  const [formData, setFormData] = useState({
    duty_id: "",
    rating: 5,
    comments: "",
    week_number: getWeekNumber(new Date()),
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-500";
    if (rating >= 3) return "text-yellow-500";
    return "text-red-500";
  };

  const handleOpenDialog = (rating?: DutyRating) => {
    if (rating) {
      setEditingRating(rating);
      setFormData({
        duty_id: rating.duty_id,
        rating: rating.rating,
        comments: rating.comments,
        week_number: rating.week_number,
      });
    } else {
      setEditingRating(null);
      setFormData({
        duty_id: "",
        rating: 5,
        comments: "",
        week_number: getWeekNumber(new Date()),
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.duty_id) return;

    const duty = duties.find((d) => d.id === formData.duty_id);
    if (!duty) return;

    const ratingData = {
      duty_id: formData.duty_id,
      teacher_id: duty.teacher_id,
      week_number: formData.week_number,
      academic_year: new Date().getFullYear().toString(),
      term: "1",
      rating: formData.rating,
      comments: formData.comments,
      rated_by: user?.id || "",
      rating_date: new Date().toISOString(),
    };

    if (editingRating) {
      await updateRatingMutation.mutateAsync({
        id: editingRating.id,
        updates: ratingData,
      });
    } else {
      await createRatingMutation.mutateAsync(ratingData);
    }

    setIsOpen(false);
    setEditingRating(null);
  };

  const dutyMap = useMemo(
    () =>
      Object.fromEntries(
        duties.map((d) => [d.id, { name: d.duty_name, teacherId: d.teacher_id }])
      ),
    [duties]
  );

  const teacherMap = useMemo(
    () =>
      Object.fromEntries(
        teachers.map((t) => [t.id, `${t.first_name} ${t.last_name}`])
      ),
    [teachers]
  );

  // Group ratings by duty
  const ratingsByDuty = useMemo(() => {
    const grouped: Record<string, DutyRating[]> = {};
    ratings.forEach((r) => {
      if (!grouped[r.duty_id]) grouped[r.duty_id] = [];
      grouped[r.duty_id].push(r);
    });
    return grouped;
  }, [ratings]);

  const dutyDetails = useMemo(() => {
    return duties.map((duty) => ({
      ...duty,
      ratings: ratingsByDuty[duty.id] || [],
      averageRating:
        ratingsByDuty[duty.id]?.length > 0
          ? (
              ratingsByDuty[duty.id].reduce((sum, r) => sum + r.rating, 0) /
              ratingsByDuty[duty.id].length
            ).toFixed(1)
          : "No ratings",
    }));
  }, [duties, ratingsByDuty]);

  // Analytics
  const analytics = useMemo(() => {
    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : 0;
    
    const excellentCount = ratings.filter(r => r.rating >= 5).length;
    const goodCount = ratings.filter(r => r.rating >= 4 && r.rating < 5).length;
    const averageCount = ratings.filter(r => r.rating >= 3 && r.rating < 4).length;
    const poorCount = ratings.filter(r => r.rating < 3).length;
    
    const uniqueTeachers = new Set(duties.map(d => d.teacher_id)).size;
    const ratedDuties = Object.keys(ratingsByDuty).length;
    
    return {
      totalRatings: ratings.length,
      avgRating,
      excellentCount,
      goodCount,
      averageCount,
      poorCount,
      uniqueTeachers,
      ratedDuties,
    };
  }, [ratings, duties, ratingsByDuty]);

  const StatCard = ({ icon: Icon, label, value, subtext, color }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg border border-gray-200 p-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <Icon className="w-8 h-8 opacity-20" />
      </div>
    </motion.div>
  );

  const RatingDistribution = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-gray-200 p-4 bg-white"
    >
      <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
      <div className="space-y-3">
        {[
          { label: "⭐⭐⭐⭐⭐ Excellent (5)", count: analytics.excellentCount, color: "bg-green-500" },
          { label: "⭐⭐⭐⭐ Good (4)", count: analytics.goodCount, color: "bg-blue-500" },
          { label: "⭐⭐⭐ Average (3)", count: analytics.averageCount, color: "bg-yellow-500" },
          { label: "⭐⭐ Poor (<3)", count: analytics.poorCount, color: "bg-red-500" },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm font-bold text-gray-900">{item.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full`}
                style={{ width: `${ratings.length > 0 ? (item.count / ratings.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Weekly Duties & Ratings"
          description="View and rate teacher performance on assigned duties"
        />

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Star}
            label="Average Rating"
            value={analytics.avgRating}
            subtext="out of 5"
            color="bg-gradient-to-br from-yellow-50 to-yellow-100"
          />
          <StatCard
            icon={Award}
            label="Total Ratings"
            value={analytics.totalRatings}
            subtext={`${analytics.ratedDuties} duties rated`}
            color="bg-gradient-to-br from-purple-50 to-purple-100"
          />
          <StatCard
            icon={TrendingUp}
            label="Rated Duties"
            value={analytics.ratedDuties}
            subtext={`${analytics.uniqueTeachers} teachers`}
            color="bg-gradient-to-br from-blue-50 to-blue-100"
          />
          <StatCard
            icon={BarChart3}
            label="Excellent Ratings"
            value={analytics.excellentCount}
            subtext={`${analytics.excellentCount > 0 ? Math.round((analytics.excellentCount / ratings.length) * 100) : 0}% of total`}
            color="bg-gradient-to-br from-green-50 to-green-100"
          />
        </div>

        {/* Rating Distribution */}
        <div className="mb-8">
          <RatingDistribution />
        </div>

        <div className="mb-6">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Rate Duty
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingRating ? "✏️ Update Rating" : "⭐ Rate Teacher Duty"}
                </DialogTitle>
                <DialogDescription>
                  Provide a rating and comments for the completed duty
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label className="font-semibold">Select Duty</Label>
                  <Select
                    value={formData.duty_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duty_id: value })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select duty to rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {duties
                        .filter((d) => d.status === "assigned" || d.status === "in_progress" || d.status === "completed")
                        .map((duty) => (
                          <SelectItem key={duty.id} value={duty.id}>
                            {duty.duty_name} - {teacherMap[duty.teacher_id]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold">Week Number</Label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.week_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        week_number: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1.5 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <Label className="font-semibold mb-3">Rating (1-5 stars)</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() =>
                          setFormData({ ...formData, rating: num })
                        }
                        className={`p-2 rounded-lg transition-all transform hover:scale-110 ${
                          formData.rating >= num
                            ? "text-yellow-400 scale-100"
                            : "text-gray-300 opacity-50"
                        }`}
                      >
                        <Star
                          className="w-8 h-8 fill-current"
                          strokeWidth={0}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    Rating: <span className="text-yellow-600">{formData.rating} / 5</span>
                  </p>
                </div>

                <div>
                  <Label className="font-semibold">Comments</Label>
                  <Textarea
                    placeholder="Provide detailed feedback on the teacher's performance"
                    value={formData.comments}
                    onChange={(e) =>
                      setFormData({ ...formData, comments: e.target.value })
                    }
                    rows={4}
                    className="mt-1.5"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={
                    createRatingMutation.isPending ||
                    updateRatingMutation.isPending ||
                    !formData.duty_id
                  }
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold"
                >
                  {editingRating ? "Update Rating" : "Submit Rating"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {dutyDetails.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Star className="w-12 h-12 opacity-30" />
                <p className="text-lg font-medium">No duties to rate</p>
                <p className="text-sm">Assign some duties first to rate them</p>
              </div>
            </Card>
          ) : (
            dutyDetails.map((duty, idx) => {
              const avgRating = typeof duty.averageRating === "string" ? 0 : parseFloat(duty.averageRating);
              return (
                <motion.div
                  key={duty.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-6 border-0 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {duty.duty_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          👤 {teacherMap[duty.teacher_id]}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {duty.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-1 justify-end">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(avgRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              strokeWidth={0}
                            />
                          ))}
                        </div>
                        <p className="text-2xl font-bold mt-2 text-gray-900">
                          {duty.averageRating}
                        </p>
                        <p className="text-xs text-gray-500">
                          {duty.ratings.length} {duty.ratings.length === 1 ? "rating" : "ratings"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-4 flex-wrap">
                      <div className="text-sm">
                        <span className="text-gray-600">📅 Start: </span>
                        <span className="font-medium">
                          {new Date(duty.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">📅 End: </span>
                        <span className="font-medium">
                          {new Date(duty.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge className={`${
                        duty.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : duty.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : duty.status === "assigned"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {duty.status.replace("_", " ")}
                      </Badge>
                    </div>

                    {duty.ratings.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">📝 Recent Ratings:</h4>
                        <div className="space-y-3">
                          {duty.ratings.slice(0, 3).map((rating) => (
                            <motion.div
                              key={rating.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 flex justify-between items-start gap-3"
                            >
                              <div className="flex-1">
                                <div className="flex gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= rating.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                      strokeWidth={0}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm text-gray-700 font-medium">
                                  {rating.comments}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Week {rating.week_number} • {new Date(rating.rating_date).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(rating)}
                                className="hover:bg-yellow-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          ))}
                          {duty.ratings.length > 3 && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              +{duty.ratings.length - 3} more ratings
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default TeacherRatingsPage;
