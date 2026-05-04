import { db } from '../db/database';
import type { Expense, Income } from '../models/types';

/**
 * Generates expenses from active recurring entries for a given month.
 * Uses recurringExpenseId for reliable dedup, with legacy fallback for older entries.
 */
export async function generateRecurringExpenses(month: string): Promise<Expense[]> {
  const recurringExpenses = await db.recurringExpenses
    .filter((r) => r.active === true)
    .toArray();

  const [year, monthNum] = month.split('-').map(Number);
  const generated: Expense[] = [];

  for (const rec of recurringExpenses) {
    const day = Math.min(rec.dayOfMonth, new Date(year, monthNum, 0).getDate());
    const date = `${month}-${String(day).padStart(2, '0')}`;

    await db.transaction('rw', db.expenses, async () => {
      // Primary dedup: check by recurringExpenseId + date prefix
      const existingById = await db.expenses
        .where('[recurringExpenseId+date]')
        .between([rec.id, `${month}-01`], [rec.id, `${month}-31`], true, true)
        .first();

      if (existingById) return;

      // Legacy fallback: match older entries that lack recurringExpenseId
      const existingLegacy = await db.expenses
        .where('[categoryId+date]')
        .equals([rec.categoryId, date])
        .filter((e) => e.isRecurring === true && e.note === rec.note && !e.recurringExpenseId)
        .first();

      if (existingLegacy) {
        // Backfill the recurringExpenseId on legacy entry
        await db.expenses.update(existingLegacy.id, { recurringExpenseId: rec.id });
        return;
      }

      const expense: Expense = {
        id: crypto.randomUUID(),
        amount: rec.amount,
        categoryId: rec.categoryId,
        date,
        note: rec.note,
        isRecurring: true,
        paymentMethodId: rec.paymentMethodId,
        recurringExpenseId: rec.id,
      };
      await db.expenses.add(expense);
      generated.push(expense);
    });
  }

  return generated;
}

/**
 * Generates incomes from active recurring income entries for a given month.
 * Uses recurringIncomeId for reliable dedup, with legacy fallback for older entries.
 */
export async function generateRecurringIncomes(month: string): Promise<Income[]> {
  const recurringIncomes = await db.recurringIncomes
    .filter((r) => r.active === true)
    .toArray();

  const [year, monthNum] = month.split('-').map(Number);
  const generated: Income[] = [];

  for (const rec of recurringIncomes) {
    const day = Math.min(rec.dayOfMonth, new Date(year, monthNum, 0).getDate());
    const date = `${month}-${String(day).padStart(2, '0')}`;

    await db.transaction('rw', db.incomes, async () => {
      // Primary dedup: check by recurringIncomeId + date prefix
      const existingById = await db.incomes
        .where('[recurringIncomeId+date]')
        .between([rec.id, `${month}-01`], [rec.id, `${month}-31`], true, true)
        .first();

      if (existingById) return;

      // Legacy fallback: match older entries that lack recurringIncomeId
      const existingLegacy = await db.incomes
        .where('[sourceId+date]')
        .equals([rec.sourceId, date])
        .filter((i) => i.isRecurring === true && i.note === rec.note && !i.recurringIncomeId)
        .first();

      if (existingLegacy) {
        // Backfill the recurringIncomeId on legacy entry
        await db.incomes.update(existingLegacy.id, { recurringIncomeId: rec.id });
        return;
      }

      const income: Income = {
        id: crypto.randomUUID(),
        amount: rec.amount,
        sourceId: rec.sourceId,
        date,
        note: rec.note,
        isRecurring: true,
        paymentMethodId: rec.paymentMethodId,
        recurringIncomeId: rec.id,
      };
      await db.incomes.add(income);
      generated.push(income);
    });
  }

  return generated;
}
