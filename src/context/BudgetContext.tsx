import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { db, seedDefaultCategories, getExpensesForMonth, getIncomesForMonth, getBudgetsForMonth } from '../db/database';
import type { Category, Expense, MonthlyBudget, RecurringExpense, PaymentMethod, IncomeSource, Income, RecurringIncome } from '../models/types';
import { generateRecurringExpenses, generateRecurringIncomes } from '../utils/recurring';

interface BudgetState {
  categories: Category[];
  expenses: Expense[];
  monthlyBudgets: MonthlyBudget[];
  recurringExpenses: RecurringExpense[];
  paymentMethods: PaymentMethod[];
  incomeSources: IncomeSource[];
  incomes: Income[];
  recurringIncomes: RecurringIncome[];
  selectedMonth: string; // "YYYY-MM"
  isLoading: boolean;
  error: string | null;
}

interface BudgetContextValue extends BudgetState {
  // Categories
  addCategory: (cat: Category) => Promise<boolean>;
  updateCategory: (cat: Category) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  // Expenses
  addExpense: (exp: Expense) => Promise<boolean>;
  updateExpense: (exp: Expense) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  // Budgets
  setBudget: (budget: MonthlyBudget) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  // Recurring Expenses
  addRecurring: (rec: RecurringExpense) => Promise<boolean>;
  updateRecurring: (rec: RecurringExpense) => Promise<boolean>;
  deleteRecurring: (id: string) => Promise<boolean>;
  // Payment Methods
  addPaymentMethod: (pm: PaymentMethod) => Promise<boolean>;
  updatePaymentMethod: (pm: PaymentMethod) => Promise<boolean>;
  deletePaymentMethod: (id: string) => Promise<boolean>;
  // Income Sources
  addIncomeSource: (src: IncomeSource) => Promise<boolean>;
  updateIncomeSource: (src: IncomeSource) => Promise<boolean>;
  deleteIncomeSource: (id: string) => Promise<boolean>;
  // Incomes
  addIncome: (inc: Income) => Promise<boolean>;
  updateIncome: (inc: Income) => Promise<boolean>;
  deleteIncome: (id: string) => Promise<boolean>;
  // Recurring Incomes
  addRecurringIncome: (rec: RecurringIncome) => Promise<boolean>;
  updateRecurringIncome: (rec: RecurringIncome) => Promise<boolean>;
  deleteRecurringIncome: (id: string) => Promise<boolean>;
  // Navigation
  setSelectedMonth: (month: string) => Promise<void>;
  // Refresh
  refresh: () => Promise<void>;
  // Error
  clearError: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const INITIAL_MONTH = getCurrentMonth();

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetState>({
    categories: [],
    expenses: [],
    monthlyBudgets: [],
    recurringExpenses: [],
    paymentMethods: [],
    incomeSources: [],
    incomes: [],
    recurringIncomes: [],
    selectedMonth: INITIAL_MONTH,
    isLoading: true,
    error: null,
  });

  const mountedRef = useRef(true);
  const selectedMonthRef = useRef(state.selectedMonth);

  useEffect(() => {
    selectedMonthRef.current = state.selectedMonth;
  }, [state.selectedMonth]);

