import { useState, useMemo } from 'react';import { useBudget } from '../context/BudgetContext';
import type { PaymentMethod } from '../models/types';
import { Plus, Pencil, Trash2, X, CreditCard } from 'lucide-react';

export function PaymentMethodManager() {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useBudget();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💳');
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedPaymentMethods = useMemo(() => [...paymentMethods].sort((a, b) => a.name.localeCompare(b.name)), [paymentMethods]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updatePaymentMethod({ id: editingId, name: name.trim(), icon });
      setEditingId(null);
    } else {
      await addPaymentMethod({ id: crypto.randomUUID(), name: name.trim(), icon });
    }
    setName('');
    setIcon('💳');
  };

  const startEdit = (pm: PaymentMethod) => {
    setEditingId(pm.id);
    setName(pm.name);
    setIcon(pm.icon);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setIcon('💳');
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-400" /> Payment Methods</h3>

      <form onSubmit={handleSubmit} className="flex gap-3 items-end mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Icon</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-16 glass-input px-3 py-2 text-center text-lg"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Venmo"
            className="w-full glass-input px-4 py-2"
            required
          />
        </div>
        <button
          type="submit"
          className="btn-primary px-5 py-2 flex items-center gap-1.5"
        >
          {editingId ? <><Pencil className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add</>}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="btn-secondary px-5 py-2 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </form>

      <div className="space-y-2">
        {sortedPaymentMethods.map((pm) => (
          <div
            key={pm.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/80"
          >
            <span className="text-slate-100">
              {pm.icon} {pm.name}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(pm)}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
                aria-label="Edit payment method"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deletePaymentMethod(pm.id)}
                className="text-red-500 hover:text-red-700 text-sm"
                aria-label="Delete payment method"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
