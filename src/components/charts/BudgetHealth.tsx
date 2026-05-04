import { useBudget } from '../../context/BudgetContext';
import { Activity } from 'lucide-react';

export function BudgetHealth() {
  const { expenses, categories, monthlyBudgets, selectedMonth } = useBudget();

  const budgetsForMonth = monthlyBudgets.filter((b) => b.month === selectedMonth);

  const data = budgetsForMonth
    .map((budget) => {
      const cat = categories.find((c) => c.id === budget.categoryId);
      const spent = expenses
        .filter((e) => e.categoryId === budget.categoryId && e.date.startsWith(selectedMonth))
        .reduce((sum, e) => sum + e.amount, 0);
      const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

      return {
        name: cat?.name ?? 'Unknown',
        color: cat?.color ?? '#6b7280',
        spent,
        budget: budget.limit,
        pct,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  if (data.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 flex flex-col items-center justify-center h-80">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Set budgets to see health overview</p>
      </div>
    );
  }

  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusLabel = (pct: number) => {
    if (pct >= 100) return { text: 'Over', cls: 'text-red-400' };
    if (pct >= 75) return { text: 'Warning', cls: 'text-yellow-400' };
    return { text: 'Good', cls: 'text-green-400' };
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 transition-all duration-300 hover:bg-slate-800/80">
      <h3 className="text-lg font-semibold text-slate-100 mb-1 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /> Budget Health</h3>
      <p className="text-sm text-slate-400 mb-5">At-a-glance over/under budget by category</p>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {data.map((item) => {
          const status = getStatusLabel(item.pct);
          const barWidth = Math.min(item.pct, 150); // cap visual at 150%
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-slate-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400">
                    ${item.spent.toFixed(0)} / ${item.budget.toFixed(0)}
                  </span>
                  <span className={`font-semibold min-w-[5rem] text-right ${status.cls}`}>
                    {item.spent > item.budget
                      ? `$${(item.spent - item.budget).toFixed(0)} over`
                      : `$${(item.budget - item.spent).toFixed(0)} left`}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="relative h-3 bg-white/[0.12] rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${getBarColor(item.pct)}`}
                  style={{ width: `${(barWidth / 150) * 100}%` }}
                />
                {/* 100% budget marker line */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-slate-400 opacity-60"
                  style={{ left: `${(100 / 150) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/[0.16] text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Under 75%</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> 75–100%</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Over budget</span>
        <span className="flex items-center gap-1.5"><span className="w-0.5 h-2.5 bg-slate-400 opacity-60" /> Budget limit</span>
      </div>
    </div>
  );
}
