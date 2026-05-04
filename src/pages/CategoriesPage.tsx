import { CategoryManager } from '../components/CategoryManager';
import { IncomeSourceManager } from '../components/IncomeSourceManager';

export function CategoriesPage() {
  return (
    <div className="space-y-8">
      <CategoryManager />
      <IncomeSourceManager />
    </div>
  );
}
