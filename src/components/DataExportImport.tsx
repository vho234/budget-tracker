import { useState } from 'react';
import { db } from '../db/database';
import { useBudget } from '../context/BudgetContext';
import { Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateImportData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Import data is not a valid object'], warnings };
  }

  const d = data as Record<string, unknown>;

  if (!d.version || typeof d.version !== 'number') {
    errors.push('Missing or invalid "version" field');
  }
  if (!Array.isArray(d.categories)) {
    errors.push('Missing or invalid "categories" array');
  }
  if (!Array.isArray(d.expenses)) {
    errors.push('Missing or invalid "expenses" array');
  }

  if (errors.length > 0) return { valid: false, errors, warnings };

  const categoryIds = new Set<string>();
  const sourceIds = new Set<string>();
  const pmIds = new Set<string>();

  // Validate categories
  for (const cat of d.categories as unknown[]) {
    const c = cat as Record<string, unknown>;
    if (!c.id || typeof c.id !== 'string') { errors.push('Category missing valid "id"'); continue; }
    if (!c.name || typeof c.name !== 'string') { errors.push(`Category ${c.id} missing valid "name"`); continue; }
    categoryIds.add(c.id);
  }

  // Validate payment methods (optional)
  if (Array.isArray(d.paymentMethods)) {
    for (const pm of d.paymentMethods as unknown[]) {
      const p = pm as Record<string, unknown>;
      if (!p.id || typeof p.id !== 'string') { errors.push('PaymentMethod missing valid "id"'); continue; }
      if (!p.name || typeof p.name !== 'string') { errors.push(`PaymentMethod ${p.id} missing valid "name"`); continue; }
      pmIds.add(p.id);
    }
  }

  // Validate income sources (optional)
  if (Array.isArray(d.incomeSources)) {
    for (const src of d.incomeSources as unknown[]) {
      const s = src as Record<string, unknown>;
      if (!s.id || typeof s.id !== 'string') { errors.push('IncomeSource missing valid "id"'); continue; }
      if (!s.name || typeof s.name !== 'string') { errors.push(`IncomeSource ${s.id} missing valid "name"`); continue; }
      sourceIds.add(s.id);
    }
  }

  // Validate expenses
  for (const exp of d.expenses as unknown[]) {
    const e = exp as Record<string, unknown>;
    if (!e.id || typeof e.id !== 'string') { errors.push('Expense missing valid "id"'); continue; }
    if (typeof e.amount !== 'number' || e.amount < 0) { errors.push(`Expense ${e.id} has invalid amount`); continue; }
    if (typeof e.date !== 'string' || !DATE_RE.test(e.date)) { errors.push(`Expense ${e.id} has invalid date format (expected YYYY-MM-DD)`); continue; }
    if (typeof e.categoryId === 'string' && !categoryIds.has(e.categoryId)) {
      warnings.push(`Expense ${e.id} references missing category "${e.categoryId}"`);
    }
  }

  // Validate incomes (optional)
  if (Array.isArray(d.incomes)) {
    for (const inc of d.incomes as unknown[]) {
      const i = inc as Record<string, unknown>;
      if (!i.id || typeof i.id !== 'string') { errors.push('Income missing valid "id"'); continue; }
      if (typeof i.amount !== 'number' || i.amount < 0) { errors.push(`Income ${i.id} has invalid amount`); continue; }
      if (typeof i.date !== 'string' || !DATE_RE.test(i.date)) { errors.push(`Income ${i.id} has invalid date format`); continue; }
      if (typeof i.sourceId === 'string' && !sourceIds.has(i.sourceId)) {
        warnings.push(`Income ${i.id} references missing source "${i.sourceId}"`);
      }
    }
  }

  // Validate monthly budgets (optional)
  if (Array.isArray(d.monthlyBudgets)) {
    for (const b of d.monthlyBudgets as unknown[]) {
      const budget = b as Record<string, unknown>;
      if (!budget.id || typeof budget.id !== 'string') { errors.push('MonthlyBudget missing valid "id"'); continue; }
      if (typeof budget.limit !== 'number' || budget.limit < 0) { errors.push(`Budget ${budget.id} has invalid limit`); continue; }
      if (typeof budget.month !== 'string' || !MONTH_RE.test(budget.month)) { errors.push(`Budget ${budget.id} has invalid month format`); continue; }
    }
  }

  // Validate recurring expenses (optional)
  if (Array.isArray(d.recurringExpenses)) {
    for (const r of d.recurringExpenses as unknown[]) {
      const rec = r as Record<string, unknown>;
      if (!rec.id || typeof rec.id !== 'string') { errors.push('RecurringExpense missing valid "id"'); continue; }
      if (typeof rec.amount !== 'number' || rec.amount < 0) { errors.push(`RecurringExpense ${rec.id} has invalid amount`); }
      if (typeof rec.dayOfMonth !== 'number' || rec.dayOfMonth < 1 || rec.dayOfMonth > 31) { errors.push(`RecurringExpense ${rec.id} has invalid dayOfMonth`); }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function DataExportImport() {
  const { refresh } = useBudget();
  const [importStatus, setImportStatus] = useState<string>('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const handleExport = async () => {
    const data = {
      version: 3,
      exportDate: new Date().toISOString(),
      categories: await db.categories.toArray(),
      expenses: await db.expenses.toArray(),
      monthlyBudgets: await db.monthlyBudgets.toArray(),
      recurringExpenses: await db.recurringExpenses.toArray(),
      paymentMethods: await db.paymentMethods.toArray(),
      incomeSources: await db.incomeSources.toArray(),
      incomes: await db.incomes.toArray(),
      recurringIncomes: await db.recurringIncomes.toArray(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportWarnings([]);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const validation = validateImportData(data);
      if (!validation.valid) {
        setImportStatus(`Validation failed: ${validation.errors[0]}`);
        return;
      }
      if (validation.warnings.length > 0) {
        setImportWarnings(validation.warnings);
      }

      // Clear existing data and import
      await db.transaction('rw', [db.categories, db.expenses, db.monthlyBudgets, db.recurringExpenses, db.paymentMethods, db.incomeSources, db.incomes, db.recurringIncomes], async () => {
        await db.categories.clear();
        await db.expenses.clear();
        await db.monthlyBudgets.clear();
        await db.recurringExpenses.clear();
        await db.paymentMethods.clear();
        await db.incomeSources.clear();
        await db.incomes.clear();
        await db.recurringIncomes.clear();

        if (data.categories?.length) await db.categories.bulkAdd(data.categories);
        if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
        if (data.monthlyBudgets?.length) await db.monthlyBudgets.bulkAdd(data.monthlyBudgets);
        if (data.recurringExpenses?.length) await db.recurringExpenses.bulkAdd(data.recurringExpenses);
        if (data.paymentMethods?.length) await db.paymentMethods.bulkAdd(data.paymentMethods);
        if (data.incomeSources?.length) await db.incomeSources.bulkAdd(data.incomeSources);
        if (data.incomes?.length) await db.incomes.bulkAdd(data.incomes);
        if (data.recurringIncomes?.length) await db.recurringIncomes.bulkAdd(data.recurringIncomes);
      });

      await refresh();
      setImportStatus(validation.warnings.length > 0 ? 'Import successful with warnings' : 'Import successful!');
    } catch {
      setImportStatus('Failed to import file');
    }

    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-2 flex items-center gap-2"><Download className="w-5 h-5 text-indigo-400" /> Export Data</h3>
        <p className="text-slate-400 text-sm mb-4">
          Download all your budget data as a JSON file for backup.
        </p>
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Export Data
        </button>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-2 flex items-center gap-2"><Upload className="w-5 h-5 text-indigo-400" /> Import Data</h3>
        <p className="text-slate-400 text-sm mb-4">
          Restore data from a previously exported JSON file. This will replace all current data.
        </p>
        <label className="btn-primary inline-flex px-6 py-2 cursor-pointer items-center gap-1.5">
          <Upload className="w-4 h-4" /> Import Data
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
        {importStatus && (
          <p className={`mt-3 text-sm ${importStatus.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
            {importStatus}
          </p>
        )}
        {importWarnings.length > 0 && (
          <div className="mt-3 p-3 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl">
            <p className="text-sm font-medium text-amber-400 flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4" /> Import Warnings
            </p>
            <ul className="text-xs text-amber-300 space-y-0.5 max-h-32 overflow-y-auto">
              {importWarnings.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-400" /> Security Info</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>✅ All data stored locally in your browser (IndexedDB)</li>
          <li>✅ No data sent to any server</li>
          <li>✅ No analytics or tracking</li>
          <li>✅ Works completely offline</li>
          <li>ℹ️ Optional PIN lock for app access — data is <strong className="text-slate-300">not</strong> encrypted at rest</li>
        </ul>
      </div>
    </div>
  );
}
