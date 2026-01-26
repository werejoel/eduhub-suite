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
} from "@/components/ui/dialog";
/*import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
*/
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Eye } from "lucide-react";
import {
  usePaymentRequests,
  useApprovePaymentRequest,
  useRejectPaymentRequest,
  useTeachers,
} from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { formatUGX } from "@/lib/utils";
import { PaymentRequest } from "@/lib/types";

const PaymentRequestsPage = () => {
  const { user } = useAuth();
  const { data: paymentRequests = [] } = usePaymentRequests();
  const { data: teachers = [] } = useTeachers();
  const approveMutation = useApprovePaymentRequest();
  const rejectMutation = useRejectPaymentRequest();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    processed: "bg-blue-100 text-blue-800",
  };

  const teacherMap = useMemo(
    () =>
      Object.fromEntries(
        teachers.map((t) => [t.id, `${t.first_name} ${t.last_name}`])
      ),
    [teachers]
  );

  const handleApprove = async (request: PaymentRequest) => {
    await approveMutation.mutateAsync({
      id: request.id,
      approvedBy: user?.id || "",
    });
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    await rejectMutation.mutateAsync({
      id: selectedRequest.id,
      rejectionReason,
    });
    setIsOpen(false);
    setRejectionReason("");
  };

  // Calculate summary statistics
  const stats = useMemo(() => {
    return {
      total: paymentRequests.length,
      pending: paymentRequests.filter((r) => r.status === "pending").length,
      approved: paymentRequests.filter((r) => r.status === "approved").length,
      rejected: paymentRequests.filter((r) => r.status === "rejected").length,
      processed: paymentRequests.filter((r) => r.status === "processed").length,
      totalAmount: paymentRequests.reduce((sum, r) => sum + r.amount, 0),
      pendingAmount: paymentRequests
        .filter((r) => r.status === "pending")
        .reduce((sum, r) => sum + r.amount, 0),
    };
  }, [paymentRequests]);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Teacher Payment Requests"
          description="Review and manage teacher payment requests"
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4 border-yellow-200 bg-yellow-50">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">
              {stats.pending}
            </p>
          </Card>
          <Card className="p-4 border-green-200 bg-green-50">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-800">
              {stats.approved}
            </p>
          </Card>
          <Card className="p-4 border-blue-200 bg-blue-50">
            <p className="text-sm text-gray-600">Processed</p>
            <p className="text-2xl font-bold text-blue-800">
              {stats.processed}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Pending Amount</p>
            <p className="text-lg font-bold">{formatUGX(stats.pendingAmount)}</p>
          </Card>
        </div>

        {/* Rejection Reason Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Payment Request</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this payment request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedRequest && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-medium">
                    {teacherMap[selectedRequest.teacher_id]}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.reason}
                  </p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {formatUGX(selectedRequest.amount)}
                  </p>
                </div>
              )}
              <div>
                <Label>Rejection Reason</Label>
                <Textarea
                  placeholder="Explain why this request is being rejected"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="w-full"
              >
                Reject Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Requests Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {teacherMap[request.teacher_id] || "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {request.reason}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatUGX(request.amount)}
                    </TableCell>
                    <TableCell>
                      {new Date(request.request_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[request.status]}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(request)}
                              disabled={approveMutation.isPending}
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsOpen(true);
                              }}
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {paymentRequests.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No payment requests found</p>
          </Card>
        )}

        {/* Detailed View for each status */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* Pending Requests */}
          {stats.pending > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-yellow-800">
                Pending Requests ({stats.pending})
              </h3>
              <div className="space-y-3">
                {paymentRequests
                  .filter((r) => r.status === "pending")
                  .slice(0, 5)
                  .map((request) => (
                    <div
                      key={request.id}
                      className="border rounded p-3 bg-yellow-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {teacherMap[request.teacher_id]}
                          </p>
                          <p className="text-xs text-gray-600">
                            {request.reason}
                          </p>
                        </div>
                        <p className="font-bold">
                          {formatUGX(request.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Approved Requests */}
          {stats.approved > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-green-800">
                Approved Requests ({stats.approved})
              </h3>
              <div className="space-y-3">
                {paymentRequests
                  .filter((r) => r.status === "approved")
                  .slice(0, 5)
                  .map((request) => (
                    <div
                      key={request.id}
                      className="border rounded p-3 bg-green-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {teacherMap[request.teacher_id]}
                          </p>
                          <p className="text-xs text-gray-600">
                            Approved{" "}
                            {request.approval_date
                              ? new Date(
                                request.approval_date
                              ).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                        <p className="font-bold">
                          {formatUGX(request.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PaymentRequestsPage;
