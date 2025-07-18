'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface InvestmentData {
  range: string;
  percentage: number;
  color: string;
}

interface TopInvestor {
  rank: number;
  name: string;
  amount: number;
  returns: number;
}

interface ReinvestmentData {
  category: string;
  percentage: number;
  color: string;
}

const investmentDistribution: InvestmentData[] = [
  { range: '1억원 이상', percentage: 7.1, color: '#8B5CF6' },
  { range: '5000만원~1억', percentage: 12.6, color: '#A78BFA' },
  { range: '2000만원~5000만원', percentage: 41.8, color: '#C4B5FD' },
  { range: '1000만원~2000만원', percentage: 28.1, color: '#DDD6FE' },
  { range: '500만원~1000만원', percentage: 5.1, color: '#EDE9FE' },
  { range: '500만원 미만', percentage: 5.3, color: '#F3F4F6' },
];

const topInvestors: TopInvestor[] = [
  { rank: 1, name: 'K***', amount: 5000000000, returns: 950000000 },
  { rank: 2, name: 'L***', amount: 3800000000, returns: 722000000 },
  { rank: 3, name: 'P***', amount: 2900000000, returns: 551000000 },
  { rank: 4, name: 'J***', amount: 2500000000, returns: 475000000 },
  { rank: 5, name: 'C***', amount: 2100000000, returns: 399000000 },
  { rank: 6, name: 'M***', amount: 1800000000, returns: 342000000 },
  { rank: 7, name: 'S***', amount: 1600000000, returns: 304000000 },
  { rank: 8, name: 'H***', amount: 1400000000, returns: 266000000 },
  { rank: 9, name: 'N***', amount: 1200000000, returns: 228000000 },
  { rank: 10, name: 'B***', amount: 1000000000, returns: 190000000 },
];

const reinvestmentData: ReinvestmentData[] = [
  { category: '상품 3회 이상 가입', percentage: 8.4, color: '#10B981' },
  { category: '상품 2회 이상 가입', percentage: 68.9, color: '#3B82F6' },
  { category: '상품 1회 이상 가입', percentage: 22.7, color: '#8B5CF6' },
];

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'distribution' | 'ranking' | 'reinvestment'>('distribution');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    router.push('/main');
  };

  const formatAmount = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억원`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만원`;
    }
    return `${amount.toLocaleString()}원`;
  };

  const DonutChart = ({ data }: { data: InvestmentData[] }) => {
    const total = data.reduce((sum, item) => sum + item.percentage, 0);
    let cumulativePercentage = 0;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-64 h-64 mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
            />
            {data.map((item, index) => {
              const strokeDasharray = `${(item.percentage / total) * 251.2} 251.2`;
              const strokeDashoffset = -cumulativePercentage * 2.512;
              cumulativePercentage += item.percentage;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">투자 분포</div>
              <div className="text-sm text-gray-300">총 188,884명</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{item.range}</div>
                <div className="text-xs text-gray-400">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ReinvestmentChart = ({ data }: { data: ReinvestmentData[] }) => {
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-64 h-64 mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
            />
            {data.map((item, index) => {
              const strokeDasharray = `${(item.percentage / 100) * 251.2} 251.2`;
              const strokeDashoffset = -data.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0) * 2.512;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">재투자율</div>
              <div className="text-sm text-gray-300">고객 충성도</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 w-full max-w-lg">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-sm text-white font-medium">{item.category}</div>
              </div>
              <div className="text-sm text-gray-300 font-semibold">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
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
                href="/departure"
                className="px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-all duration-200 rounded-md"
              >
                출금
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
                href="/departure"
                className="block px-3 py-2 text-white hover:bg-white/10 transition-all duration-200 text-center text-sm rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                출금
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

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">투자 현황 분석</h2>
          <p className="text-xl text-gray-300">NIA Cloud 플랫폼의 투자 통계와 현황을 확인하세요</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setActiveTab('distribution')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'distribution'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              투자금 분포
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'ranking'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              투자 순위
            </button>
            <button
              onClick={() => setActiveTab('reinvestment')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'reinvestment'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              재투자 현황
            </button>
          </div>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8">
          {activeTab === 'distribution' && (
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-8">투자금 비율 분포</h3>
              <DonutChart data={investmentDistribution} />
            </div>
          )}

          {activeTab === 'ranking' && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-8 text-center">투자순위 TOP 10</h3>
              <div className="max-w-4xl mx-auto">
                <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-300">
                    <div>순위</div>
                    <div>투자자</div>
                    <div>투자금액</div>
                    <div>예상 수익</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {topInvestors.map((investor) => (
                    <div
                      key={investor.rank}
                      className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            investor.rank === 1 ? 'bg-yellow-500 text-black' :
                            investor.rank === 2 ? 'bg-gray-400 text-black' :
                            investor.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {investor.rank}
                          </div>
                        </div>
                        <div className="text-white font-medium">{investor.name}</div>
                        <div className="text-green-400 font-bold">{formatAmount(investor.amount)}</div>
                        <div className="text-blue-400 font-bold">{formatAmount(investor.returns)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reinvestment' && (
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-8">재투자 비율</h3>
              <ReinvestmentChart data={reinvestmentData} />
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-white mb-2">77.3%</div>
            <div className="text-purple-100">재투자율</div>
            <div className="text-sm text-purple-200 mt-1">2회 이상 투자 고객 비율</div>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-white mb-2">19%</div>
            <div className="text-green-100">평균 수익률</div>
            <div className="text-sm text-green-200 mt-1">연간 평균 수익률</div>
          </div>
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-white mb-2">6.2개월</div>
            <div className="text-pink-100">평균 투자 기간</div>
            <div className="text-sm text-pink-200 mt-1">고객 평균 투자 유지 기간</div>
          </div>
        </div>
      </main>
    </div>
  );
}