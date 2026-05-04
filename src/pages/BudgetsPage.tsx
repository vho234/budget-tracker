import { useBudget } from '../context/BudgetContext';
import { BudgetSettings } from '../components/BudgetSettings';

export function BudgetsPage() {
  const { selectedMonth, setSelectedMonth } = useBudget();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div />
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="glass-input px-4 py-2"
        />
      </div>
      <BudgetSettings />
    </div>
  );
}
