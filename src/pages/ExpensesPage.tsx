import { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { ExpenseForm } from '../components/ExpenseForm';
import { ExpenseList } from '../components/ExpenseList';
import { Receipt } from 'lucide-react';
import type { Expense } from '../models/types';

export function ExpensesPage() {
  const { selectedMonth, setSelectedMonth } = useBudget();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Receipt className="w-7 h-7 text-indigo-400" /> Expenses</h2>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="glass-input px-4 py-2"
        />
      </div>

      <div className="mb-6">
        <ExpenseForm
          editingExpense={editingExpense}
          onClose={editingExpense ? () => setEditingExpense(null) : undefined}
        />
      </div>

      <ExpenseList onEdit={(expense) => setEditingExpense(expense)} />
    </div>
  );
}
