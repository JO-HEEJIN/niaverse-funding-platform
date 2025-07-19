'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fundingOptions } from '@/lib/fundingData';
import DogecoinProduct from '@/components/products/DogecoinProduct';
import DataCenterProduct from '@/components/products/DataCenterProduct';
import VASTcoinProduct from '@/components/products/VASTcoinProduct';

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
}

interface UserPurchases {
  [fundingId: string]: {
    purchases: Purchase[];
    totalIncome: number;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [userPurchases, setUserPurchases] = useState<UserPurchases>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      router.push('/login');
      return;
    }

    // Get user info from /api/auth/me
    fetchUserInfo(token);
    
    // Load user purchases
    loadUserPurchases(userId);
  }, [router]);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If token is invalid, redirect to login
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      router.push('/login');
    }
  };

  const loadUserPurchases = async (userId: string) => {
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
      const purchasesByFunding: UserPurchases = {};
      
      purchases.forEach(purchase => {
        if (!purchase.contractSigned) return;
        
        if (!purchasesByFunding[purchase.fundingId]) {
          purchasesByFunding[purchase.fundingId] = {
            purchases: [],
            totalIncome: 0
          };
        }
        
        purchasesByFunding[purchase.fundingId].purchases.push(purchase);
        purchasesByFunding[purchase.fundingId].totalIncome += purchase.accumulatedIncome || 0;
      });
      
      setUserPurchases(purchasesByFunding);
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    router.push('/main');
  };

  const goToMyInfo = () => {
    router.push('/myinfo');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  if (!user) {
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
            <Link href="/main" className="flex items-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mr-3">
                <img 
                  src="/logo.png" 
                  alt="NIA CLOUD Logo" 
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="text-lg font-bold text-gray-800">NV</div>';
                  }}
                />
              </div>
              <h1 className="text-3xl font-bold text-white">NIA CLOUD</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
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
              <span 
                className="text-gray-300 text-sm cursor-pointer hover:text-white transition-all duration-200 user-greeting"
                onClick={goToMyInfo}
              >
                환영합니다, {user.name}
              </span>
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
              <div 
                className="px-3 py-2 text-center text-gray-300 text-sm border-t border-white/20 mt-2 pt-2 cursor-pointer hover:bg-white/10 transition-all duration-200 rounded-md user-greeting"
                onClick={() => {
                  goToMyInfo();
                  setIsMenuOpen(false);
                }}
              >
                환영합니다, {user.name}
              </div>
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
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-container max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Purchased Products Section */}
          {Object.keys(userPurchases).length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Your Investments</h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 investment-cards-grid">
                {userPurchases['funding-1'] && (
                  <DogecoinProduct 
                    purchases={userPurchases['funding-1'].purchases}
                    totalIncome={userPurchases['funding-1'].totalIncome}
                  />
                )}
                {userPurchases['funding-2'] && (
                  <DataCenterProduct 
                    purchases={userPurchases['funding-2'].purchases}
                    totalIncome={userPurchases['funding-2'].totalIncome}
                  />
                )}
                {userPurchases['funding-3'] && (
                  <VASTcoinProduct 
                    purchases={userPurchases['funding-3'].purchases}
                    totalIncome={userPurchases['funding-3'].totalIncome}
                  />
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Available Funding Opportunities</h2>
            <p className="mt-2 text-gray-300">
              Discover and invest in innovative projects that are changing the world.
            </p>
          </div>

          {/* Funding Options Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {fundingOptions.map((option, index) => {
              const bgImages = ['/img1.png', '/img2.png', '/img3.png'];
              const bgImage = bgImages[index] || '/img1.png';
              
              return (
                <div
                  key={option.id}
                  className="relative overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col"
                  style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '500px',
                    height: '500px'
                  }}
                >
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 h-full flex flex-col">
                    {/* Large Title */}
                    <div className="text-center mb-6">
                      <h3 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-2 drop-shadow-lg">
                        {option.title}
                      </h3>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                        option.details.status === 'active' 
                          ? 'bg-green-500/80 text-white'
                          : option.details.status === 'completed'
                          ? 'bg-blue-500/80 text-white'
                          : 'bg-yellow-500/80 text-white'
                      }`}>
                        {option.details.status}
                      </span>
                    </div>
                    
                    {/* Push content to bottom */}
                    <div className="flex-1"></div>
                    
                    {/* Bottom content */}
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 space-y-3">
                      <p className="text-gray-200 text-sm line-clamp-2">
                        {option.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-200">
                          <span>Progress</span>
                          <span className="font-bold">{getProgressPercentage(option.details.totalRaised, option.details.goal).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(option.details.totalRaised, option.details.goal)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-300">
                          <span>{formatPrice(option.details.totalRaised)} raised</span>
                          <span>{formatPrice(option.details.goal)} goal</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Starting from</span>
                        <span className="text-lg font-bold text-white">
                          {formatPrice(option.basePrice)}
                        </span>
                      </div>
                      
                      <Link
                        href={`/funding/${option.id}`}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-center py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 block shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}