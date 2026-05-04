import { useState, useMemo } from 'react';import { useBudget } from '../context/BudgetContext';
import type { Category } from '../models/types';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';

export function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory } = useBudget();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updateCategory({ id: editingId, name: name.trim(), color });
      setEditingId(null);
    } else {
      await addCategory({ id: crypto.randomUUID(), name: name.trim(), color });
    }
    setName('');
    setColor('#6366f1');
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setColor('#6366f1');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2"><Tag className="w-7 h-7 text-indigo-400" /> Expense Categories</h2>

      <form onSubmit={handleSubmit} className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="w-full glass-input px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 rounded-lg border border-slate-500 cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-6 py-2 flex items-center gap-1.5"
          >
            {editingId ? <><Pencil className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add</>}
          </button>
          {editingId && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCategories.map((cat) => (
          <div
            key={cat.id}
            className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-4 transition-all duration-200 hover:bg-slate-800/80 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="font-medium text-slate-100">{cat.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(cat)}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
                aria-label="Edit category"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-red-500 hover:text-red-700 text-sm"
                aria-label="Delete category"
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
