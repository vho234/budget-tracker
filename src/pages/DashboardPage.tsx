import { useState, useEffect, useCallback, type ComponentType } from 'react';
import { useBudget } from '../context/BudgetContext';
import { SummaryCards } from '../components/charts/SummaryCards';
import { SpendingByCategory } from '../components/charts/SpendingByCategory';
import { SpendingOverTime } from '../components/charts/SpendingOverTime';
import { BudgetVsActual } from '../components/charts/BudgetVsActual';
import { BudgetHealth } from '../components/charts/BudgetHealth';
import IncomeVsExpenses from '../components/charts/IncomeVsExpenses';
import { LayoutDashboard, Pencil, X, Plus, Check } from 'lucide-react';

interface TileDefinition {
  id: string;
  label: string;
  component: ComponentType<{ isEditing?: boolean }>;
  span: 'full' | 'half';
  removable: boolean;
}

const TILES: TileDefinition[] = [
  { id: 'summary-cards', label: 'Summary Cards', component: SummaryCards, span: 'full', removable: false },
  { id: 'spending-by-category', label: 'Spending by Category', component: SpendingByCategory, span: 'half', removable: true },
  { id: 'budget-vs-actual', label: 'Budget vs Actual', component: BudgetVsActual, span: 'half', removable: true },
  { id: 'spending-over-time', label: 'Spending Over Time', component: SpendingOverTime, span: 'half', removable: true },
  { id: 'income-vs-expenses', label: 'Income vs Expenses', component: IncomeVsExpenses, span: 'half', removable: true },
  { id: 'budget-health', label: 'Budget Health', component: BudgetHealth, span: 'full', removable: true },
];

const ALL_TILE_IDS = TILES.map((t) => t.id);
const STORAGE_KEY = 'budget-tracker-dashboard-tiles';

interface SavedLayout {
  visible: string[];
  knownTiles: string[]; // all tile IDs known at save time
}

function loadVisibleTiles(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_TILE_IDS;
    const parsed = JSON.parse(raw);

    // Support legacy format (plain array)
    const saved: SavedLayout = Array.isArray(parsed)
      ? { visible: parsed, knownTiles: parsed }
      : parsed;

    if (!Array.isArray(saved.visible)) return ALL_TILE_IDS;

    const knownAtSave = new Set(saved.knownTiles ?? saved.visible);

    // Filter to only currently valid IDs, deduplicate
    const seen = new Set<string>();
    const valid: string[] = [];
    for (const id of saved.visible) {
      if (typeof id === 'string' && ALL_TILE_IDS.includes(id) && !seen.has(id)) {
        seen.add(id);
        valid.push(id);
      }
    }
    // Only auto-add tiles that are genuinely new (not known at save time)
    for (const id of ALL_TILE_IDS) {
      if (!seen.has(id) && !knownAtSave.has(id)) {
        valid.push(id);
      }
    }
    return valid;
  } catch {
    return ALL_TILE_IDS;
  }
}

export function DashboardPage() {
  const { selectedMonth, setSelectedMonth } = useBudget();
  const [visibleTileIds, setVisibleTileIds] = useState<string[]>(loadVisibleTiles);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const layout: SavedLayout = { visible: visibleTileIds, knownTiles: ALL_TILE_IDS };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [visibleTileIds]);

  const removeTile = useCallback((id: string) => {
    setVisibleTileIds((prev) => prev.filter((tileId) => tileId !== id));
  }, []);

  const addTile = useCallback((id: string) => {
    setVisibleTileIds((prev) => {
      if (prev.includes(id)) return prev;
      // Insert in the canonical order
      const ordered: string[] = [];
      for (const tileId of ALL_TILE_IDS) {
        if (prev.includes(tileId) || tileId === id) {
          ordered.push(tileId);
        }
      }
      return ordered;
    });
  }, []);

  const visibleTiles = TILES.filter((t) => visibleTileIds.includes(t.id));
  const hiddenTiles = TILES.filter((t) => !visibleTileIds.includes(t.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <LayoutDashboard className="w-7 h-7 text-indigo-400" /> Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEditing
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50'
                : 'glass-input text-slate-300 hover:text-slate-100'
            }`}
            aria-label={isEditing ? 'Done editing dashboard' : 'Edit dashboard tiles'}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            {isEditing ? 'Done' : 'Edit'}
          </button>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="glass-input px-4 py-2"
          />
        </div>
      </div>

      {visibleTiles.length === 0 && (
        <div className="glass-card p-12 text-center mb-6">
          <p className="text-slate-400 text-lg">No tiles visible.</p>
          <p className="text-slate-500 text-sm mt-2">
            Click <strong>Edit</strong> to add tiles back to your dashboard.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {visibleTiles.map((tile) => {
          const Component = tile.component;
          return (
            <div
              key={tile.id}
              className={`relative ${tile.span === 'full' ? 'lg:col-span-2' : ''} ${isEditing && tile.removable ? 'ring-1 ring-indigo-400/30 rounded-2xl' : ''}`}
            >
              {isEditing && tile.removable && (
                <button
                  onClick={() => removeTile(tile.id)}
                  className="absolute -top-2 -right-2 z-50 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg border-2 border-slate-900"
                  aria-label={`Remove ${tile.label} tile`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Component isEditing={isEditing} />
            </div>
          );
        })}
      </div>

      {isEditing && hiddenTiles.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Add Tiles
          </h3>
          <div className="flex flex-wrap gap-2">
            {hiddenTiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => addTile(tile.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/60 text-slate-300 hover:text-slate-100 text-sm transition-colors border border-slate-600/50"
                aria-label={`Add ${tile.label} tile`}
              >
                <Plus className="w-3.5 h-3.5" /> {tile.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
