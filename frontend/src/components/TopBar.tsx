import { User, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

export function TopBar() {
  return (
    <header className="bg-card border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="bg-primary text-white p-2 rounded-lg">
          <TrendingUp size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">FlowSync</h1>
      </div>

      <div className="flex space-x-6">
        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          <Wallet className="text-slate-400" size={20} />
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Current Cash</p>
            <p className="text-lg font-bold text-slate-700">$15,000</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          <TrendingUp className="text-slate-400" size={20} />
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">30-Day Projection</p>
            <p className="text-lg font-bold text-danger">-$1,200</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
          <AlertTriangle className="text-red-500" size={20} />
          <div>
            <p className="text-xs text-red-600 font-medium uppercase">Active Alerts</p>
            <p className="text-lg font-bold text-red-700">1 High / 2 Med</p>
          </div>
        </div>

        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden ml-4">
           <User className="text-slate-500" size={24} />
        </div>
      </div>
    </header>
  );
}
