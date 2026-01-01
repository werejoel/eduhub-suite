import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Mail, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@/lib/types";

const fetchUsers = async (): Promise<User[]> => {
  const res = await fetch('/api/users?_sort=-createdAt');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};


const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
  });

  const confirmEmail = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_confirmed: true, updated_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed to confirm email');

      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Email confirmed successfully. User can now login.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm email');
    }
  };

  const unconfirmEmail = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_confirmed: false, updated_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed to revoke confirmation');

      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Email confirmation revoked');
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke confirmation');
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
      key: 'created_at',
      label: 'Registered',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: User) => (
        <div className="flex gap-2">
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
        </div>
      ),
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

