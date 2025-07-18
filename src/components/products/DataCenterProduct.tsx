import React from 'react';
import { Purchase } from '@/lib/fileStorage';

interface DataCenterProductProps {
  purchases: Purchase[];
  totalIncome: number;
}

export default function DataCenterProduct({ purchases, totalIncome }: DataCenterProductProps) {
  const totalAmount = purchases.reduce((sum, p) => sum + p.price, 0);
  const purchaseAmount = purchases.reduce((sum, p) => sum + p.price, 0);
  
  return (
    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/30 backdrop-blur-sm border border-blue-400/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-white">Data Center</h3>
        <div className="bg-blue-500/20 px-3 py-1 rounded-full">
          <span className="text-blue-300 text-sm font-medium">Infrastructure</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Amount</p>
          <p className="text-lg font-bold text-white">
            ₩{totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Purchase Amount</p>
          <p className="text-lg font-bold text-blue-400">
            ₩{purchaseAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Accumulated Income</p>
          <p className="text-lg font-bold text-green-400">
            ₩{totalIncome.toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm">Original Income Display</p>
          <span className="text-sm text-gray-500">In Won</span>
        </div>
        <div className="bg-gray-900/50 rounded p-3">
          <p className="text-2xl font-bold text-blue-400">
            ₩{totalIncome.toLocaleString()}
          </p>
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