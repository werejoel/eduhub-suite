import { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
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
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useItemRequests, useApproveItemRequest, useRejectItemRequest } from '@/hooks/useDatabase';

export default function ItemRequestsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requests = [], isLoading } = useItemRequests(activeTab);
  const { mutate: approveRequest, isPending: isApproving } = useApproveItemRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectItemRequest();

  const handleApprove = () => {
    if (selectedRequest) {
      approveRequest(
        { id: selectedRequest._id, approval_notes: approvalNotes },
        {
          onSuccess: () => {
            setApproveDialogOpen(false);
            setSelectedRequest(null);
            setApprovalNotes('');
          },
        }
      );
    }
  };

  const handleReject = () => {
    if (selectedRequest) {
      rejectRequest(
        { id: selectedRequest._id, rejection_reason: rejectionReason },
        {
          onSuccess: () => {
            setRejectDialogOpen(false);
            setSelectedRequest(null);
            setRejectionReason('');
          },
        }
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Item Requests" description="Review and approve item requests from store managers" />

      {/* Tabs */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No {activeTab} requests
            </CardContent>
          </Card>
        ) : (
          requests.map((request: any) => (
            <Card key={request._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{request.item_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Requested by: <span className="font-medium">{request.requested_by}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{request.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="font-medium">{request.quantity_requested}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unit Price</p>
                    <p className="font-medium">UGX {request.unit_price?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium">
                      UGX {(request.unit_price * request.quantity_requested)?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p className="text-sm">{request.reason}</p>
                </div>

                {request.approval_notes && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-xs text-green-700 font-medium">Approval Notes</p>
                    <p className="text-sm text-green-700">{request.approval_notes}</p>
                  </div>
                )}

                {request.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-xs text-red-700 font-medium">Rejection Reason</p>
                    <p className="text-sm text-red-700">{request.rejection_reason}</p>
                  </div>
                )}

                {activeTab === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setApproveDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setRejectDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Approve "{selectedRequest?.item_name}" for {selectedRequest?.requested_by}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval_notes">Approval Notes (Optional)</Label>
              <Input
                id="approval_notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Reject "{selectedRequest?.item_name}" from {selectedRequest?.requested_by}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason</Label>
              <Input
                id="rejection_reason"
                placeholder="Explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
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
            >
              {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
