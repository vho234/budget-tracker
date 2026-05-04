import { useBudget } from '../context/BudgetContext';
import { format } from 'date-fns';
import { Trash2, Pencil, Banknote } from 'lucide-react';
import type { Income } from '../models/types';

export function IncomeList({ onEdit }: { onEdit?: (income: Income) => void }) {
  const { incomes, incomeSources, paymentMethods, selectedMonth, deleteIncome } = useBudget();

  const filteredIncomes = incomes
    .filter((i) => i.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const getSourceName = (id: string) =>
    incomeSources.find((s) => s.id === id)?.name ?? 'Unknown';
  const getSourceColor = (id: string) =>
    incomeSources.find((s) => s.id === id)?.color ?? '#6b7280';
  const getPaymentMethod = (id?: string) =>
    id ? paymentMethods.find((p) => p.id === id) : undefined;

  if (filteredIncomes.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-8 text-center">
        <Banknote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-lg">No income for this month</p>
        <p className="text-slate-500 text-sm mt-1">Add your first income above!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] overflow-hidden">
      <table className="w-full">
        <thead className="bg-white/[0.1] border-b border-white/[0.16]">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Date</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Source</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Payment</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Note</th>
            <th className="text-right px-6 py-3 text-sm font-medium text-slate-400">Amount</th>
            <th className="text-right px-6 py-3 text-sm font-medium text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.1]">
          {filteredIncomes.map((income) => (
            <tr key={income.id} className="hover:bg-white/[0.12]">
              <td className="px-6 py-3 text-sm text-slate-400">
                {format(new Date(income.date + 'T00:00:00'), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-3">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getSourceColor(income.sourceId) }}
                >
                  {getSourceName(income.sourceId)}
                </span>
              </td>
              <td className="px-6 py-3 text-sm text-slate-400">
                {(() => {
                  const pm = getPaymentMethod(income.paymentMethodId);
                  return pm ? `${pm.icon} ${pm.name}` : '—';
                })()}
              </td>
              <td className="px-6 py-3 text-sm text-slate-400">
                {income.note || '—'}
              </td>
              <td className="px-6 py-3 text-sm font-semibold text-green-400 text-right">
                ${income.amount.toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit?.(income)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm"
                    aria-label="Edit income"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteIncome(income.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    aria-label="Delete income"
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
  );
}
