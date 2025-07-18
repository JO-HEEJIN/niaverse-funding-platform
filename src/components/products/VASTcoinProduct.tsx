import React from 'react';
import { Purchase } from '@/lib/fileStorage';

interface VASTcoinProductProps {
  purchases: Purchase[];
  totalIncome: number;
}

export default function VASTcoinProduct({ purchases, totalIncome }: VASTcoinProductProps) {
  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
  
  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/30 backdrop-blur-sm border border-purple-400/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-white">VAST coin</h3>
        <div className="bg-purple-500/20 px-3 py-1 rounded-full">
          <span className="text-purple-300 text-sm font-medium">Cryptocurrency</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Holdings</p>
          <p className="text-xl font-bold text-white">
            {totalQuantity} Bast
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Current Value</p>
          <p className="text-xl font-bold text-purple-400">
            {totalIncome.toLocaleString()} Bast
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