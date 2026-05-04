import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useBudget } from '../../context/BudgetContext';
import { BarChart3 } from 'lucide-react';

export function BudgetVsActual() {
  const { expenses, categories, monthlyBudgets, selectedMonth } = useBudget();

  const budgetsForMonth = monthlyBudgets.filter((b) => b.month === selectedMonth);

  const data = budgetsForMonth.map((budget) => {
    const cat = categories.find((c) => c.id === budget.categoryId);
    const spent = expenses
      .filter((e) => e.categoryId === budget.categoryId && e.date.startsWith(selectedMonth))
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      name: cat?.name ?? 'Unknown',
      budget: budget.limit,
      spent,
    };
  });

  if (data.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 flex flex-col items-center justify-center h-80">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Set budgets to see comparison</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 transition-all duration-300 hover:bg-slate-800/80">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-400" /> Budget vs. Actual</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
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
          <Legend />
          <Bar dataKey="budget" fill="#a5b4fc" name="Budget" radius={[4, 4, 0, 0]} />
          <Bar dataKey="spent" fill="#6366f1" name="Spent" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
