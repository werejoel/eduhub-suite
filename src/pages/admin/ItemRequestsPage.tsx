//imports
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useItemRequests, useApproveItemRequest, useRejectItemRequest } from '@/hooks/useDatabase';

//Main Function
const ItemRequestsPage = () =>{
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'amount'>('recent');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requests = [], isLoading } = useItemRequests(activeTab);
  const { mutate: approveRequest, isPending: isApproving } = useApproveItemRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectItemRequest();

  // Filter and search logic
  const filteredRequests = requests
    .filter((request: any) => {
      const matchesSearch =
        request.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.requested_by?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'amount') {
        return (b.unit_price * b.quantity_requested) - (a.unit_price * a.quantity_requested);
      }
      return new Date(b.requested_date).getTime() - new Date(a.requested_date).getTime();
    });

  // Statistics
  const stats = {
    pending: requests.filter((r: any) => r.status === 'pending').length,
    approved: requests.filter((r: any) => r.status === 'approved').length,
    rejected: requests.filter((r: any) => r.status === 'rejected').length,
    totalAmount: requests.reduce((sum: number, r: any) => sum + (r.unit_price * r.quantity_requested), 0),
  };

  const categories = Array.from(new Set(requests.map((r: any) => r.category))).filter(Boolean) as string[];

  //handleApprove
  const handleApprove = () => {
    if (selectedRequest) {
      approveRequest(
        { id: selectedRequest._id, approval_notes: approvalNotes },
        {
          onSuccess: () => {
            toast.success(`Request approved successfully!`);
            setApproveDialogOpen(false);
            setSelectedRequest(null);
            setApprovalNotes('');
          },
          onError: (error: any) => {
            toast.error(error.message || 'Failed to approve request');
          },
        }
      );
    }
  };

//handleReject
  const handleReject = () => {
    if (selectedRequest && rejectionReason.trim()) {
      rejectRequest(
        { id: selectedRequest._id, rejection_reason: rejectionReason },
        {
          onSuccess: () => {
            toast.success(`Request rejected successfully!`);
            setRejectDialogOpen(false);
            setSelectedRequest(null);
            setRejectionReason('');
          },
          onError: (error: any) => {
            toast.error(error.message || 'Failed to reject request');
          },
        }
      );
    }
  };

  //getStatusBadge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  //getStatusIcon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

//totalAmount
  const totalAmount = filteredRequests.reduce(
    (sum: number, r: any) => sum + (r.unit_price * r.quantity_requested),
    0
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Item Requests"
        description="Review and manage item requests from store managers"
        icon={Package}
      />

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          title="Pending Requests"
          value={stats.pending.toString()}
          icon={Clock}
          iconColor="bg-amber-500"
          delay={0}
        />
        <StatCard
          title="Approved"
          value={stats.approved.toString()}
          icon={CheckCircle2}
          iconColor="bg-green-500"
          delay={0.1}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected.toString()}
          icon={XCircle}
          iconColor="bg-red-500"
          delay={0.2}
        />
        <StatCard
          title="Total Value"
          value={`UGX ${(stats.totalAmount / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          iconColor="bg-blue-500"
          delay={0.3}
        />
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-md mb-6"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-4">
            {(['pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all capitalize flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {getStatusIcon(tab)}
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by item name or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat as string} value={cat as string}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="amount">Highest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Requests Grid/List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading requests...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No {activeTab} requests</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'There are no requests in this category'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request: any, index: number) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{request.item_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="secondary">{request.category}</Badge>
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Request Details Grid */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5 bg-muted/30 p-4 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Quantity</p>
                        <p className="font-bold text-lg">{request.quantity_requested}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Unit Price</p>
                        <p className="font-semibold">UGX {request.unit_price?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Amount</p>
                        <p className="font-bold text-primary">
                          UGX {(request.unit_price * request.quantity_requested)?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Requested By</p>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {request.requested_by}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(request.requested_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground font-medium mb-2">Reason for Request</p>
                      <p className="text-sm bg-muted/50 p-3 rounded">{request.reason}</p>
                    </div>

                    {/* Notes/Reasons */}
                    {request.approval_notes && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-lg p-4"
                      >
                        <div className="flex gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Approval Notes</p>
                            <p className="text-sm text-green-700 dark:text-green-200 mt-1">{request.approval_notes}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {request.rejection_reason && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg p-4"
                      >
                        <div className="flex gap-2">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Rejection Reason</p>
                            <p className="text-sm text-red-700 dark:text-red-200 mt-1">{request.rejection_reason}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    {activeTab === 'pending' && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setApproveDialogOpen(true);
                          }}
                          className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setRejectDialogOpen(true);
                          }}
                          variant="destructive"
                          className="flex-1 gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-muted-foreground">
                Showing {filteredRequests.length} of {requests.length} requests
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-lg font-bold text-primary">UGX {totalAmount.toLocaleString()}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Approve Request
            </DialogTitle>
            <DialogDescription>
              Approve "{selectedRequest?.item_name}" (Qty: {selectedRequest?.quantity_requested})
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-lg my-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-semibold">UGX {selectedRequest?.unit_price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-primary">
                  UGX {(selectedRequest?.unit_price * selectedRequest?.quantity_requested)?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="approval_notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval_notes"
                placeholder="Add any notes about this approval, conditions, or instructions..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving} className="gap-2">
              {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Request
            </DialogTitle>
            <DialogDescription>
              Reject "{selectedRequest?.item_name}" from {selectedRequest?.requested_by}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection_reason" className="text-red-600 font-medium">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejection_reason"
                placeholder="Provide a detailed reason for rejecting this request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="border-red-200 focus:border-red-500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The requester will see this reason in their notifications
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="gap-2"
            >
              {isRejecting && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
export default ItemRequestsPage;
