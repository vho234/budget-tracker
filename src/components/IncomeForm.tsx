import { useState, useEffect, useMemo } from 'react';import { useBudget } from '../context/BudgetContext';
import type { Income } from '../models/types';
import { Plus, Pencil, X } from 'lucide-react';

interface IncomeFormProps {
  onClose?: () => void;
  editingIncome?: Income | null;
}

export function IncomeForm({ onClose, editingIncome }: IncomeFormProps) {
  const { incomeSources, paymentMethods, addIncome, updateIncome } = useBudget();
  const [amount, setAmount] = useState('');
  const [sourceId, setSourceId] = useState(incomeSources[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');

  const sortedIncomeSources = useMemo(() => [...incomeSources].sort((a, b) => a.name.localeCompare(b.name)), [incomeSources]);
  const sortedPaymentMethods = useMemo(() => [...paymentMethods].sort((a, b) => a.name.localeCompare(b.name)), [paymentMethods]);

  const isEditing = !!editingIncome;
  useEffect(() => {
    if (editingIncome) {
      /* eslint-disable react-hooks/set-state-in-effect -- syncing form state from editing prop */
      setAmount(String(editingIncome.amount));
      setSourceId(editingIncome.sourceId);
      setDate(editingIncome.date);
      setNote(editingIncome.note ?? '');
      setPaymentMethodId(editingIncome.paymentMethodId ?? '');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [editingIncome]);

  // Derive effective IDs: fall back to first available when state is stale
  const effectiveSourceId = incomeSources.some((s) => s.id === sourceId) ? sourceId : (incomeSources[0]?.id ?? '');
  const effectivePaymentMethodId = paymentMethodId && !paymentMethods.some((p) => p.id === paymentMethodId) ? '' : paymentMethodId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !effectiveSourceId) return;

    if (isEditing) {
      await updateIncome({
        ...editingIncome,
        amount: parseFloat(amount),
        sourceId: effectiveSourceId,
        date,
        note: note.trim() || undefined,
        paymentMethodId: effectivePaymentMethodId || undefined,
      });
    } else {
      await addIncome({
        id: crypto.randomUUID(),
        amount: parseFloat(amount),
        sourceId: effectiveSourceId,
        date,
        note: note.trim() || undefined,
        paymentMethodId: effectivePaymentMethodId || undefined,
      });
    }

    setAmount('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethodId('');
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        {isEditing ? <><Pencil className="w-5 h-5 text-indigo-400" /> Edit Income</> : <><Plus className="w-5 h-5 text-indigo-400" /> Add Income</>}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {sortedIncomeSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Payment Method</label>
          <select
            value={effectivePaymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
            className="w-full glass-input px-4 py-2"
          >
            <option value="">— None —</option>
            {sortedPaymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.icon} {pm.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full glass-input px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is this income from?"
            className="w-full glass-input px-4 py-2"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="btn-primary px-6 py-2 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> {isEditing ? 'Save Changes' : 'Add Income'}
        </button>
        {(onClose || isEditing) && (
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-6 py-2 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>
    </form>
  );
}
