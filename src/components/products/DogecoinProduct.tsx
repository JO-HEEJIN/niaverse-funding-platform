import React from 'react';
import { Purchase } from '@/lib/fileStorage';
import { formatCoinAmount } from '@/lib/formatters';

interface DogecoinProductProps {
  purchases: Purchase[];
  totalIncome: number;
}

export default function DogecoinProduct({ purchases, totalIncome }: DogecoinProductProps) {
  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
  
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
          <p className="stat-label text-gray-400 text-sm mb-2">Total Investment</p>
          <p className="stat-value text-xl font-bold text-white break-all">
            {formatCoinAmount(totalQuantity, 'Doge')}
          </p>
        </div>
        <div className="stat-item bg-gray-800/50 rounded-lg p-4">
          <p className="stat-label text-gray-400 text-sm mb-2">Accumulated Income</p>
          <p className="stat-value text-xl font-bold text-green-400 break-all">
            {formatCoinAmount(totalIncome, 'Doge')}
          </p>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-gray-400 text-sm mb-2">Daily Income Rate</p>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-yellow-400">100</span>
          <span className="text-gray-400 ml-2">Doge/day per unit</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Your Doge coin mining operation is generating passive income daily.
        </p>
      </div>
    </div>
  );
}