// src/components/Profile/ProfileOverview.tsx
'use client';

import { Activity, ArrowDown, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';

// Data from your original file
const transactions = [
  { id: 1, type: 'deposit', asset: 'JitoSOL', amount: '42.0', usd: '$1,240', date: new Date('2025-11-05T14:22:00Z'), status: 'completed' },
  { id: 2, type: 'withdraw', asset: 'USDC', amount: '5,200', usd: '$5,200', date: new Date('2025-11-04T09:15:00Z'), status: 'completed' },
  { id: 3, type: 'deposit', asset: 'hJLP', amount: '18.5', usd: '$2,850', date: new Date('2025-11-03T22:40:00Z'), status: 'completed' },
  { id: 4, type: 'withdraw', asset: 'JitoSOL', amount: '10.0', usd: '$295', date: new Date('2025-11-02T11:11:00Z'), status: 'pending' },
];

export function ProfileOverview() {
  // Logic from your original file
  const totalDeposited = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + parseFloat(t.usd.replace(/[^0-9.-]/g, '')), 0);

  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + parseFloat(t.usd.replace(/[^0-9.-]/g, '')), 0);

  const netPosition = totalDeposited - totalWithdrawn;
  const activePositions = transactions.length;

  return (
    <div className="space-y-8">
      {/* Profile summary with integrated data */}
      <div className="glass-card p-8">
        <h1 className="text-heading-xl mb-2">Your Profile</h1>
        <p className="text-slate-400 mb-8">Manage your vaults and account settings</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border border-slate-700/50">
            <p className="text-label mb-2">Net Position</p>
            <p className="text-stat text-cyan-400">
              ${netPosition.toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-6 border border-slate-700/50">
            <p className="text-label mb-2">Active Positions</p>
            <p className="text-stat text-slate-200">{activePositions}</p>
          </div>
          <div className="glass-card p-6 border border-slate-700/50">
            <p className="text-label mb-2">30-Day Return</p>
            <p className="text-stat text-slate-200">0%</p> {/* This can be updated with real data when available */}
          </div>
        </div>
      </div>

      {/* Transaction History with integrated data */}
      <div className="glass-card p-8">
        <h2 className="text-heading-lg mb-6 flex items-center gap-4">
            <Activity className="w-8 h-8 text-cyan-400" />
            Recent Activity
        </h2>
        
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="glass-card p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      tx.type === 'deposit' 
                        ? 'bg-emerald-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      {tx.type === 'deposit' ? 
                        <ArrowDown className="w-6 h-6 text-emerald-400" /> : 
                        <ArrowUp className="w-6 h-6 text-red-400" />
                      }
                    </div>

                    <div>
                      <p className="text-lg font-bold text-slate-100 capitalize">{tx.type}</p>
                      <p className="text-sm text-slate-400">{tx.asset}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-100">
                      {tx.type === 'deposit' ? '+' : '-'}{tx.usd}
                    </p>
                    <p className="text-sm text-slate-400">{tx.amount} {tx.asset}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-sm text-slate-400">
                    {format(tx.date, 'dd MMM yyyy • HH:mm')}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tx.status === 'completed' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {tx.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <p className="text-slate-400">No activity yet. Connect your wallet and start trading.</p>
        )}
      </div>
    </div>
  )
}
