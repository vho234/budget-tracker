export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: string; // ISO date YYYY-MM-DD
  note?: string;
  isRecurring?: boolean;
  paymentMethodId?: string;
  recurringExpenseId?: string; // ID of RecurringExpense that generated this
}

export interface MonthlyBudget {
  id: string;
  categoryId: string;
  month: string; // "YYYY-MM"
  limit: number;
}

export interface RecurringExpense {
  id: string;
  amount: number;
  categoryId: string;
  dayOfMonth: number;
  note?: string;
  active: boolean;
  paymentMethodId?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string; // emoji
}

export interface IncomeSource {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Income {
  id: string;
  amount: number;
  sourceId: string;
  date: string; // ISO date YYYY-MM-DD
  note?: string;
  isRecurring?: boolean;
  paymentMethodId?: string;
  recurringIncomeId?: string; // ID of RecurringIncome that generated this
}

export interface RecurringIncome {
  id: string;
  amount: number;
  sourceId: string;
  dayOfMonth: number;
  note?: string;
  active: boolean;
  paymentMethodId?: string;
}

export interface AppSettings {
  id: string;
  pinHash?: string;
  pinSalt?: string;
  recoveryKeyHash?: string;
  recoverySalt?: string;
  securityQuestion?: string;
  encryptionKeyWrapped?: string; // Encryption key wrapped with PIN-derived key
  recoveryKeyWrapped?: string; // Encryption key wrapped with recovery-derived key
  hasPinEnabled: boolean;
}
