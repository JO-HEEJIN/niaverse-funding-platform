'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fundingOptions } from '@/lib/fundingData';

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

// Helper function to extract bank info from adminNotes
function extractBankInfo(adminNotes?: string): { bankName?: string; accountNumber?: string; accountHolder?: string } | null {
  if (!adminNotes) return null;
  
  // Pattern to match bank info in adminNotes
  const bankInfoMatch = adminNotes.match(/계좌: ([^ ]+) ([^ ]+) \(([^)]+)\)/);
  if (bankInfoMatch) {
    return {
      bankName: bankInfoMatch[1],
      accountNumber: bankInfoMatch[2],
      accountHolder: bankInfoMatch[3]
    };
  }
  
  return null;
}

interface Purchase {
  id: string;
  userId: string;
  fundingId: string;
  quantity: number;
  price: number;
  contractSigned: boolean;
  contractData?: any;
  accumulatedIncome: number;
  lastIncomeUpdate: Date;
  approved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  timestamp: Date;
  userName: string;
  userEmail: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedTab, setSelectedTab] = useState<'withdrawals' | 'purchases'>('withdrawals');
  const [withdrawalSubTab, setWithdrawalSubTab] = useState<'pending' | 'processed'>('pending');
  const [purchaseSubTab, setPurchaseSubTab] = useState<'pending' | 'approved'>('pending');
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
        loadPurchases();
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
  };

  const loadPurchases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/purchases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      
      const purchasesData: Purchase[] = await response.json();
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error loading purchases:', error);
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

  const handleApprovePurchase = async (purchaseId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/purchases', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          purchaseId,
          action: 'approve'
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage('구매가 승인되었습니다');
        loadPurchases();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(result.message || '구매 승인에 실패했습니다');
      }
    } catch (error) {
      setMessage('구매 승인에 실패했습니다');
    }
  };

  const getFundingInfo = (fundingId: string) => {
    return fundingOptions.find(f => f.id === fundingId) || null;
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    withdrawalSubTab === 'pending' ? w.status === 'pending' : w.status !== 'pending'
  );

  const filteredPurchases = purchases.filter(p => {
    // Only show purchases with signed contracts
    if (!p.contractSigned) return false;
    
    return purchaseSubTab === 'pending' ? !p.approved : p.approved;
  });

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
          <p className="text-xl text-gray-300">관리자 대시보드</p>
        </div>

        {message && (
          <div className="mb-4 bg-green-500/20 border border-green-500 text-green-300 px-4 py-2 rounded-md text-center">
            {message}
          </div>
        )}

        {/* Main Tabs */}
        <div className="mb-8 flex justify-center space-x-4">
          <button
            onClick={() => setSelectedTab('withdrawals')}
            className={`px-6 py-3 rounded-md font-medium transition-all ${
              selectedTab === 'withdrawals'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/10 backdrop-blur-sm text-gray-300 hover:bg-white/20'
            }`}
          >
            출금 승인
          </button>
          <button
            onClick={() => setSelectedTab('purchases')}
            className={`px-6 py-3 rounded-md font-medium transition-all ${
              selectedTab === 'purchases'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/10 backdrop-blur-sm text-gray-300 hover:bg-white/20'
            }`}
          >
            구매 승인
          </button>
        </div>

        {/* Withdrawals Tab Content */}
        {selectedTab === 'withdrawals' && (
          <>
            <div className="mb-6 flex justify-center space-x-4">
              <button
                onClick={() => setWithdrawalSubTab('pending')}
                className={`px-6 py-2 rounded-md font-medium ${
                  withdrawalSubTab === 'pending'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                대기중 ({withdrawals.filter(w => w.status === 'pending').length})
              </button>
              <button
                onClick={() => setWithdrawalSubTab('processed')}
                className={`px-6 py-2 rounded-md font-medium ${
                  withdrawalSubTab === 'processed'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                처리됨 ({withdrawals.filter(w => w.status !== 'pending').length})
              </button>
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
                <p className="text-gray-300 text-lg">
                  {withdrawalSubTab === 'pending' ? '대기중인' : '처리된'} 출금 요청이 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">사용자</p>
                        <p className="text-white font-medium">{withdrawal.userName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">상품</p>
                        <p className="text-white font-medium">{withdrawal.fundingTitle}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">금액</p>
                        <p className="text-xl font-bold text-green-400">
                          {withdrawal.amount.toLocaleString()} {withdrawal.fundingUnit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">요청 날짜</p>
                        <p className="text-white">
                          {new Date(withdrawal.requestDate).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Bank Information */}
                    {(() => {
                      const bankInfo = extractBankInfo(withdrawal.adminNotes);
                      if (bankInfo) {
                        return (
                          <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <p className="text-sm font-medium text-gray-400 mb-2">입금 계좌 정보</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <p className="text-xs text-gray-500">은행명</p>
                                <p className="text-white font-medium">{bankInfo.bankName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">계좌번호</p>
                                <p className="text-white font-medium font-mono">{bankInfo.accountNumber}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">예금주</p>
                                <p className="text-white font-medium">{bankInfo.accountHolder}</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {withdrawal.status === 'pending' ? (
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleApproveWithdrawal(withdrawal.id)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('거절 사유:');
                            if (reason) handleRejectWithdrawal(withdrawal.id, reason);
                          }}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                          거절
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
                              {withdrawal.status === 'approved' ? '승인됨' : '거절됨'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {withdrawal.processedDate && 
                              `처리일: ${new Date(withdrawal.processedDate).toLocaleString()}`
                            }
                          </div>
                        </div>
                        {withdrawal.adminNotes && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-400 mb-1">상세 정보</p>
                            {(() => {
                              const bankInfo = extractBankInfo(withdrawal.adminNotes);
                              if (bankInfo) {
                                // Extract withdrawal details from adminNotes
                                const detailsMatch = withdrawal.adminNotes.match(/출금 요청([^-]*)?\s*-\s*출금량: ([^,]+), 수수료: ([^,]+), 실수령액: ([^-]+)/);
                                const isFirstWithdrawal = withdrawal.adminNotes.includes('첫 출금 - 수수료 무료');
                                
                                return (
                                  <div className="space-y-2">
                                    <div className="p-3 bg-gray-800 rounded-lg text-sm">
                                      {detailsMatch && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                          <div>
                                            <p className="text-xs text-gray-500">출금량</p>
                                            <p className="text-white font-medium">{detailsMatch[2]}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">수수료</p>
                                            <p className="text-white font-medium">
                                              {isFirstWithdrawal ? '무료 (첫 출금)' : detailsMatch[3]}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">실수령액</p>
                                            <p className="text-green-400 font-medium">{detailsMatch[4]}</p>
                                          </div>
                                        </div>
                                      )}
                                      <div className="border-t border-gray-700 pt-2">
                                        <p className="text-xs text-gray-500 mb-1">입금 계좌</p>
                                        <p className="text-white">
                                          {bankInfo.bankName} {bankInfo.accountNumber} ({bankInfo.accountHolder})
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Fallback to original display if parsing fails
                              return (
                                <p className="text-sm text-gray-400">
                                  {withdrawal.adminNotes}
                                </p>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Purchases Tab Content */}
        {selectedTab === 'purchases' && (
          <>
            <div className="mb-6 flex justify-center space-x-4">
              <button
                onClick={() => setPurchaseSubTab('pending')}
                className={`px-6 py-2 rounded-md font-medium ${
                  purchaseSubTab === 'pending'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                대기중 ({purchases.filter(p => p.contractSigned && !p.approved).length})
              </button>
              <button
                onClick={() => setPurchaseSubTab('approved')}
                className={`px-6 py-2 rounded-md font-medium ${
                  purchaseSubTab === 'approved'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                승인됨 ({purchases.filter(p => p.contractSigned && p.approved).length})
              </button>
            </div>

            {filteredPurchases.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
                <p className="text-gray-300 text-lg">
                  {purchaseSubTab === 'pending' ? '대기중인' : '승인된'} 구매 요청이 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPurchases.map((purchase) => {
                  const fundingInfo = getFundingInfo(purchase.fundingId);
                  return (
                    <div key={purchase.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">사용자</p>
                          <p className="text-white font-medium">{purchase.userName}</p>
                          <p className="text-gray-300 text-sm">{purchase.userEmail}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">펀딩 상품</p>
                          <p className="text-white font-medium">
                            {fundingInfo?.title || '알 수 없음'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">구매 금액</p>
                          <p className="text-xl font-bold text-green-400">
                            {purchase.price.toLocaleString()} 원
                          </p>
                          {(purchase.fundingId === 'funding-1' || purchase.fundingId === 'funding-3') && (
                            <p className="text-sm text-gray-300 mt-1">
                              {(() => {
                                if (purchase.fundingId === 'funding-1') {
                                  const dogeAmount = purchase.price / 1000;
                                  return `≈ ${dogeAmount.toLocaleString()} Doge`;
                                } else if (purchase.fundingId === 'funding-3') {
                                  const vastAmount = purchase.price / 1000;
                                  return `≈ ${vastAmount.toLocaleString()} VAST`;
                                }
                              })()}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">구매 날짜</p>
                          <p className="text-white">
                            {new Date(purchase.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">수량</p>
                          <p className="text-white font-medium">{purchase.quantity}개</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">계약 상태</p>
                          <p className="text-white">
                            {purchase.contractSigned ? (
                              <span className="text-green-400">서명 완료</span>
                            ) : (
                              <span className="text-yellow-400">대기중</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {!purchase.approved ? (
                        <button
                          onClick={() => handleApprovePurchase(purchase.id)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-md hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                        >
                          구매 승인
                        </button>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                승인됨
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              {purchase.approvedAt && (
                                <>
                                  승인일: {new Date(purchase.approvedAt).toLocaleString()}
                                  {purchase.approvedBy && (
                                    <span className="block">승인자: {purchase.approvedBy}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">관리자 기능</h2>
          <div className="space-y-4">
            <button
              onClick={async () => {
                const token = localStorage.getItem('token');
                setMessage('수익 계산을 시작합니다...');
                
                try {
                  const response = await fetch('/api/admin/calculate-income', { 
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    const stats = data.statistics;
                    setMessage(`✅ 수익 계산 완료!
                    • 처리된 구매: ${stats.processed}개
                    • 업데이트됨: ${stats.updated}개  
                    • 건너뜀: ${stats.skipped}개
                    ${stats.errorCount > 0 ? `• 오류: ${stats.errorCount}개` : ''}`);
                  } else {
                    setMessage(`❌ 수익 계산 중 오류 발생: ${data.message}`);
                  }
                } catch (error) {
                  setMessage('❌ 수익 계산 중 네트워크 오류가 발생했습니다');
                }
                
                setTimeout(() => setMessage(''), 5000);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all font-medium mr-4"
            >
              💰 일일 수익 계산 (수동)
            </button>
            
            <div className="text-sm text-gray-400 mt-2">
              • 이 버튼은 모든 활성 구매 건의 수익을 즉시 계산합니다<br/>
              • 정상적으로는 매일 자정에 자동 실행됩니다<br/>
              • Doge: 1 mining unit = 1 Doge/day<br/>
              • Data Center: 월 5% 수익률 (일일 0.167%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}