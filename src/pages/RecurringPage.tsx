import { RecurringManager } from '../components/RecurringManager';
import { RecurringIncomeManager } from '../components/RecurringIncomeManager';

export function RecurringPage() {
  return (
    <div className="space-y-8">
      <RecurringManager />
      <RecurringIncomeManager />
    </div>
  );
}
