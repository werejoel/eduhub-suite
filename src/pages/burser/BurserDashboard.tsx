import { useState, useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Search,
  Filter,
  Eye,
  EyeOff,
  Home,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useFees, useStudents } from '@/hooks/useDatabase';
import { formatUGX } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/dashboard/DataTable';
import StatCard from '@/components/dashboard/StatCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as PieChartComponent,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const BurserDashboard = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'reports' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const { data: fees = [] } = useFees();
  const { data: students = [] } = useStudents();

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const paid = fees.filter(f => f.payment_status === 'paid');
    const pending = fees.filter(f => f.payment_status === 'pending');
    const overdue = fees.filter(f => f.payment_status === 'overdue');

    const totalCollected = paid.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalPending = pending.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalOverdue = overdue.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalExpected = fees.reduce((sum, f) => sum + (f.amount || 0), 0);

    return {
      totalCollected,
      totalPending,
      totalOverdue,
      totalExpected,
      collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
    };
  }, [fees]);

  // Payment trend data (by month)
  const paymentTrends = useMemo(() => {
    const monthlyData: Record<string, { paid: number; pending: number; overdue: number }> = {};

    fees.forEach(fee => {
      const date = new Date(fee.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { paid: 0, pending: 0, overdue: 0 };
      }

      if (fee.payment_status === 'paid') monthlyData[monthKey].paid += fee.amount;
      if (fee.payment_status === 'pending') monthlyData[monthKey].pending += fee.amount;
      if (fee.payment_status === 'overdue') monthlyData[monthKey].overdue += fee.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        paid: Math.round(data.paid / 1000000),
        pending: Math.round(data.pending / 1000000),
        overdue: Math.round(data.overdue / 1000000),
      }));
  }, [fees]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    return [
      { name: 'Paid', value: stats.paidCount, color: '#10b981' },
      { name: 'Pending', value: stats.pendingCount, color: '#f59e0b' },
      { name: 'Overdue', value: stats.overdueCount, color: '#ef4444' },
    ];
  }, [stats]);

  // Recent transactions with student names
  const recentTransactions = useMemo(() => {
    return fees
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15)
      .map(fee => {
        const student = students.find(s => s.id === fee.student_id);
        return {
          id: fee.id,
          student: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
          amount: fee.amount,
          term: fee.term,
          status: fee.payment_status,
          date: new Date(fee.created_at).toLocaleDateString(),
          dueDate: new Date(fee.due_date).toLocaleDateString(),
        };
      });
  }, [fees, students]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter(t =>
      searchQuery === '' ||
      t.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.term.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recentTransactions, searchQuery]);

  // Top paying students
  const topStudents = useMemo(() => {
    const studentPayments: Record<string, number> = {};

    fees
      .filter(f => f.payment_status === 'paid')
      .forEach(fee => {
        const student = students.find(s => s.id === fee.student_id);
        const name = student ? `${student.first_name} ${student.last_name}` : 'Unknown';
        studentPayments[name] = (studentPayments[name] || 0) + fee.amount;
      });

    return Object.entries(studentPayments)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [fees, students]);

  // Render different views based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div whileHover={{ y: -5 }}>
                <StatCard
                  title="Total Collected"
                  value={balanceVisible ? formatUGX(stats.totalCollected) : '••••••'}
                  icon={CreditCard}
                  change={`${stats.collectionRate}% collection rate`}
                  changeType="positive"
                />
              </motion.div>
              <motion.div whileHover={{ y: -5 }}>
                <StatCard
                  title="Pending Fees"
                  value={balanceVisible ? formatUGX(stats.totalPending) : '••••••'}
                  icon={AlertCircle}
                  change={`${stats.pendingCount} payments`}
                  changeType="neutral"
                />
              </motion.div>
              <motion.div whileHover={{ y: -5 }}>
                <StatCard
                  title="Overdue Fees"
                  value={balanceVisible ? formatUGX(stats.totalOverdue) : '••••••'}
                  icon={TrendingUp}
                  change={`${stats.overdueCount} overdue`}
                  changeType="negative"
                />
              </motion.div>
              <motion.div whileHover={{ y: -5 }}>
                <StatCard
                  title="Expected Revenue"
                  value={balanceVisible ? formatUGX(stats.totalExpected) : '••••••'}
                  icon={DollarSign}
                  change={`${fees.length} records`}
                  changeType="positive"
                />
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Trends Chart */}
              <motion.div
                whileHover={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Payment Trends (Millions UGX)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}M`} />
                    <Legend />
                    <Bar dataKey="paid" fill="#10b981" />
                    <Bar dataKey="pending" fill="#f59e0b" />
                    <Bar dataKey="overdue" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Status Distribution */}
              <motion.div
                whileHover={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChartComponent>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChartComponent>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Top Paying Students */}
            <motion.div
              whileHover={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Paying Students
              </h3>
              <div className="space-y-3">
                {topStudents.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <span className="text-primary font-semibold">{formatUGX(student.amount)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case 'payments':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search by student or term..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>

              <DataTable
                columns={[
                  { key: 'student', label: 'Student Name' },
                  { key: 'term', label: 'Term' },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (value: number) => formatUGX(value),
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (value: string) => (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          value === 'paid'
                            ? 'bg-success/10 text-success'
                            : value === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    ),
                  },
                  { key: 'dueDate', label: 'Due Date' },
                  { key: 'date', label: 'Date' },
                ]}
                data={filteredTransactions}
              />
            </div>
          </motion.div>
        );

      case 'reports':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: FileText, title: 'Monthly Report', desc: 'Download monthly collection report' },
                { icon: Calendar, title: 'Term Report', desc: 'Generate term-wise fee report' },
                { icon: TrendingUp, title: 'Analytics Report', desc: 'Detailed payment analytics' },
                { icon: Users, title: 'Student Report', desc: 'Individual student payment history' },
              ].map((item, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-left hover:shadow-lg transition-shadow"
                >
                  <item.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold mb-6">Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <p className="font-medium">Balance Visibility</p>
                    <p className="text-sm text-gray-600">Show/hide balance amounts</p>
                  </div>
                  <button
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {balanceVisible ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-gradient-to-b from-primary to-primary/90 text-white shadow-xl overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Burser</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="space-y-2 px-3 py-6">
          {[
            { id: 'overview', icon: Home, label: 'Overview' },
            { id: 'payments', icon: CreditCard, label: 'Payments' },
            { id: 'reports', icon: FileText, label: 'Reports' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map(item => (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              whileHover={{ x: 5 }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-white/20 border-l-4 border-white'
                  : 'hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/20">
            <button
              onClick={async () => {
                try {
                  await authContext?.signOut?.();
                  toast.success('Logged out successfully');
                  navigate('/login');
                } catch (error) {
                  toast.error('Failed to logout');
                  console.error('Logout error:', error);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'payments' && 'Payment Records'}
                {activeTab === 'reports' && 'Reports'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, Burser</p>
            </div>
            {activeTab === 'overview' && (
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {balanceVisible ? (
                  <Eye className="w-6 h-6" />
                ) : (
                  <EyeOff className="w-6 h-6" />
                )}
              </button>
            )}
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default BurserDashboard;
