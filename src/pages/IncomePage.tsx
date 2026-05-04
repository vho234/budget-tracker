import { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { IncomeForm } from '../components/IncomeForm';
import { IncomeList } from '../components/IncomeList';
import { Banknote } from 'lucide-react';
import type { Income } from '../models/types';

export function IncomePage() {
  const { selectedMonth, setSelectedMonth } = useBudget();
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Banknote className="w-7 h-7 text-indigo-400" /> Income</h2>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="glass-input px-4 py-2"
        />
      </div>

      <div className="mb-6">
        <IncomeForm
          editingIncome={editingIncome}
          onClose={editingIncome ? () => setEditingIncome(null) : undefined}
        />
      </div>

      <IncomeList onEdit={(income) => setEditingIncome(income)} />
    </div>
  );
}
