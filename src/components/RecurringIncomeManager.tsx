import { useState, useMemo } from 'react';import { useBudget } from '../context/BudgetContext';
import type { RecurringIncome } from '../models/types';
import { Plus, Pencil, Trash2, X, RefreshCw } from 'lucide-react';

export function RecurringIncomeManager() {
  const { incomeSources, paymentMethods, recurringIncomes, addRecurringIncome, updateRecurringIncome, deleteRecurringIncome } = useBudget();
  const [amount, setAmount] = useState('');
  const [sourceId, setSourceId] = useState(incomeSources[0]?.id || '');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [note, setNote] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedIncomeSources = useMemo(() => [...incomeSources].sort((a, b) => a.name.localeCompare(b.name)), [incomeSources]);
  const sortedPaymentMethods = useMemo(() => [...paymentMethods].sort((a, b) => a.name.localeCompare(b.name)), [paymentMethods]);
  const isEditing = !!editingId;

  // Derive effective ID: fall back to first available when state is stale
  const effectiveSourceId = incomeSources.some((s) => s.id === sourceId) ? sourceId : (incomeSources[0]?.id ?? '');

  const startEdit = (rec: RecurringIncome) => {
    setEditingId(rec.id);
    setAmount(String(rec.amount));
    setSourceId(rec.sourceId);
    setDayOfMonth(String(rec.dayOfMonth));
    setNote(rec.note ?? '');
    setPaymentMethodId(rec.paymentMethodId ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setSourceId(incomeSources[0]?.id || '');
    setDayOfMonth('1');
    setNote('');
    setPaymentMethodId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !effectiveSourceId) return;

    if (isEditing) {
      const existing = recurringIncomes.find((r) => r.id === editingId);
      await updateRecurringIncome({
        id: editingId,
        amount: parseFloat(amount),
        sourceId: effectiveSourceId,
        dayOfMonth: parseInt(dayOfMonth),
        note: note.trim() || undefined,
        active: existing?.active ?? true,
        paymentMethodId: paymentMethodId || undefined,
      });
      cancelEdit();
    } else {
      await addRecurringIncome({
        id: crypto.randomUUID(),
        amount: parseFloat(amount),
        sourceId: effectiveSourceId,
        dayOfMonth: parseInt(dayOfMonth),
        note: note.trim() || undefined,
        active: true,
        paymentMethodId: paymentMethodId || undefined,
      });
      setAmount('');
      setNote('');
      setDayOfMonth('1');
      setPaymentMethodId('');
    }
  };

  const toggleActive = async (rec: RecurringIncome) => {
    await updateRecurringIncome({ ...rec, active: !rec.active });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2"><RefreshCw className="w-7 h-7 text-green-400" /> Recurring Income</h2>

      <form onSubmit={handleSubmit} className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full glass-input px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Source</label>
            <select
              value={effectiveSourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full glass-input px-4 py-2"
            >
              {sortedIncomeSources.map((src) => (
                <option key={src.id} value={src.id}>{src.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="w-full glass-input px-4 py-2"
            >
              <option value="">— None —</option>
              {sortedPaymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Day of Month</label>
            <input
              type="number"
              min="1"
              max="28"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full glass-input px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Salary"
              className="w-full glass-input px-4 py-2"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="btn-primary px-6 py-2 flex items-center gap-1.5"
          >
            {isEditing ? <><Pencil className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Add Recurring Income</>}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="btn-secondary px-6 py-2 flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {recurringIncomes.map((rec) => {
          const source = incomeSources.find((s) => s.id === rec.sourceId);
          return (
            <div
              key={rec.id}
              className={`bg-slate-900/60 rounded-2xl border border-white/[0.16] p-4 transition-all duration-200 hover:bg-slate-800/80 flex items-center justify-between ${
                !rec.active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source?.color ?? '#6b7280' }} />
                <div>
                  <p className="font-medium text-green-400">
                    +${rec.amount.toFixed(2)} — {source?.name ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-400">
                    Day {rec.dayOfMonth} of each month
                    {(() => {
                      const pm = paymentMethods.find((p) => p.id === rec.paymentMethodId);
                      return pm ? ` • ${pm.icon} ${pm.name}` : '';
                    })()}
                    {rec.note ? ` • ${rec.note}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => toggleActive(rec)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    rec.active
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-white/[0.12] text-slate-400 hover:bg-white/[0.1]'
                  }`}
                >
                  {rec.active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => startEdit(rec)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                  aria-label="Edit recurring income"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteRecurringIncome(rec.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  aria-label="Delete recurring income"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {recurringIncomes.length === 0 && (
          <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-8 text-center">
            <RefreshCw className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No recurring income set up</p>
          </div>
        )}
      </div>
    </div>
  );
}
