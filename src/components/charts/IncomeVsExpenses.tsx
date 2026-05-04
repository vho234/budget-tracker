import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ArrowLeftRight } from "lucide-react";
import { useBudget } from "../../context/BudgetContext";

function getWeekOfMonth(day: number): number {
  return Math.min(Math.ceil(day / 7), 5);
}

export default function IncomeVsExpenses() {
  const { expenses, incomes, selectedMonth } = useBudget();

  const { chartData, totalIncome, totalExpenses } = useMemo(() => {
    const weeks: Record<number, { income: number; expenses: number }> = {
      1: { income: 0, expenses: 0 },
      2: { income: 0, expenses: 0 },
      3: { income: 0, expenses: 0 },
      4: { income: 0, expenses: 0 },
      5: { income: 0, expenses: 0 },
    };

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const income of incomes) {
      if (income.date.startsWith(selectedMonth)) {
        const day = parseInt(income.date.split("-")[2], 10);
        const week = getWeekOfMonth(day);
        weeks[week].income += income.amount;
        totalIncome += income.amount;
      }
    }

    for (const expense of expenses) {
      if (expense.date.startsWith(selectedMonth)) {
        const day = parseInt(expense.date.split("-")[2], 10);
        const week = getWeekOfMonth(day);
        weeks[week].expenses += expense.amount;
        totalExpenses += expense.amount;
      }
    }

    const chartData = Object.entries(weeks).map(([week, data]) => ({
      name: `Week ${week}`,
      Income: parseFloat(data.income.toFixed(2)),
      Expenses: parseFloat(data.expenses.toFixed(2)),
    }));

    return { chartData, totalIncome, totalExpenses };
  }, [expenses, incomes, selectedMonth]);

  const net = totalIncome - totalExpenses;
  const hasData = totalIncome > 0 || totalExpenses > 0;

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 transition-all duration-300 hover:bg-slate-800/80">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100 mb-4">
        <ArrowLeftRight className="h-5 w-5 text-slate-400" />
        Income vs. Expenses
      </h2>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[280px] text-slate-500">
          <ArrowLeftRight className="h-10 w-10 mb-2" />
          <p>No data for this month</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  color: '#e2e8f0',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar
                dataKey="Income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Expenses"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <p
            className={`mt-4 text-center text-lg font-medium ${
              net >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            Net: {net >= 0 ? "+" : "-"}${Math.abs(net).toFixed(2)}
          </p>
        </>
      )}
    </div>
  );
}
