import { useBudget } from '../context/BudgetContext';
import { SummaryCards } from '../components/charts/SummaryCards';
import { SpendingByCategory } from '../components/charts/SpendingByCategory';
import { SpendingOverTime } from '../components/charts/SpendingOverTime';
import { BudgetVsActual } from '../components/charts/BudgetVsActual';
import { BudgetHealth } from '../components/charts/BudgetHealth';
import IncomeVsExpenses from '../components/charts/IncomeVsExpenses';
import { LayoutDashboard } from 'lucide-react';

export function DashboardPage() {
  const { selectedMonth, setSelectedMonth } = useBudget();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><LayoutDashboard className="w-7 h-7 text-indigo-400" /> Dashboard</h2>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="glass-input px-4 py-2"
        />
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SpendingByCategory />
        <BudgetVsActual />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SpendingOverTime />
        <IncomeVsExpenses />
      </div>

      <div className="mt-6">
        <BudgetHealth />
      </div>
    </div>
  );
}
