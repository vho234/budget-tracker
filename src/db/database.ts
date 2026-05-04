import Dexie, { type Table } from 'dexie';
import type { Category, Expense, MonthlyBudget, RecurringExpense, PaymentMethod, IncomeSource, Income, RecurringIncome } from '../models/types';

export class BudgetDatabase extends Dexie {
  categories!: Table<Category, string>;
  expenses!: Table<Expense, string>;
  monthlyBudgets!: Table<MonthlyBudget, string>;
  recurringExpenses!: Table<RecurringExpense, string>;
  paymentMethods!: Table<PaymentMethod, string>;
  incomeSources!: Table<IncomeSource, string>;
  incomes!: Table<Income, string>;
  recurringIncomes!: Table<RecurringIncome, string>;

  constructor() {
    super('BudgetTrackerDB');
    this.version(1).stores({
      categories: 'id, name',
      expenses: 'id, categoryId, date, [categoryId+date]',
      monthlyBudgets: 'id, categoryId, month, [categoryId+month]',
      recurringExpenses: 'id, categoryId, active',
    });
    this.version(2).stores({
      categories: 'id, name',
      expenses: 'id, categoryId, date, paymentMethodId, [categoryId+date]',
      monthlyBudgets: 'id, categoryId, month, [categoryId+month]',
      recurringExpenses: 'id, categoryId, active',
      paymentMethods: 'id, name',
    });
    this.version(3).stores({
      categories: 'id, name',
      expenses: 'id, categoryId, date, paymentMethodId, [categoryId+date]',
      monthlyBudgets: 'id, categoryId, month, [categoryId+month]',
      recurringExpenses: 'id, categoryId, active',
      paymentMethods: 'id, name',
      incomeSources: 'id, name',
      incomes: 'id, sourceId, date, paymentMethodId, [sourceId+date]',
      recurringIncomes: 'id, sourceId, active',
    });
    this.version(4).stores({
      categories: 'id, name',
      expenses: 'id, categoryId, date, paymentMethodId, recurringExpenseId, [categoryId+date]',
      monthlyBudgets: 'id, categoryId, month, [categoryId+month]',
      recurringExpenses: 'id, categoryId, active',
      paymentMethods: 'id, name',
      incomeSources: 'id, name',
      incomes: 'id, sourceId, date, paymentMethodId, recurringIncomeId, [sourceId+date]',
      recurringIncomes: 'id, sourceId, active',
    });
    this.version(5).stores({
      categories: 'id, name',
      expenses: 'id, categoryId, date, paymentMethodId, recurringExpenseId, [categoryId+date], [recurringExpenseId+date]',
      monthlyBudgets: 'id, categoryId, month, [categoryId+month]',
      recurringExpenses: 'id, categoryId, active',
      paymentMethods: 'id, name',
      incomeSources: 'id, name',
      incomes: 'id, sourceId, date, paymentMethodId, recurringIncomeId, [sourceId+date], [recurringIncomeId+date]',
      recurringIncomes: 'id, sourceId, active',
    });
  }
}

export const db = new BudgetDatabase();

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-groceries', name: 'Groceries', color: '#22c55e' },
  { id: 'cat-rent', name: 'Rent/Housing', color: '#3b82f6' },
  { id: 'cat-utilities', name: 'Utilities', color: '#f59e0b' },
  { id: 'cat-transport', name: 'Transportation', color: '#8b5cf6' },
  { id: 'cat-entertainment', name: 'Entertainment', color: '#ec4899' },
  { id: 'cat-dining', name: 'Dining Out', color: '#f97316' },
  { id: 'cat-health', name: 'Health/Medical', color: '#14b8a6' },
  { id: 'cat-shopping', name: 'Shopping', color: '#6366f1' },
  { id: 'cat-subscriptions', name: 'Subscriptions', color: '#a855f7' },
  { id: 'cat-other', name: 'Other', color: '#6b7280' },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-cash', name: 'Cash', icon: '💵' },
  { id: 'pm-debit', name: 'Debit Card', icon: '💳' },
  { id: 'pm-credit', name: 'Credit Card', icon: '🏦' },
  { id: 'pm-bank-transfer', name: 'Bank Transfer', icon: '🔄' },
  { id: 'pm-mobile', name: 'Mobile Payment', icon: '📱' },
  { id: 'pm-check', name: 'Check', icon: '📝' },
];

export const DEFAULT_INCOME_SOURCES: IncomeSource[] = [
  { id: 'inc-salary', name: 'Salary', color: '#22c55e' },
  { id: 'inc-freelance', name: 'Freelance', color: '#3b82f6' },
  { id: 'inc-investments', name: 'Investments', color: '#8b5cf6' },
  { id: 'inc-gifts', name: 'Gifts', color: '#ec4899' },
  { id: 'inc-refunds', name: 'Refunds', color: '#f59e0b' },
  { id: 'inc-other', name: 'Other', color: '#6b7280' },
];

// Seed defaults when the database is first created
db.on('populate', () => {
  db.categories.bulkAdd(DEFAULT_CATEGORIES);
  db.paymentMethods.bulkAdd(DEFAULT_PAYMENT_METHODS);
  db.incomeSources.bulkAdd(DEFAULT_INCOME_SOURCES);
});

function getLastDayOfMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

export function getExpensesForMonth(month: string) {
  return db.expenses
    .where('date')
    .between(`${month}-01`, getLastDayOfMonth(month), true, true)
    .toArray();
}

export function getIncomesForMonth(month: string) {
  return db.incomes
    .where('date')
    .between(`${month}-01`, getLastDayOfMonth(month), true, true)
    .toArray();
}

export function getBudgetsForMonth(month: string) {
  return db.monthlyBudgets
    .where('month')
    .equals(month)
    .toArray();
}

export async function seedDefaultCategories(): Promise<void> {
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
  const pmCount = await db.paymentMethods.count();
  if (pmCount === 0) {
    await db.paymentMethods.bulkAdd(DEFAULT_PAYMENT_METHODS);
  }
  const incCount = await db.incomeSources.count();
  if (incCount === 0) {
    await db.incomeSources.bulkAdd(DEFAULT_INCOME_SOURCES);
  }
}
