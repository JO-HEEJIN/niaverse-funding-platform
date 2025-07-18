'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// fundingOptions no longer needed as data comes from API

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  fundingId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  processedDate?: Date;
  adminNotes?: string;
  userName: string;
  fundingTitle: string;
  fundingUnit: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'processed'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      router.push('/login');
      return;
    }

    // Check if user is admin by calling the me endpoint
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.isAdmin) {
          router.push('/dashboard');
          return;
        }
        loadWithdrawals();
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const loadWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals');
      }
      
      const withdrawals: WithdrawalRequest[] = await response.json();
      setWithdrawals(withdrawals);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
    setIsLoading(false);
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          withdrawalId,
          status: 'approved',
          adminNotes: 'Approved by admin'
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage('Withdrawal approved successfully');
        loadWithdrawals();
        
        // In a real app, this would trigger the actual payment process
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(result.message || 'Failed to approve withdrawal');
      }
    } catch (error) {
      setMessage('Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          withdrawalId,
          status: 'rejected',
          adminNotes: reason
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage('Withdrawal rejected');
        loadWithdrawals();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(result.message || 'Failed to reject withdrawal');
      }
    } catch (error) {
      setMessage('Failed to reject withdrawal');
    }
  };

  // These functions are no longer needed as the data comes from the API
  // const getUserName = (userId: string) => withdrawal.userName
  // const getFundingName = (fundingId: string) => withdrawal.fundingTitle

  const filteredWithdrawals = withdrawals.filter(w => 
    selectedTab === 'pending' ? w.status === 'pending' : w.status !== 'pending'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Admin Panel</h1>
          <p className="text-xl text-gray-300">Manage withdrawal requests</p>
        </div>

        {message && (
          <div className="mb-4 bg-green-500/20 border border-green-500 text-green-300 px-4 py-2 rounded-md text-center">
            {message}
          </div>
        )}

        <div className="mb-6 flex justify-center space-x-4">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`px-6 py-2 rounded-md font-medium ${
              selectedTab === 'pending'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Pending ({withdrawals.filter(w => w.status === 'pending').length})
          </button>
          <button
            onClick={() => setSelectedTab('processed')}
            className={`px-6 py-2 rounded-md font-medium ${
              selectedTab === 'processed'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Processed ({withdrawals.filter(w => w.status !== 'pending').length})
          </button>
        </div>

        {filteredWithdrawals.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-300 text-lg">No {selectedTab} withdrawal requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWithdrawals.map((withdrawal) => {
              return (
                <div key={withdrawal.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">User</p>
                      <p className="text-white font-medium">{withdrawal.userName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Product</p>
                      <p className="text-white font-medium">{withdrawal.fundingTitle}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Amount</p>
                      <p className="text-xl font-bold text-green-400">
                        {withdrawal.amount.toLocaleString()} {withdrawal.fundingUnit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Request Date</p>
                      <p className="text-white">
                        {new Date(withdrawal.requestDate).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {withdrawal.status === 'pending' ? (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) handleRejectWithdrawal(withdrawal.id, reason);
                        }}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            withdrawal.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {withdrawal.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {withdrawal.processedDate && 
                            `Processed: ${new Date(withdrawal.processedDate).toLocaleString()}`
                          }
                        </div>
                      </div>
                      {withdrawal.adminNotes && (
                        <p className="mt-2 text-sm text-gray-400">
                          Notes: {withdrawal.adminNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Admin Actions</h2>
          <button
            onClick={() => {
              fetch('/api/income/calculate', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                  setMessage(data.message);
                  setTimeout(() => setMessage(''), 3000);
                });
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Calculate Daily Income
          </button>
        </div>
      </div>
    </div>
  );
}