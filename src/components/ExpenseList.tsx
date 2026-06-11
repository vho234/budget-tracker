import { useMemo, useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { format } from 'date-fns';
import { Trash2, Pencil, Receipt } from 'lucide-react';
import type { Expense } from '../models/types';

const ALL = '__all__';

export function ExpenseList({ onEdit }: { onEdit?: (expense: Expense) => void }) {
  const { expenses, categories, paymentMethods, selectedMonth, deleteExpense } = useBudget();
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [paymentFilter, setPaymentFilter] = useState<string>(ALL);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );
  const sortedPaymentMethods = useMemo(
    () => [...paymentMethods].sort((a, b) => a.name.localeCompare(b.name)),
    [paymentMethods],
  );

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );

  const filteredExpenses = useMemo(() => {
    return monthExpenses
      .filter((e) => categoryFilter === ALL || e.categoryId === categoryFilter)
      .filter((e) => {
        if (paymentFilter === ALL) return true;
        return (e.paymentMethodId ?? '') === paymentFilter;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [monthExpenses, categoryFilter, paymentFilter]);

  const filtersActive = categoryFilter !== ALL || paymentFilter !== ALL;

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? 'Unknown';
  const getCategoryColor = (id: string) =>
    categories.find((c) => c.id === id)?.color ?? '#6b7280';
  const getPaymentMethod = (id?: string) =>
    id ? paymentMethods.find((p) => p.id === id) : undefined;

  const filterBar = (
    <div className="flex flex-wrap items-end gap-4 mb-4">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full glass-input px-4 py-2"
        >
          <option value={ALL}>All categories</option>
          {sortedCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="block text-sm font-medium text-slate-300 mb-1">Payment method</label>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full glass-input px-4 py-2"
        >
          <option value={ALL}>All payment methods</option>
          <option value="">No payment method</option>
          {sortedPaymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
          ))}
        </select>
      </div>
      {filtersActive && (
        <button
          type="button"
          onClick={() => { setCategoryFilter(ALL); setPaymentFilter(ALL); }}
          className="text-sm text-indigo-400 hover:text-indigo-300 px-2 py-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );

  if (monthExpenses.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-8 text-center">
        <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-lg">No expenses for this month</p>
        <p className="text-slate-500 text-sm mt-1">Add your first expense above!</p>
      </div>
    );
  }

  return (
    <div>
      {filterBar}
      {filteredExpenses.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-8 text-center">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No expenses match the current filters</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/[0.1] border-b border-white/[0.16]">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Date</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Category</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Payment</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Note</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-400">Amount</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.1]">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-white/[0.12]">
                  <td className="px-6 py-3 text-sm text-slate-400">
                    {format(new Date(expense.date + 'T00:00:00'), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getCategoryColor(expense.categoryId) }}
                    >
                      {getCategoryName(expense.categoryId)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">
                    {(() => {
                      const pm = getPaymentMethod(expense.paymentMethodId);
                      return pm ? `${pm.icon} ${pm.name}` : '—';
                    })()}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">
                    {expense.note || '—'}
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-slate-100 text-right">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit?.(expense)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                        aria-label="Edit expense"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
