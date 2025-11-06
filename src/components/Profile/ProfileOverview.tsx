// src/components/Profile/ProfileOverview.tsx
'use client';

import { Activity, ArrowDown, ArrowUp, Wallet, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const transactions = [
  { id: 1, type: 'deposit', asset: 'JitoSOL', amount: '42.0', usd: '$1,240', date: new Date('2025-11-05T14:22:00Z'), status: 'completed' },
  { id: 2, type: 'withdraw', asset: 'USDC', amount: '5,200', usd: '$5,200', date: new Date('2025-11-04T09:15:00Z'), status: 'completed' },
  { id: 3, type: 'deposit', asset: 'hJLP', amount: '18.5', usd: '$2,850', date: new Date('2025-11-03T22:40:00Z'), status: 'completed' },
  { id: 4, type: 'withdraw', asset: 'JitoSOL', amount: '10.0', usd: '$295', date: new Date('2025-11-02T11:11:00Z'), status: 'pending' },
];

export function ProfileOverview() {
  const totalDeposited = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + parseFloat(t.usd.replace(/[^0-9.-]/g, '')), 0);

  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + parseFloat(t.usd.replace(/[^0-9.-]/g, '')), 0);

  return (
    <>
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-glow">
          Your Empire
        </h1>
        <p className="text-2xl text-gray-300 mt-4">Track every move. Own the game.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="glass-card p-10 text-center group hover:scale-105 transition-all duration-500">
          <Wallet className="w-16 h-16 mx-auto mb-6 text-purple-400 group-hover:text-purple-300" />
          <p className="text-gray-400 text-lg">Total Deposited</p>
          <p className="text-5xl font-black text-white mt-4">${totalDeposited.toLocaleString()}</p>
        </div>

        <div className="glass-card p-10 text-center group hover:scale-105 transition-all duration-500">
          <TrendingUp className="w-16 h-16 mx-auto mb-6 text-emerald-400 group-hover:text-emerald-300" />
          <p className="text-gray-400 text-lg">Total Withdrawn</p>
          <p className="text-5xl font-black text-white mt-4">${totalWithdrawn.toLocaleString()}</p>
        </div>

        <div className="glass-card p-10 text-center group hover:scale-105 transition-all duration-500">
          <Activity className="w-16 h-16 mx-auto mb-6 text-cyan-400 group-hover:text-cyan-300" />
          <p className="text-gray-400 text-lg">Net Position</p>
          <p className="text-5xl font-black text-white mt-4">
            ${ (totalDeposited - totalWithdrawn).toLocaleString() }
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card p-10">
        <h2 className="text-4xl font-black text-white mb-8 flex items-center gap-4">
          <Activity className="w-10 h-10 text-purple-400" />
          Transaction History
        </h2>

        <div className="space-y-6">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="glass-card p-8 rounded-3xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    tx.type === 'deposit' 
                      ? 'bg-emerald-500/20 border-2 border-emerald-500/50' 
                      : 'bg-red-500/20 border-2 border-red-500/50'
                  }`}>
                    {tx.type === 'deposit' ? 
                      <ArrowDown className="w-8 h-8 text-emerald-400" /> : 
                      <ArrowUp className="w-8 h-8 text-red-400" />
                    }
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-white capitalize">{tx.type}</p>
                    <p className="text-lg text-gray-400">{tx.asset}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-white">
                    {tx.type === 'deposit' ? '+' : '-'}{tx.usd}
                  </p>
                  <p className="text-lg text-gray-400">{tx.amount} {tx.asset}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                <p className="text-gray-400">
                  {format(tx.date, 'dd MMM yyyy • HH:mm')}
                </p>
                <span className={`px-6 py-2 rounded-full text-sm font-bold ${
                  tx.status === 'completed' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                }`}>
                  {tx.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
