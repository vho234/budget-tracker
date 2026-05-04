import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useBudget } from '../../context/BudgetContext';
import { PieChart as PieChartIcon } from 'lucide-react';

export function SpendingByCategory() {
  const { expenses, categories, selectedMonth } = useBudget();

  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  const data = categories
    .map((cat) => ({
      name: cat.name,
      value: monthExpenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0),
      color: cat.color,
      fill: cat.color,
    }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 flex flex-col items-center justify-center h-80">
        <PieChartIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No spending data</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6 transition-all duration-300 hover:bg-slate-800/80">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-indigo-400" /> Spending by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={35}
            dataKey="value"
            label={({ cx, cy, midAngle, outerRadius, percent, fill }) => {
              const RADIAN = Math.PI / 180;
              const radius = outerRadius + 30;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill={fill}
                  textAnchor={x > cx ? 'start' : 'end'}
                  dominantBaseline="central"
                  fontSize={12}
                >
                  {`${((percent ?? 0) * 100).toFixed(0)}%`}
                </text>
              );
            }}
            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
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
            itemStyle={{ color: '#e2e8f0' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
