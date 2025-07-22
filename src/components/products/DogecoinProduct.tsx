import React from 'react';
import { Purchase } from '@/lib/fileStorage';
import { formatCoinAmount } from '@/lib/formatters';

interface DogecoinProductProps {
  purchases: Purchase[];
  totalIncome: number;
}

export default function DogecoinProduct({ purchases, totalIncome }: DogecoinProductProps) {
  // Calculate total Doge coins: 1 mining unit = 1000 Doge (based on 1M won = 1000 Doge)
  const miningUnits = purchases.reduce((sum, p) => sum + (typeof p.quantity === 'number' ? p.quantity : 0), 0);
  const dogePerUnit = 1000; // 1 mining unit = 1000 Doge
  const totalDogeCoins = miningUnits * dogePerUnit;
  
  // Use accumulated income from database (set by admin) instead of calculating
  const accumulatedIncome = purchases.reduce((sum, p) => {
    const income = typeof p.accumulatedIncome === 'number' ? p.accumulatedIncome : 0;
    return sum + income;
  }, 0);
  const dailyIncomeRate = miningUnits * 2; // Each mining unit generates 2 Doge/day
  
  return (
    <div className="investment-card bg-gradient-to-br from-yellow-600/20 to-yellow-800/30 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-4 sm:p-6">
      <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h3 className="text-xl sm:text-2xl font-bold text-white">Doge coin</h3>
        <div className="badge bg-yellow-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
          <span className="text-yellow-300 text-sm font-medium">Cryptocurrency</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="stat-item bg-gray-800/50 rounded-lg p-4">
          <p className="stat-label text-gray-400 text-sm mb-2">Total Doge Holdings</p>
          <p className="stat-value text-xl font-bold text-white overflow-hidden text-ellipsis">
            {formatCoinAmount(totalDogeCoins, 'Doge')}
          </p>
        </div>
        <div className="stat-item bg-gray-800/50 rounded-lg p-4">
          <p className="stat-label text-gray-400 text-sm mb-2">Accumulated Income</p>
          <p className="stat-value text-xl font-bold text-green-400 overflow-hidden text-ellipsis">
            {formatCoinAmount(accumulatedIncome, 'Doge')}
          </p>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-gray-400 text-sm mb-2">Daily Income Rate</p>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-yellow-400">{dailyIncomeRate}</span>
          <span className="text-gray-400 ml-2">Doge/day</span>
        </div>
        {miningUnits > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {miningUnits} mining units × 2 Doge/day per unit
          </p>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Your Doge coin mining operation is generating passive income daily.
        </p>
      </div>
    </div>
  );
}