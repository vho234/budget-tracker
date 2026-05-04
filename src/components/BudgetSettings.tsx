import { useState, useMemo } from 'react';import { useBudget } from '../context/BudgetContext';
import { Plus, Trash2, Target } from 'lucide-react';

export function BudgetSettings() {
  const { categories, monthlyBudgets, selectedMonth, setBudget, deleteBudget } = useBudget();
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [limit, setLimit] = useState('');
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);

  // Derive effective ID: fall back to first available when state is stale
  const effectiveCategoryId = categories.some((c) => c.id === categoryId) ? categoryId : (categories[0]?.id ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCategoryId || !limit) return;

    const existingBudget = monthlyBudgets.find(
      (b) => b.categoryId === effectiveCategoryId && b.month === selectedMonth
    );

    await setBudget({
      id: existingBudget?.id || crypto.randomUUID(),
      categoryId: effectiveCategoryId,
      month: selectedMonth,
      limit: parseFloat(limit),
    });

    setLimit('');
  };

  const budgetsForMonth = monthlyBudgets.filter((b) => b.month === selectedMonth);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2"><Target className="w-7 h-7 text-indigo-400" /> Budget Settings — {selectedMonth}</h2>

      <form onSubmit={handleSubmit} className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
            <select
              value={effectiveCategoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full glass-input px-4 py-2"
            >
              {sortedCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-1">Monthly Limit ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="500.00"
              className="w-full glass-input px-4 py-2"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-6 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Set Budget
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {budgetsForMonth.map((budget) => {
          const cat = categories.find((c) => c.id === budget.categoryId);
          return (
            <BudgetProgressCard
              key={budget.id}
              budget={budget}
              categoryName={cat?.name ?? 'Unknown'}
              categoryColor={cat?.color ?? '#6b7280'}
              onDelete={() => deleteBudget(budget.id)}
            />
          );
        })}
        {budgetsForMonth.length === 0 && (
          <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-8 text-center">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No budgets set for this month</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetProgressCard({
  budget,
  categoryName,
  categoryColor,
  onDelete,
}: {
  budget: { id: string; categoryId: string; limit: number; month: string };
  categoryName: string;
  categoryColor: string;
  onDelete: () => void;
}) {
  const { expenses } = useBudget();
  const spent = expenses
    .filter((e) => e.categoryId === budget.categoryId && e.date.startsWith(budget.month))
    .reduce((sum, e) => sum + e.amount, 0);

  const percentage = Math.min((spent / budget.limit) * 100, 100);
  const isOverBudget = spent > budget.limit;

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
          <span className="font-medium text-slate-100">{categoryName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-600' : 'text-slate-400'}`}>
            ${spent.toFixed(2)} / ${budget.limit.toFixed(2)}
          </span>
          <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" aria-label="Delete budget">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="w-full bg-white/[0.12] rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {isOverBudget
          ? `Over budget by $${(spent - budget.limit).toFixed(2)}`
          : `$${(budget.limit - spent).toFixed(2)} remaining`}
      </p>
    </div>
  );
}
