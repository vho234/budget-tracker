import { useBudget } from '../../context/BudgetContext';
import { DollarSign, PiggyBank, TrendingDown, TrendingUp, Trophy, Banknote, ArrowDownUp, Percent } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function SummaryCards() {
  const { expenses, incomes, monthlyBudgets, categories, selectedMonth } = useBudget();

  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthIncomes = incomes.filter((i) => i.date.startsWith(selectedMonth));
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);

  const netCashFlow = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;

  const totalBudget = monthlyBudgets
    .filter((b) => b.month === selectedMonth)
    .reduce((sum, b) => sum + b.limit, 0);

  const remaining = totalBudget - totalSpent;

  // Top category
  const categorySpending = categories.map((cat) => ({
    name: cat.name,
    total: monthExpenses
      .filter((e) => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0),
  }));
  const topCategory = categorySpending.sort((a, b) => b.total - a.total)[0];

  const transactionCount = monthExpenses.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card
        label="Total Income"
        value={`$${totalIncome.toFixed(2)}`}
        sublabel={`${monthIncomes.length} entries`}
        color="green"
        icon={Banknote}
      />
      <Card
        label="Total Spent"
        value={`$${totalSpent.toFixed(2)}`}
        sublabel={`${transactionCount} transactions`}
        color="indigo"
        icon={DollarSign}
      />
      <Card
        label="Net Cash Flow"
        value={`${netCashFlow >= 0 ? '+' : ''}$${netCashFlow.toFixed(2)}`}
        sublabel={netCashFlow >= 0 ? 'Positive flow' : 'Negative flow'}
        color={netCashFlow >= 0 ? 'green' : 'red'}
        icon={ArrowDownUp}
      />
      <Card
        label="Savings Rate"
        value={totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : '—'}
        sublabel={totalIncome > 0 ? (savingsRate >= 20 ? 'Great!' : savingsRate >= 0 ? 'Keep saving' : 'Overspending') : 'No income recorded'}
        color={savingsRate >= 20 ? 'green' : savingsRate >= 0 ? 'orange' : 'red'}
        icon={Percent}
      />
      <Card
        label="Total Budget"
        value={totalBudget > 0 ? `$${totalBudget.toFixed(2)}` : 'Not set'}
        sublabel={totalBudget > 0 ? `${monthlyBudgets.filter((b) => b.month === selectedMonth).length} categories` : ''}
        color="purple"
        icon={PiggyBank}
      />
      <Card
        label="Remaining"
        value={totalBudget > 0 ? `$${remaining.toFixed(2)}` : '—'}
        sublabel={remaining < 0 ? 'Over budget!' : totalBudget > 0 ? 'left to spend' : ''}
        color={remaining < 0 ? 'red' : 'green'}
        icon={remaining < 0 ? TrendingDown : TrendingUp}
      />
      <Card
        label="Top Category"
        value={topCategory?.total > 0 ? topCategory.name : '—'}
        sublabel={topCategory?.total > 0 ? `$${topCategory.total.toFixed(2)}` : 'No spending'}
        color="orange"
        icon={Trophy}
      />
    </div>
  );
}

function Card({
  label,
  value,
  sublabel,
  color,
  icon,
}: {
  label: string;
  value: string;
  sublabel: string;
  color: string;
  icon: LucideIcon;
}) {
  const Icon = icon;
  const colorMap: Record<string, { card: string; icon: string; glow: string }> = {
    indigo: { card: 'bg-indigo-500/[0.15] border-indigo-500/[0.25]', icon: 'text-indigo-400', glow: 'bg-indigo-500/20' },
    purple: { card: 'bg-violet-500/[0.15] border-violet-500/[0.25]', icon: 'text-violet-400', glow: 'bg-violet-500/20' },
    green: { card: 'bg-emerald-500/[0.15] border-emerald-500/[0.25]', icon: 'text-emerald-400', glow: 'bg-emerald-500/20' },
    red: { card: 'bg-rose-500/[0.15] border-rose-500/[0.25]', icon: 'text-rose-400', glow: 'bg-rose-500/20' },
    orange: { card: 'bg-amber-500/[0.15] border-amber-500/[0.25]', icon: 'text-amber-400', glow: 'bg-amber-500/20' },
  };
  const fallback = { card: 'bg-white/[0.1] border-white/[0.16]', icon: 'text-slate-400', glow: 'bg-slate-500/10' };
  const colors = colorMap[color] ?? fallback;

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5 ${colors.card}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <div className={`rounded-lg p-1.5 ${colors.glow}`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-50 tracking-tight">{value}</p>
      {sublabel && <p className="text-xs text-slate-500 mt-1.5">{sublabel}</p>}
    </div>
  );
}
