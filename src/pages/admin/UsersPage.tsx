import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Mail, Search, Loader2, Ban, UserCheck, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountStatus, User, UserRole } from "@/lib/types";
import { apiUrl } from "@/lib/services";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetchUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem("eduhub_token");
  const res = await fetch(apiUrl('/api/admin/users'), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  // Normalize server documents: map MongoDB's `_id` to `id` and createdAt -> created_at
  return (data || []).map((u: any) => ({
    ...u,
    id: u.id || u._id,
    created_at: u.created_at || u.createdAt || u.created_at,
  }));
};


const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
  });

  const adminRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("eduhub_token");
    const res = await fetch(apiUrl(url), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Request failed");
    return data;
  };

  const confirmEmail = async (userId: string) => {
    try {
      const res = await adminRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ email_confirmed: true, updated_at: new Date().toISOString() }),
      });

      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Email has been confirmed successfully. The user may now log in.');
    } catch (error: any) {
      toast.error(error.message || 'Unable to confirm email. Please try again.');
    }
  };

  const unconfirmEmail = async (userId: string) => {
    try {
      await adminRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ email_confirmed: false, updated_at: new Date().toISOString() }),
      });

      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Email confirmation has been revoked.');
    } catch (error: any) {
      toast.error(error.message || 'Unable to revoke email confirmation.');
    }
  };

  const updateAccountStatus = async (userId: string, account_status: AccountStatus) => {
    try {
      await adminRequest(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ account_status, updated_at: new Date().toISOString() }),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`Account ${account_status === "active" ? "activated" : account_status}.`);
    } catch (error: any) {
      toast.error(error.message || "Unable to update account status.");
    }
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Delete ${user.first_name} ${user.last_name}'s account permanently?`)) return;
    try {
      await adminRequest(`/api/admin/users/${user.id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success("User account deleted.");
    } catch (error: any) {
      toast.error(error.message || "Unable to delete user account.");
    }
  };

  const sendPasswordReset = async (user: User) => {
    try {
      await adminRequest(`/api/admin/users/${user.id}/password-reset`, { method: "POST" });
      toast.success(`Password reset email sent to ${user.email}.`);
    } catch (error: any) {
      toast.error(error.message || "Unable to send password reset email.");
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const pendingUsers = filteredUsers.filter(u => !u.email_confirmed);
  const confirmedUsers = filteredUsers.filter(u => u.email_confirmed);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (_: any, row: User) => `${row.first_name} ${row.last_name}`,
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      ),
    },
    {
      key: 'email_confirmed',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'destructive'}>
          {value ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Confirmed
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Pending
            </>
          )}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Teacher Status',
      render: (value: string, row: User) => {
        if (row.role !== 'teacher' && row.role !== 'headteacher') return '-';
        return (
          <Badge variant={value === 'active' ? 'default' : 'secondary'}>
            {value || 'inactive'}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Registered',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: User) => {
        const UpdateRoleControl = ({ userRow }: { userRow: User }) => {
          const [selected, setSelected] = useState<UserRole>(
            (userRow.role as UserRole) || ("teacher" as UserRole)
          );
          const queryClient = useQueryClient();

          const applyRole = async () => {
            try {
              await adminRequest(`/api/admin/users/${userRow.id}`, {
                method: "PUT",
                body: JSON.stringify({ role: selected, updated_at: new Date().toISOString() }),
              });
              queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
              toast.success("User role has been updated.");
            } catch (err: any) {
              toast.error(err.message || "Unable to update user role.");
            }
          };

          return (
            <div className="flex items-center gap-2">
              <Select value={selected} onValueChange={(v) => setSelected(v as UserRole)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="headteacher">Head Teacher</SelectItem>
                  <SelectItem value="burser">Burser</SelectItem>
                  <SelectItem value="store">Store Manager</SelectItem>
                  <SelectItem value="dormitory">Dormitory Manager</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={applyRole} className="whitespace-nowrap">
                Update
              </Button>
            </div>
          );
        };

        const UpdateTeacherStatusControl = ({ userRow }: { userRow: User }) => {
          const [statusSelected, setStatusSelected] = useState<'active' | 'inactive'>(
            (userRow.status as 'active' | 'inactive') || 'inactive'
          );
          const queryClient = useQueryClient();

          const applyStatus = async () => {
            try {
              await adminRequest(`/api/admin/users/${userRow.id}`, {
                method: "PUT",
                body: JSON.stringify({ status: statusSelected, updated_at: new Date().toISOString() }),
              });
              queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
              toast.success("Teacher status has been updated.");
            } catch (err: any) {
              toast.error(err.message || "Unable to update teacher status.");
            }
          };

          if (userRow.role !== 'teacher' && userRow.role !== 'headteacher') {
            return null;
          }

          return (
            <div className="flex items-center gap-2">
              <Select value={statusSelected} onValueChange={(v) => setStatusSelected(v as 'active' | 'inactive')}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={applyStatus} className="whitespace-nowrap">
                Set
              </Button>
            </div>
          );
        };

        return (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              {!row.email_confirmed ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirmEmail(row.id)}
                  className="text-success hover:text-success"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Confirm Email
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unconfirmEmail(row.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Revoke
                </Button>
              )}
              <UpdateRoleControl userRow={row} />
            </div>
            <UpdateTeacherStatusControl userRow={row} />
            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={row.account_status || "active"}
                onValueChange={(value) => updateAccountStatus(row.id, value as AccountStatus)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active"><UserCheck className="mr-2 inline-block h-4 w-4" />Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked"><Ban className="mr-2 inline-block h-4 w-4" />Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => sendPasswordReset(row)}>
                <KeyRound className="mr-1 h-4 w-4" />Reset Email
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteUser(row)}>
                <Trash2 className="mr-1 h-4 w-4" />Delete
              </Button>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="User Management"
        description="Manage user accounts and email confirmations"
        icon={Mail}
      />

      <div className="space-y-6">
        {/* Search and Stats */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="bg-card p-3 rounded-lg border">
              <div className="text-muted-foreground">Total Users</div>
              <div className="text-2xl font-bold">{users.length}</div>
            </div>
            <div className="bg-card p-3 rounded-lg border border-destructive/20">
              <div className="text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-destructive">{pendingUsers.length}</div>
            </div>
            <div className="bg-card p-3 rounded-lg border border-success/20">
              <div className="text-muted-foreground">Confirmed</div>
              <div className="text-2xl font-bold text-success">{confirmedUsers.length}</div>
            </div>
          </div>
        </div>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Pending Email Confirmation ({pendingUsers.length})
            </h3>
            <DataTable
              columns={columns}
              data={pendingUsers}
              actions={false}
            />
          </div>
        )}

        {/* All Users */}
        <div>
          <h3 className="text-lg font-semibold mb-4">All Users</h3>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredUsers}
              actions={false}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default UsersPage;