  const setError = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, error: msg }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const loadData = useCallback(async (month: string) => {
    try {
      await seedDefaultCategories();
      await generateRecurringExpenses(month);
      await generateRecurringIncomes(month);
      const categories = await db.categories.toArray();
      const expenses = await getExpensesForMonth(month);
      const monthlyBudgets = await getBudgetsForMonth(month);
      const recurringExpenses = await db.recurringExpenses.toArray();
      const paymentMethods = await db.paymentMethods.toArray();
      const incomeSources = await db.incomeSources.toArray();
      const incomes = await getIncomesForMonth(month);
      const recurringIncomes = await db.recurringIncomes.toArray();
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        categories,
        expenses,
        monthlyBudgets,
        recurringExpenses,
        paymentMethods,
        incomeSources,
        incomes,
        recurringIncomes,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      if (!mountedRef.current) return;
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [setError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount is intentional
    loadData(INITIAL_MONTH);
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    await loadData(selectedMonthRef.current);
  }, [loadData]);

  // Categories
  const addCategory = useCallback(async (cat: Category): Promise<boolean> => {
    try {
      await db.categories.add(cat);
      setState((prev) => ({ ...prev, categories: [...prev.categories, cat] }));
      return true;
    } catch (err) {
      setError(`Failed to add category: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const updateCategory = useCallback(async (cat: Category): Promise<boolean> => {
    try {
      await db.categories.put(cat);
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === cat.id ? cat : c)),
      }));
      return true;
    } catch (err) {
      setError(`Failed to update category: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      const hasExpenses = await db.expenses.where('categoryId').equals(id).count();
      const hasBudgets = await db.monthlyBudgets.where('categoryId').equals(id).count();
      const hasRecurring = await db.recurringExpenses.where('categoryId').equals(id).count();
      if (hasExpenses || hasBudgets || hasRecurring) {
        setError('Cannot delete category: it has associated expenses, budgets, or recurring entries. Remove those first.');
        return false;
      }
      await db.categories.delete(id);
      setState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
      }));
      return true;
    } catch (err) {
      setError(`Failed to delete category: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  // Expenses
  const addExpense = useCallback(async (exp: Expense): Promise<boolean> => {
    try {
      await db.expenses.add(exp);
      setState((prev) => ({ ...prev, expenses: [...prev.expenses, exp] }));
      return true;
    } catch (err) {
      setError(`Failed to add expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const updateExpense = useCallback(async (exp: Expense): Promise<boolean> => {
    try {
      await db.expenses.put(exp);
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) => (e.id === exp.id ? exp : e)),
      }));
      return true;
    } catch (err) {
      setError(`Failed to update expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      await db.expenses.delete(id);
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
      }));
      return true;
    } catch (err) {
      setError(`Failed to delete expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  // Budgets
  const setBudget = useCallback(async (budget: MonthlyBudget): Promise<boolean> => {
    try {
      await db.monthlyBudgets.put(budget);
      setState((prev) => {
        const exists = prev.monthlyBudgets.find((b) => b.id === budget.id);
        const monthlyBudgets = exists
          ? prev.monthlyBudgets.map((b) => (b.id === budget.id ? budget : b))
          : [...prev.monthlyBudgets, budget];
        return { ...prev, monthlyBudgets };
      });
      return true;
    } catch (err) {
      setError(`Failed to set budget: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const deleteBudget = useCallback(async (id: string): Promise<boolean> => {
    try {
      await db.monthlyBudgets.delete(id);
      setState((prev) => ({
        ...prev,
        monthlyBudgets: prev.monthlyBudgets.filter((b) => b.id !== id),
      }));
      return true;
    } catch (err) {
      setError(`Failed to delete budget: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  // Recurring
  const addRecurring = useCallback(async (rec: RecurringExpense): Promise<boolean> => {
    try {
      await db.recurringExpenses.add(rec);
      setState((prev) => ({
        ...prev,
        recurringExpenses: [...prev.recurringExpenses, rec],
      }));
      return true;
    } catch (err) {
      setError(`Failed to add recurring expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const updateRecurring = useCallback(async (rec: RecurringExpense): Promise<boolean> => {
    try {
      await db.recurringExpenses.put(rec);
      setState((prev) => ({
        ...prev,
        recurringExpenses: prev.recurringExpenses.map((r) =>
          r.id === rec.id ? rec : r
        ),
      }));
      return true;
    } catch (err) {
      setError(`Failed to update recurring expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const deleteRecurring = useCallback(async (id: string): Promise<boolean> => {
    try {
      await db.recurringExpenses.delete(id);
      setState((prev) => ({
        ...prev,
        recurringExpenses: prev.recurringExpenses.filter((r) => r.id !== id),
      }));
      return true;
    } catch (err) {
      setError(`Failed to delete recurring expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const setSelectedMonth = useCallback(async (month: string) => {
    setState((prev) => ({ ...prev, selectedMonth: month }));
    await loadData(month);
  }, [loadData]);

  // Payment Methods
  const addPaymentMethod = useCallback(async (pm: PaymentMethod): Promise<boolean> => {
    try {
      await db.paymentMethods.add(pm);
      setState((prev) => ({ ...prev, paymentMethods: [...prev.paymentMethods, pm] }));
      return true;
    } catch (err) {
      setError(`Failed to add payment method: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const updatePaymentMethod = useCallback(async (pm: PaymentMethod): Promise<boolean> => {
    try {
      await db.paymentMethods.put(pm);
      setState((prev) => ({
        ...prev,
        paymentMethods: prev.paymentMethods.map((p) => (p.id === pm.id ? pm : p)),
      }));
      return true;
    } catch (err) {
      setError(`Failed to update payment method: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const deletePaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    try {
      const hasExpenses = await db.expenses.where('paymentMethodId').equals(id).count();
      const hasIncomes = await db.incomes.where('paymentMethodId').equals(id).count();
      const hasRecurringExpenses = await db.recurringExpenses.where('paymentMethodId').equals(id).count();
      const hasRecurringIncomes = await db.recurringIncomes.where('paymentMethodId').equals(id).count();
      if (hasExpenses || hasIncomes || hasRecurringExpenses || hasRecurringIncomes) {
        setError('Cannot delete payment method: it has associated expenses, incomes, or recurring entries. Remove those first.');
        return false;
      }
      await db.paymentMethods.delete(id);
      setState((prev) => ({
        ...prev,
        paymentMethods: prev.paymentMethods.filter((p) => p.id !== id),
      }));
      return true;
    } catch (err) {
      setError(`Failed to delete payment method: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  // Income Sources
  const addIncomeSource = useCallback(async (src: IncomeSource): Promise<boolean> => {
    try {
      await db.incomeSources.add(src);
      setState((prev) => ({ ...prev, incomeSources: [...prev.incomeSources, src] }));
      return true;
    } catch (err) {
      setError(`Failed to add income source: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const updateIncomeSource = useCallback(async (src: IncomeSource): Promise<boolean> => {
    try {
      await db.incomeSources.put(src);
      setState((prev) => ({
        ...prev,
        incomeSources: prev.incomeSources.map((s) => (s.id === src.id ? src : s)),
      }));
      return true;
    } catch (err) {
      setError(`Failed to update income source: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const deleteIncomeSource = useCallback(async (id: string): Promise<boolean> => {
    try {
      const hasIncomes = await db.incomes.where('sourceId').equals(id).count();
      const hasRecurringIncomes = await db.recurringIncomes.where('sourceId').equals(id).count();
      if (hasIncomes || hasRecurringIncomes) {
        setError('Cannot delete income source: it has associated incomes or recurring incomes. Remove those first.');
        return false;
      }
      await db.incomeSources.delete(id);
      setState((prev) => ({
        ...prev,
        incomeSources: prev.incomeSources.filter((s) => s.id !== id),
      }));
      return true;
    } catch (err) {
      setError(`Failed to delete income source: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  // Incomes
  const addIncome = useCallback(async (inc: Income): Promise<boolean> => {
    try {
      await db.incomes.add(inc);
      setState((prev) => ({ ...prev, incomes: [...prev.incomes, inc] }));
      return true;
    } catch (err) {
      setError(`Failed to add income: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const updateIncome = useCallback(async (inc: Income): Promise<boolean> => {
    try {
      await db.incomes.put(inc);
      setState((prev) => ({
        ...prev,
        incomes: prev.incomes.map((i) => (i.id === inc.id ? inc : i)),
      }));
      return true;
    } catch (err) {
      setError(`Failed to update income: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const deleteIncome = useCallback(async (id: string): Promise<boolean> => {
    try {
      await db.incomes.delete(id);
      setState((prev) => ({
        ...prev,
        incomes: prev.incomes.filter((i) => i.id !== id),
      }));
      return true;
    } catch (err) {
      setError(`Failed to delete income: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  // Recurring Incomes
  const addRecurringIncome = useCallback(async (rec: RecurringIncome): Promise<boolean> => {
    try {
      await db.recurringIncomes.add(rec);
      setState((prev) => ({
        ...prev,
        recurringIncomes: [...prev.recurringIncomes, rec],
      }));
      return true;
    } catch (err) {
      setError(`Failed to add recurring income: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const updateRecurringIncome = useCallback(async (rec: RecurringIncome): Promise<boolean> => {
    try {
      await db.recurringIncomes.put(rec);
      setState((prev) => ({
        ...prev,
        recurringIncomes: prev.recurringIncomes.map((r) =>
          r.id === rec.id ? rec : r
        ),
      }));
      return true;
    } catch (err) {
      setError(`Failed to update recurring income: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const deleteRecurringIncome = useCallback(async (id: string): Promise<boolean> => {
    try {
      await db.recurringIncomes.delete(id);
      setState((prev) => ({
        ...prev,
        recurringIncomes: prev.recurringIncomes.filter((r) => r.id !== id),
      }));
      return true;
    } catch (err) {
      setError(`Failed to delete recurring income: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, [setError]);

  const value = useMemo<BudgetContextValue>(() => ({
    ...state,
    addCategory,
    updateCategory,
    deleteCategory,
    addExpense,
    updateExpense,
    deleteExpense,
    setBudget,
    deleteBudget,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    addIncome,
    updateIncome,
    deleteIncome,
    addRecurringIncome,
    updateRecurringIncome,
    deleteRecurringIncome,
    setSelectedMonth,
    refresh,
    clearError,
  }), [
    state,
    addCategory, updateCategory, deleteCategory,
    addExpense, updateExpense, deleteExpense,
    setBudget, deleteBudget,
    addRecurring, updateRecurring, deleteRecurring,
    addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
    addIncomeSource, updateIncomeSource, deleteIncomeSource,
    addIncome, updateIncome, deleteIncome,
    addRecurringIncome, updateRecurringIncome, deleteRecurringIncome,
    setSelectedMonth, refresh, clearError,
  ]);

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook must co-locate with context
export function useBudget(): BudgetContextValue {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used within BudgetProvider');
  return context;
}
