import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBudget } from '../../context/BudgetContext';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart3 } from 'lucide-react';

export function SpendingOverTime() {
  const { expenses, selectedMonth } = useBudget();

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const data = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTotal = expenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      date: format(day, 'MMM d'),
      amount: dayTotal,
    };
  });

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 transition-all duration-300 hover:bg-slate-800/80">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-400" /> Daily Spending</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            interval={Math.floor(days.length / 8)}
          />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value) => `$${Number(value).toFixed(2)}`}
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              color: '#e2e8f0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
