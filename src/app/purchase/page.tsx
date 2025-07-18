'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fundingOptions } from '@/lib/fundingData';

export default function PurchasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handlePurchase = (fundingId: string) => {
    router.push(`/funding/${fundingId}`);
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
            <div className="flex items-center">
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

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Purchase Funding Products</h1>
          <p className="text-xl text-gray-300">Choose from our exclusive investment opportunities</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {fundingOptions.map((option, index) => {
            const bgImages = ['/img1.png', '/img2.png', '/img3.png'];
            const bgImage = bgImages[index] || '/img1.png';
            
            return (
              <div key={option.id} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full">
                <div className="relative h-48 bg-gray-700">
                  <img
                    src={bgImage}
                    alt={option.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.className = 'flex items-center justify-center h-full';
                      const titleDiv = document.createElement('div');
                      titleDiv.className = 'text-4xl font-bold text-gray-600';
                      titleDiv.textContent = option.title;
                      fallbackDiv.appendChild(titleDiv);
                      if (target.parentElement) {
                        target.parentElement.appendChild(fallbackDiv);
                      }
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      option.details.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : option.details.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {option.details.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold text-white mb-2">{option.title}</h3>
                  <p className="text-gray-300 mb-4 line-clamp-3">{option.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white">{option.details.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Base Price:</span>
                      <span className="text-white">₩{option.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unit:</span>
                      <span className="text-white">{option.unit}</span>
                    </div>
                    {option.dailyIncome && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Daily Income:</span>
                        <span className="text-green-400">{option.dailyIncome} {option.unit}/day</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-400">
                        {Math.round((option.details.totalRaised / option.details.goal) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${Math.min((option.details.totalRaised / option.details.goal) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-400">
                        ₩{option.details.totalRaised.toLocaleString()}
                      </span>
                      <span className="text-gray-400">
                        ₩{option.details.goal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => handlePurchase(option.id)}
                      className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out font-semibold"
                      disabled={option.details.status !== 'active'}
                    >
                      {option.details.status === 'active' ? 'Purchase Now' : 'Not Available'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}