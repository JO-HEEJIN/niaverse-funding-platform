'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fundingOptions } from '@/lib/fundingData';

interface Purchase {
  id: string;
  userId: string;
  fundingId: string;
  quantity: number;
  price: number;
  timestamp: Date;
  contractSigned: boolean;
  accumulatedIncome: number;
  lastIncomeUpdate: Date;
  fundingTitle: string;
  fundingUnit: string;
  approved: boolean;
}

interface FundingIncome {
  fundingId: string;
  fundingTitle: string;
  totalIncome: number;
  unit: string;
  purchases: Purchase[];
}

export default function DeparturePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [fundingIncomes, setFundingIncomes] = useState<FundingIncome[]>([]);
  const [selectedFunding, setSelectedFunding] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [withdrawalLimits, setWithdrawalLimits] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    
    if (!token || !storedUserId) {
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    loadUserIncomes(storedUserId);
    loadWithdrawalLimits();
  }, [router]);

  const loadUserIncomes = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/purchases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      
      const purchases: Purchase[] = await response.json();
      
      const incomeByFunding = purchases.reduce((acc, purchase) => {
        if (!purchase.contractSigned || !purchase.approved) return acc;
        
        const funding = fundingOptions.find(f => `funding-${f.id}` === purchase.fundingId);
        if (!funding) return acc;

        if (!acc[purchase.fundingId]) {
          acc[purchase.fundingId] = {
            fundingId: purchase.fundingId,
            fundingTitle: funding.title,
            totalIncome: 0,
            unit: funding.unit,
            purchases: []
          };
        }

        acc[purchase.fundingId].totalIncome += purchase.accumulatedIncome || 0;
        acc[purchase.fundingId].purchases.push(purchase);
        
        return acc;
      }, {} as Record<string, FundingIncome>);

      setFundingIncomes(Object.values(incomeByFunding));
    } catch (error) {
      console.error('Error loading incomes:', error);
    }
    setIsLoading(false);
  };

  const loadWithdrawalLimits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawal limits');
      }
      
      const data = await response.json();
      setWithdrawalLimits(data.limits);
    } catch (error) {
      console.error('Error loading withdrawal limits:', error);
    }
  };

  const calculateFee = (amount: number) => {
    if (!withdrawalLimits) return 0;
    return withdrawalLimits.isFirstWithdrawalFree ? 0 : Math.floor(amount * withdrawalLimits.feeRate);
  };

  const getFinalAmount = (amount: number) => {
    const fee = calculateFee(amount);
    return amount - fee;
  };

  const handleWithdrawal = async () => {
    if (!selectedFunding || !withdrawAmount) {
      setMessage('펀딩을 선택하고 출금 금액을 입력해주세요.');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const funding = fundingIncomes.find(f => f.fundingId === selectedFunding);
    
    if (!funding) {
      setMessage('잘못된 펀딩 선택입니다.');
      return;
    }

    if (amount <= 0) {
      setMessage('올바른 금액을 입력해주세요.');
      return;
    }

    // 클라이언트 측 검증
    if (withdrawalLimits) {
      if (amount < withdrawalLimits.minAmount) {
        setMessage(`최소 출금 금액은 ${withdrawalLimits.minAmount.toLocaleString()}원입니다.`);
        return;
      }
      
      if (withdrawalLimits.remainingToday <= 0) {
        setMessage(`일일 출금 횟수를 초과했습니다. (최대 ${withdrawalLimits.maxDailyWithdrawals}회)`);
        return;
      }
    }

    if (amount > funding.totalIncome) {
      setMessage('출금 요청 금액이 보유 수익을 초과합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          fundingId: selectedFunding
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage('출금 요청이 성공적으로 제출되었습니다. 관리자가 검토 후 처리됩니다.');
        setWithdrawAmount('');
        setSelectedFunding('');
        
        // 출금 제한 정보 다시 로드
        loadWithdrawalLimits();
        
        setTimeout(() => {
          router.push('/history');
        }, 2000);
      } else {
        setMessage(result.message || '출금 요청 제출에 실패했습니다.');
      }
    } catch (error) {
      setMessage('출금 요청 제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    router.push('/main');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-black bg-opacity-50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/main" className="flex items-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mr-3">
                <img 
                  src="/logo.png" 
                  alt="NIA CLOUD Logo" 
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="text-lg font-bold text-gray-800">NC</div>';
                  }}
                />
              </div>
              <h1 className="text-3xl font-bold text-white">NIA CLOUD</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-all duration-200 rounded-md"
              >
                대시보드
              </Link>
              <Link
                href="/purchase"
                className="px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-all duration-200 rounded-md"
              >
                구매
              </Link>
              <Link
                href="/history"
                className="px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-all duration-200 rounded-md"
              >
                거래내역
              </Link>
              <div className="w-px h-6 bg-white/30 mx-2"></div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-white hover:bg-white/10 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-3 space-y-1">
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-white hover:bg-white/10 transition-all duration-200 text-center text-sm rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                대시보드
              </Link>
              <Link
                href="/purchase"
                className="block px-3 py-2 text-white hover:bg-white/10 transition-all duration-200 text-center text-sm rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                구매
              </Link>
              <Link
                href="/history"
                className="block px-3 py-2 text-white hover:bg-white/10 transition-all duration-200 text-center text-sm rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                거래내역
              </Link>
              <div className="border-t border-white/20 mt-2 pt-2">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-all duration-200 text-center text-sm"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">출금</h1>
          <p className="text-xl text-gray-300">누적된 수익을 출금하세요</p>
        </div>

        {fundingIncomes.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-300 text-lg">아직 출금 가능한 수익이 없습니다.</p>
            <button
              onClick={() => router.push('/purchase')}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              구매 페이지로 이동
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 출금 제한 정보 */}
            {withdrawalLimits && (
              <div className="bg-gradient-to-r from-blue-800/50 to-purple-800/50 rounded-lg p-6 border border-blue-400/20">
                <h2 className="text-xl font-bold text-white mb-4">💰 출금 안내</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">최소 출금 금액:</span>
                      <span className="text-white font-semibold">{withdrawalLimits.minAmount.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">일일 출금 제한:</span>
                      <span className="text-white font-semibold">{withdrawalLimits.maxDailyWithdrawals}회</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">출금 수수료:</span>
                      <span className="text-white font-semibold">{(withdrawalLimits.feeRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">오늘 출금 가능:</span>
                      <span className={`font-semibold ${withdrawalLimits.remainingToday > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {withdrawalLimits.remainingToday}회
                      </span>
                    </div>
                  </div>
                </div>
                {withdrawalLimits.isFirstWithdrawalFree && (
                  <div className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                    <p className="text-green-300 text-sm font-medium">🎉 첫 출금은 수수료가 무료입니다!</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">수익 현황</h2>
              <div className="space-y-4">
                {fundingIncomes.map((income) => (
                  <div key={income.fundingId} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{income.fundingTitle}</h3>
                        <p className="text-gray-400">
                          {income.purchases.length}개 구매
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">
                          {income.totalIncome.toLocaleString()} {income.unit}
                        </p>
                        <p className="text-sm text-gray-400">출금 가능</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">출금 요청</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    펀딩 선택
                  </label>
                  
                  {/* Desktop: Dropdown */}
                  <div className="hidden md:block">
                    <select
                      value={selectedFunding}
                      onChange={(e) => setSelectedFunding(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">펀딩을 선택하세요...</option>
                      {fundingIncomes.map((income) => (
                        <option key={income.fundingId} value={income.fundingId}>
                          {income.fundingTitle} - {income.totalIncome.toLocaleString()} {income.unit} 출금 가능
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mobile: Radio Buttons */}
                  <div className="md:hidden space-y-2">
                    {fundingIncomes.length === 0 ? (
                      <div className="text-gray-400 text-sm">출금 가능한 펀딩이 없습니다.</div>
                    ) : (
                      fundingIncomes.map((income) => (
                        <label
                          key={income.fundingId}
                          className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedFunding === income.fundingId
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                          }`}
                          style={{ minHeight: '44px' }} // 터치 타겟 최소 크기 보장
                        >
                          <input
                            type="radio"
                            name="funding"
                            value={income.fundingId}
                            checked={selectedFunding === income.fundingId}
                            onChange={(e) => setSelectedFunding(e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className={`font-medium ${
                              selectedFunding === income.fundingId ? 'text-indigo-400' : 'text-white'
                            }`}>
                              {income.fundingTitle}
                            </div>
                            <div className="text-sm text-gray-400">
                              {income.totalIncome.toLocaleString()} {income.unit} 출금 가능
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedFunding === income.fundingId
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-gray-400'
                          }`}>
                            {selectedFunding === income.fundingId && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {selectedFunding && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      출금 금액
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="출금할 금액을 입력하세요"
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        style={{ fontSize: '16px' }} // iOS 줌 방지
                      />
                      <span className="text-white text-sm font-medium px-2">
                        {fundingIncomes.find(f => f.fundingId === selectedFunding)?.unit}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-gray-400">
                        최대 출금 가능: {fundingIncomes.find(f => f.fundingId === selectedFunding)?.totalIncome.toLocaleString()} {fundingIncomes.find(f => f.fundingId === selectedFunding)?.unit}
                      </div>
                      {withdrawAmount && parseFloat(withdrawAmount) > 0 && withdrawalLimits && (
                        <div className="text-sm bg-gray-700 p-3 rounded-md border">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">출금 금액:</span>
                            <span className="text-white font-semibold">{parseFloat(withdrawAmount).toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">수수료:</span>
                            <span className={`font-semibold ${withdrawalLimits.isFirstWithdrawalFree ? 'text-green-400' : 'text-yellow-400'}`}>
                              {withdrawalLimits.isFirstWithdrawalFree ? '무료 (첫 출금)' : `${calculateFee(parseFloat(withdrawAmount)).toLocaleString()}원`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-600 pt-2 mt-2">
                            <span className="text-gray-300">실제 받을 금액:</span>
                            <span className="text-green-400 font-bold text-lg">{getFinalAmount(parseFloat(withdrawAmount)).toLocaleString()}원</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 빠른 금액 선택 버튼 (모바일 최적화) */}
                    <div className="mt-3 md:hidden">
                      <div className="text-xs text-gray-400 mb-2">빠른 선택:</div>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const selectedIncome = fundingIncomes.find(f => f.fundingId === selectedFunding);
                          if (!selectedIncome) return null;
                          
                          const maxAmount = selectedIncome.totalIncome;
                          const quickAmounts = [
                            Math.floor(maxAmount * 0.25),
                            Math.floor(maxAmount * 0.5),
                            Math.floor(maxAmount * 0.75),
                            maxAmount
                          ].filter(amount => amount > 0);
                          
                          return quickAmounts.map((amount, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setWithdrawAmount(amount.toString())}
                              className="px-3 py-2 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-500 transition-colors duration-200"
                              style={{ minHeight: '36px' }}
                            >
                              {index === quickAmounts.length - 1 ? '전체' : `${((index + 1) * 25)}%`}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleWithdrawal}
                  disabled={!selectedFunding || !withdrawAmount}
                  className="w-full bg-indigo-600 text-white px-4 py-4 rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  style={{ minHeight: '48px' }} // 터치 타겟 최소 크기 보장
                >
                  출금 요청 제출
                </button>

                {message && (
                  <div className={`text-sm ${message.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}