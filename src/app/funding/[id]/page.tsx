'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fundingOptions } from '@/lib/fundingData';
import type { FundingOption } from '@/lib/fundingData';
import { formatPrice, parseCustomPrice } from '@/lib/formatters';
import { useFundingPurchase } from '@/hooks/useFundingPurchase';

interface FundingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FundingPage({ params }: FundingPageProps) {
  const [funding, setFunding] = useState<FundingOption | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customPrice, setCustomPrice] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { id } = use(params);
  const { proceedToPurchase } = useFundingPurchase();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Debug logging
    console.log('URL ID parameter:', id);
    console.log('Available funding options:', fundingOptions.map(o => ({ id: o.id, title: o.title })));

    // Handle both formats: '1', '2', '3' and 'funding-1', 'funding-2', 'funding-3'
    const fundingOption = fundingOptions.find(option => 
      option.id === id || option.id === `funding-${id}`
    );
    
    console.log('Found funding option:', fundingOption);
    
    if (fundingOption) {
      setFunding(fundingOption);
    }
  }, [id, router]);


  const handleProceed = () => {
    proceedToPurchase({
      customPrice,
      selectedQuantity,
      funding,
      getPriceForQuantity,
    });
  };

  // formatPrice is now imported from formatters

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getPriceForQuantity = (quantity: number | null) => {
    if (!funding || !quantity) return 0;
    
    const pricePoint = funding.priceStructure.find(p => p.quantity === quantity);
    if (pricePoint) {
      return pricePoint.price;
    }
    
    // Calculate price based on base price if not in structure
    return funding.basePrice * quantity;
  };

  const handlePurchase = () => {
    setShowPurchaseModal(true);
  };

  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    router.push('/main');
  };

  if (!funding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black bg-opacity-50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-indigo-400 hover:text-indigo-300 mr-4"
              >
                ← Back to Dashboard
              </button>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <img 
                  src="/logo.png" 
                  alt="NIA CLOUD Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="text-sm font-bold text-gray-800">NV</div>';
                  }}
                />
              </div>
              <h1 className="text-3xl font-bold text-white">NIA CLOUD</h1>
            </div>
            
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
                href="/history"
                className="block px-3 py-2 text-white hover:bg-white/10 transition-all duration-200 text-center text-sm rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                거래내역
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gradient-to-br from-gray-600/20 to-gray-800/30 backdrop-blur-sm border border-gray-400/20 shadow-lg overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-white">
                    {funding.title}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-300">
                    {funding.details.category} • Ends {new Date(funding.details.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  funding.details.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : funding.details.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {funding.details.status}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Image and Description */}
                  <div>
                    <div className="h-64 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
                      <img
                        src={`/img${funding.id.split('-')[1]}.png`}
                        alt={funding.title}
                        className="h-full w-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%236b7280'%3E${funding.title}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                    </div>
                    
                    <div className="prose max-w-none">
                      <h4 className="text-lg font-medium text-white mb-3">About This Project</h4>
                      <p className="text-gray-300 mb-4">{funding.description}</p>
                      
                      {funding.aboutProject ? (
                        <div className="space-y-4">
                          {funding.aboutProject.map((paragraph, index) => {
                            // Check if this is a header (doesn't start with bullet point)
                            const isHeader = !paragraph.startsWith('•');
                            
                            return (
                              <div key={index}>
                                {isHeader ? (
                                  <h5 className="text-lg font-semibold text-cyan-400 mt-6 mb-3 first:mt-0">
                                    {paragraph}
                                  </h5>
                                ) : (
                                  <p className="text-gray-300 leading-relaxed">
                                    {paragraph}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-300">
                            This innovative project represents a breakthrough in {funding.details.category.toLowerCase()} 
                            technology. With cutting-edge features and a commitment to excellence, this funding opportunity 
                            allows you to be part of something truly revolutionary.
                          </p>
                          
                          <p className="text-gray-300">
                            Join thousands of other backers who believe in the future of technology and innovation. 
                            Your support will help bring this vision to life and create lasting impact in the industry.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Funding Details and Purchase */}
                  <div>
                    {/* Progress Section */}
                    <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/40 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6 mb-6">
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-300 mb-2">
                          <span>Funding Progress</span>
                          <span>{getProgressPercentage(funding.details.totalRaised, funding.details.goal).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-600/50 rounded-full h-3">
                          <div 
                            className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(funding.details.totalRaised, funding.details.goal)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400 mt-2">
                          <span>{formatPrice(funding.details.totalRaised)} raised</span>
                          <span>{formatPrice(funding.details.goal)} goal</span>
                        </div>
                      </div>
                    </div>


                    {/* Purchase Section */}
                    <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/40 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-white mb-4">구매 옵션</h4>
                      
                      {/* Debug info */}
                      {console.log('Rendering purchase section. Funding ID:', funding.id)}
                      
                      {/* Funding 1 - Closed */}
                      {funding.id === 'funding-1' && (
                        <div className="text-center py-8">
                          <div className="bg-gray-600/30 border border-gray-500/40 rounded-lg p-6">
                            <h5 className="text-xl font-semibold text-red-400 mb-2">마감되었습니다</h5>
                            <p className="text-gray-300 text-sm">
                              이 펀딩은 목표 금액을 달성하여 마감되었습니다.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Funding 2 - Custom Price Only */}
                      {funding.id === 'funding-2' && (
                        <>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-white mb-2">
                              투자 금액 입력
                            </label>
                            <input
                              type="text"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                              placeholder="투자할 금액을 입력하세요 (예: 1000000)"
                              className="block w-full px-4 py-3 border border-white/20 rounded-lg shadow-lg text-white bg-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                            />
                            <p className="text-sm text-gray-400 mt-1">
                              최소 투자 금액: ₩1,000,000
                            </p>
                          </div>

                          <div className="mb-6">
                            <div className="flex justify-between items-center text-lg font-medium">
                              <span className="text-white">투자 금액:</span>
                              <span className="text-indigo-400">
                                {formatPrice(parseCustomPrice(customPrice))}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedQuantity(1); // Set to 1 for validation
                              handlePurchase();
                            }}
                            className="w-full py-3 px-4 rounded-md text-lg font-medium transition-all duration-200 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl"
                          >
                            투자하기
                          </button>
                        </>
                      )}

                      {/* Funding 3 - VAST Coin KRW Input */}
                      {funding.id === 'funding-3' && (
                        <>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-white mb-2">
                              투자 금액 입력 (원화)
                            </label>
                            <input
                              type="text"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                              placeholder="투자할 원화 금액을 입력하세요 (예: 1000000)"
                              className="block w-full px-4 py-3 border border-white/20 rounded-lg shadow-lg text-white bg-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                            />
                            <p className="text-sm text-gray-400 mt-1">
                              1,000원 = 1 VAST coin (최소 투자: ₩1,000)
                            </p>
                          </div>

                          <div className="mb-4">
                            <div className="bg-gray-600/30 border border-gray-500/40 rounded-lg p-4">
                              <div className="flex justify-between text-sm text-gray-300 mb-2">
                                <span>투자 금액:</span>
                                <span className="text-indigo-400">
                                  {formatPrice(parseCustomPrice(customPrice))}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm text-gray-300">
                                <span>받을 VAST 코인:</span>
                                <span className="text-purple-400">
                                  {Math.floor(parseCustomPrice(customPrice) / 1000).toLocaleString()} VAST
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const vastQuantity = Math.floor(parseCustomPrice(customPrice) / 1000);
                              setSelectedQuantity(vastQuantity);
                              handlePurchase();
                            }}
                            disabled={parseCustomPrice(customPrice) < 1000}
                            className="w-full py-3 px-4 rounded-md text-lg font-medium transition-all duration-200 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            VAST 코인 구매하기
                          </button>
                        </>
                      )}
                      
                      {/* Fallback if no matching funding ID */}
                      {funding.id !== 'funding-1' && funding.id !== 'funding-2' && funding.id !== 'funding-3' && (
                        <div className="text-center py-8">
                          <div className="bg-red-600/30 border border-red-500/40 rounded-lg p-6">
                            <h5 className="text-xl font-semibold text-red-400 mb-2">Debug: Unknown Funding ID</h5>
                            <p className="text-gray-300 text-sm">
                              Funding ID: {funding.id}
                            </p>
                            <p className="text-gray-300 text-sm mt-2">
                              Expected: funding-1, funding-2, or funding-3
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Purchase
              </h3>
              <div className="mb-4 text-left">
                <p className="text-sm text-gray-600">
                  <strong>Item:</strong> {funding.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Quantity:</strong> {selectedQuantity}개
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total:</strong> {formatPrice(customPrice ? parseCustomPrice(customPrice) : getPriceForQuantity(selectedQuantity || 1))}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleProceed}
                  className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                >
                  Proceed to Contract
                </button>
                <button
                  onClick={handleClosePurchaseModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}