import React from 'react';
import { Purchase } from '@/lib/fileStorage';
import { formatCoinAmount, formatKRW } from '@/lib/formatters';

interface VASTcoinProductProps {
  purchases: Purchase[];
  totalIncome: number;
}

export default function VASTcoinProduct({ purchases, totalIncome }: VASTcoinProductProps) {
  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
  
  // VAST to KRW conversion
  const vastToUSD = 1; // 1 VAST = $1
  const usdToKRW = 1300; // 1 USD = 1,300 KRW
  const currentValueInKRW = totalIncome * vastToUSD * usdToKRW;
  
  return (
    <div className="investment-card bg-gradient-to-br from-purple-600/20 to-purple-800/30 backdrop-blur-sm border border-purple-400/20 rounded-lg p-4 sm:p-6">
      <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h3 className="text-xl sm:text-2xl font-bold text-white">VAST coin</h3>
        <div className="badge bg-purple-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
          <span className="text-purple-300 text-sm font-medium">Cryptocurrency</span>
        </div>
      </div>
      
      <div className="vast-holdings grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="stat-item bg-gray-800/50 rounded-lg p-4">
          <p className="stat-label text-gray-400 text-sm mb-2">Total Holdings</p>
          <p className="stat-value text-xl font-bold text-white overflow-hidden text-ellipsis">
            {formatCoinAmount(totalQuantity, 'VAST')}
          </p>
        </div>
        <div className="stat-item bg-gray-800/50 rounded-lg p-4">
          <p className="stat-label text-gray-400 text-sm mb-2">Current Value</p>
          <p className="stat-value text-xl font-bold text-purple-400 overflow-hidden text-ellipsis">
            {formatKRW(currentValueInKRW)}
          </p>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-gray-400 text-sm mb-2">Market Performance</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">24h Change</span>
            <span className="text-green-400">+5.23%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Market Cap</span>
            <span className="text-white">$1.2B</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          VAST coin is utilizing advanced blockchain technology for next-generation transactions.
        </p>
      </div>
    </div>
  );
}