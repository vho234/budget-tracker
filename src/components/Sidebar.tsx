import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Receipt, Target, Tag, RefreshCw, Settings, Lock, Wallet, Banknote } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/income', label: 'Income', icon: Banknote },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/recurring', label: 'Recurring', icon: RefreshCw },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { pinSetupStatus, lock } = useAuth();

  return (
    <aside className="w-64 bg-slate-900/80 text-white min-h-screen flex flex-col border-r border-white/[0.12]">
      <div className="p-6">
        <h1 className="text-xl font-bold"><div className="flex items-center gap-2"><div className="bg-indigo-500/10 rounded-lg p-1.5"><Wallet className="w-6 h-6 text-indigo-400" /></div><span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Budget Tracker</span></div></h1>
      </div>
      <nav className="flex-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {pinSetupStatus === 'configured' && (
        <div className="p-4 border-t border-white/[0.16]">
          <button
            onClick={lock}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
          >
            <Lock className="w-4 h-4" /> Lock App
          </button>
        </div>
      )}
    </aside>
  );
}
