import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import DataTable from '@/components/dashboard/DataTable';
import StatCard from '@/components/dashboard/StatCard';
import { useState, useMemo } from 'react';
import { CreditCard, List } from 'lucide-react';
import { useFees, useStudents } from '@/hooks/useDatabase';
import { formatUGX } from '@/lib/utils';

type Transaction = {
  id: string;
  student?: string;
  amount: number;
  type?: string;
  created_at?: string;
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return (data as Transaction[]) || [];
  } catch (e) {
    // graceful fallback: return empty array when table doesn't exist or network error
    return [];
  }
};

const BurserDashboard = () => {
  const [query, setQuery] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['burser', 'transactions'],
    queryFn: fetchTransactions,
    staleTime: 1000 * 60 * 2,
  });

  const { data: fees = [] } = useFees();
  const { data: students = [] } = useStudents();
  
  // Calculate stats from fees data
  const totalCollected = useMemo(() => {
    return fees
      .filter(f => f.payment_status === 'paid')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }, [fees]);

  const totalPending = useMemo(() => {
    return fees
      .filter(f => f.payment_status === 'pending')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }, [fees]);

  // Use fees data for transactions display with student names
  const recent = useMemo(() => {
    return fees
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((fee) => {
        const student = students.find(s => s.id === fee.student_id);
        const studentName = student 
          ? `${student.first_name} ${student.last_name}` 
          : fee.student_id || '—';
        
        return {
          id: fee.id,
          student: studentName,
          amount: formatUGX(fee.amount, { decimals: 2 }),
          type: fee.payment_status,
          date: new Date(fee.created_at).toLocaleDateString(),
        };
      });
  }, [fees, students]);

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={CreditCard} title="Total Collected" value={formatUGX(totalCollected)} />
        <StatCard icon={List} title="Transactions" value={`${fees.length}`} />
        <StatCard icon={CreditCard} title="Pending Fees" value={formatUGX(totalPending)} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <input
          className="input"
          placeholder="Filter by student or amount"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div>
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'student', label: 'Student' },
            { key: 'amount', label: 'Amount (UGX)' },
            { key: 'type', label: 'Type' },
            { key: 'date', label: 'Date' },
          ]}
          data={recent.filter((r) =>
            query ? Object.values(r).join(' ').toLowerCase().includes(query.toLowerCase()) : true
          )}
        />
      </div>
    </div>
  );
};

export default BurserDashboard;
