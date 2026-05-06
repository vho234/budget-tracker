import { useState, useEffect, useCallback } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { DollarSign, PiggyBank, TrendingDown, TrendingUp, Trophy, Banknote, ArrowDownUp, Percent, X, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CardDefinition {
  id: string;
  label: string;
}

const CARD_DEFS: CardDefinition[] = [
  { id: 'total-income', label: 'Total Income' },
  { id: 'total-spent', label: 'Total Spent' },
  { id: 'net-cash-flow', label: 'Net Cash Flow' },
  { id: 'savings-rate', label: 'Savings Rate' },
  { id: 'total-budget', label: 'Total Budget' },
  { id: 'remaining', label: 'Remaining' },
  { id: 'top-category', label: 'Top Category' },
];

const ALL_CARD_IDS = CARD_DEFS.map((c) => c.id);
const STORAGE_KEY = 'budget-tracker-summary-cards';

interface SavedCards {
  visible: string[];
  knownCards: string[];
}

function loadVisibleCards(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_CARD_IDS;
    const parsed = JSON.parse(raw);
    const saved: SavedCards = Array.isArray(parsed)
      ? { visible: parsed, knownCards: parsed }
      : parsed;
    if (!Array.isArray(saved.visible)) return ALL_CARD_IDS;

    const knownAtSave = new Set(saved.knownCards ?? saved.visible);
    const seen = new Set<string>();
    const valid: string[] = [];
    for (const id of saved.visible) {
      if (typeof id === 'string' && ALL_CARD_IDS.includes(id) && !seen.has(id)) {
        seen.add(id);
        valid.push(id);
      }
    }
    for (const id of ALL_CARD_IDS) {
      if (!seen.has(id) && !knownAtSave.has(id)) {
        valid.push(id);
      }
    }
    return valid;
  } catch {
    return ALL_CARD_IDS;
  }
}

export function SummaryCards({ isEditing = false }: { isEditing?: boolean }) {
  const { expenses, incomes, monthlyBudgets, categories, selectedMonth } = useBudget();
  const [visibleCardIds, setVisibleCardIds] = useState<string[]>(loadVisibleCards);

  useEffect(() => {
    const layout: SavedCards = { visible: visibleCardIds, knownCards: ALL_CARD_IDS };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [visibleCardIds]);

  const removeCard = useCallback((id: string) => {
    setVisibleCardIds((prev) => prev.filter((cid) => cid !== id));
  }, []);

  const addCard = useCallback((id: string) => {
    setVisibleCardIds((prev) => {
      if (prev.includes(id)) return prev;
      const ordered: string[] = [];
      for (const cardId of ALL_CARD_IDS) {
        if (prev.includes(cardId) || cardId === id) ordered.push(cardId);
      }
      return ordered;
    });
  }, []);

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

  const cardDataMap: Record<string, { value: string; sublabel: string; color: string; icon: LucideIcon }> = {
    'total-income': {
      value: `$${totalIncome.toFixed(2)}`,
      sublabel: `${monthIncomes.length} entries`,
      color: 'green',
      icon: Banknote,
    },
    'total-spent': {
      value: `$${totalSpent.toFixed(2)}`,
      sublabel: `${transactionCount} transactions`,
      color: 'indigo',
      icon: DollarSign,
    },
    'net-cash-flow': {
      value: `${netCashFlow >= 0 ? '+' : ''}$${netCashFlow.toFixed(2)}`,
      sublabel: netCashFlow >= 0 ? 'Positive flow' : 'Negative flow',
      color: netCashFlow >= 0 ? 'green' : 'red',
      icon: ArrowDownUp,
    },
    'savings-rate': {
      value: totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : '—',
      sublabel: totalIncome > 0 ? (savingsRate >= 20 ? 'Great!' : savingsRate >= 0 ? 'Keep saving' : 'Overspending') : 'No income recorded',
      color: savingsRate >= 20 ? 'green' : savingsRate >= 0 ? 'orange' : 'red',
      icon: Percent,
    },
    'total-budget': {
      value: totalBudget > 0 ? `$${totalBudget.toFixed(2)}` : 'Not set',
      sublabel: totalBudget > 0 ? `${monthlyBudgets.filter((b) => b.month === selectedMonth).length} categories` : '',
      color: 'purple',
      icon: PiggyBank,
    },
    'remaining': {
      value: totalBudget > 0 ? `$${remaining.toFixed(2)}` : '—',
      sublabel: remaining < 0 ? 'Over budget!' : totalBudget > 0 ? 'left to spend' : '',
      color: remaining < 0 ? 'red' : 'green',
      icon: remaining < 0 ? TrendingDown : TrendingUp,
    },
    'top-category': {
      value: topCategory?.total > 0 ? topCategory.name : '—',
      sublabel: topCategory?.total > 0 ? `$${topCategory.total.toFixed(2)}` : 'No spending',
      color: 'orange',
      icon: Trophy,
    },
  };

  const visibleCards = CARD_DEFS.filter((c) => visibleCardIds.includes(c.id));
  const hiddenCards = CARD_DEFS.filter((c) => !visibleCardIds.includes(c.id));

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleCards.map((card) => {
          const data = cardDataMap[card.id];
          return (
            <div key={card.id} className="relative">
              {isEditing && (
                <button
                  onClick={() => removeCard(card.id)}
                  className="absolute -top-2 -right-2 z-50 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-lg border-2 border-slate-900"
                  aria-label={`Remove ${card.label} card`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <Card
                label={card.label}
                value={data.value}
                sublabel={data.sublabel}
                color={data.color}
                icon={data.icon}
              />
            </div>
          );
        })}
      </div>
      {isEditing && hiddenCards.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hiddenCards.map((card) => (
            <button
              key={card.id}
              onClick={() => addCard(card.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/60 text-slate-300 hover:text-slate-100 text-xs transition-colors border border-slate-600/50"
              aria-label={`Add ${card.label} card`}
            >
              <Plus className="w-3 h-3" /> {card.label}
            </button>
          ))}
        </div>
      )}
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
