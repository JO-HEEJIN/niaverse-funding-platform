import React from 'react';
import { Purchase } from '@/lib/fileStorage';

interface DogecoinProductProps {
  purchases: Purchase[];
  totalIncome: number;
}

export default function DogecoinProduct({ purchases, totalIncome }: DogecoinProductProps) {
  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
  
  return (
    <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/30 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-white">Dogecoin</h3>
        <div className="bg-yellow-500/20 px-3 py-1 rounded-full">
          <span className="text-yellow-300 text-sm font-medium">Cryptocurrency</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Investment</p>
          <p className="text-xl font-bold text-white">
            {totalQuantity} Doji
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Accumulated Income</p>
          <p className="text-xl font-bold text-green-400">
            {totalIncome.toLocaleString()} Doji
          </p>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-gray-400 text-sm mb-2">Daily Income Rate</p>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-yellow-400">100</span>
          <span className="text-gray-400 ml-2">Doji/day per unit</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Your Dogecoin mining operation is generating passive income daily.
        </p>
      </div>
    </div>
  );
}