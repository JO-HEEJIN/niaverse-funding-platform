import React from 'react';
import { Purchase } from '@/lib/fileStorage';
import { formatKRW } from '@/lib/formatters';

interface DataCenterProductProps {
  purchases: Purchase[];
  totalIncome: number;
}

export default function DataCenterProduct({ purchases, totalIncome }: DataCenterProductProps) {
  // Calculate totals with proper number handling and validation
  const totalAmount = purchases.reduce((sum, p) => {
    const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
  
  const purchaseAmount = totalAmount; // Same as total amount
  
  // Ensure totalIncome is a clean number with thorough validation
  let cleanTotalIncome = 0;
  if (typeof totalIncome === 'number' && !isNaN(totalIncome)) {
    cleanTotalIncome = totalIncome;
  } else if (typeof totalIncome === 'string') {
    const parsed = parseFloat(totalIncome);
    cleanTotalIncome = isNaN(parsed) ? 0 : parsed;
  }
  
  // Debug logging (remove in production)
  console.log('DataCenter Debug:', {
    totalAmount,
    cleanTotalIncome,
    originalTotalIncome: totalIncome,
    purchases: purchases.map(p => ({ price: p.price, accumulatedIncome: p.accumulatedIncome }))
  });
  
  return (
    <div className="investment-card bg-gradient-to-br from-blue-600/20 to-blue-800/30 backdrop-blur-sm border border-blue-400/20 rounded-lg p-4 sm:p-6">
      <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h3 className="text-xl sm:text-2xl font-bold text-white">Data Center</h3>
        <div className="badge bg-blue-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
          <span className="text-blue-300 text-sm font-medium">Infrastructure</span>
        </div>
      </div>
      
      <div className="investment-stats grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="stat-item bg-gray-800/50 rounded-lg p-4">
          <p className="stat-label text-gray-400 text-sm mb-2">Total Amount</p>
          <p className="stat-value text-lg font-bold text-white overflow-hidden text-ellipsis">
            {formatKRW(totalAmount)}
          </p>
        </div>
        <div className="stat-item bg-gray-800/50 rounded-lg p-4">
          <p className="stat-label text-gray-400 text-sm mb-2">Purchase Amount</p>
          <p className="stat-value text-lg font-bold text-blue-400 overflow-hidden text-ellipsis">
            {formatKRW(purchaseAmount)}
          </p>
        </div>
        <div className="stat-item bg-gray-800/50 rounded-lg p-4">
          <p className="stat-label text-gray-400 text-sm mb-2">Accumulated Income</p>
          <p className="stat-value text-lg font-bold text-green-400 overflow-hidden text-ellipsis">
            {formatKRW(cleanTotalIncome)}
          </p>
        </div>
      </div>
      
      <div className="income-display bg-gray-800/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
          <p className="income-label text-gray-400 text-sm">Original Income Display</p>
          <span className="text-sm text-gray-500">In Won</span>
        </div>
        <div className="bg-gray-900/50 rounded p-3">
          <p className="income-value text-xl sm:text-2xl font-bold text-blue-400 overflow-hidden text-ellipsis">
            {formatKRW(cleanTotalIncome)}
          </p>
          <span className="period text-gray-400 text-sm">/Mon</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Your data center investment is providing stable returns from cloud infrastructure services.
        </p>
      </div>
    </div>
  );
}