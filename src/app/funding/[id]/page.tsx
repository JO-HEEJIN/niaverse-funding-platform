'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { fundingOptions } from '@/lib/fundingData';
import type { FundingOption } from '@/lib/fundingData';

interface FundingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FundingPage({ params }: FundingPageProps) {
  const [funding, setFunding] = useState<FundingOption | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fundingOption = fundingOptions.find(option => option.id === id);
    if (fundingOption) {
      setFunding(fundingOption);
    }
  }, [id, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getPriceForQuantity = (quantity: number) => {
    if (!funding) return 0;
    
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

  const handleProceedToPurchase = () => {
    const finalPrice = customPrice ? parseInt(customPrice.replace(/[^0-9]/g, '')) : getPriceForQuantity(selectedQuantity);
    
    // Store purchase data for contract
    const purchaseData = {
      fundingId: funding?.id,
      fundingTitle: funding?.title,
      quantity: selectedQuantity,
      price: finalPrice,
    };
    
    localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
    router.push('/contract');
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
                  alt="NIAVERSE Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="text-sm font-bold text-gray-800">NV</div>';
                  }}
                />
              </div>
              <h1 className="text-3xl font-bold text-white">NIAVERSE</h1>
            </div>
          </div>
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
                        src={funding.image}
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
                      
                      <p className="text-gray-300 mb-4">
                        This innovative project represents a breakthrough in {funding.details.category.toLowerCase()} 
                        technology. With cutting-edge features and a commitment to excellence, this funding opportunity 
                        allows you to be part of something truly revolutionary.
                      </p>
                      
                      <p className="text-gray-300">
                        Join thousands of other backers who believe in the future of technology and innovation. 
                        Your support will help bring this vision to life and create lasting impact in the industry.
                      </p>
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

                    {/* Pricing Structure */}
                    <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/40 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-medium text-white mb-4">Pricing Structure</h4>
                      <div className="space-y-3">
                        {funding.priceStructure.map((price, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-600/30 last:border-b-0">
                            <span className="text-gray-300">{price.quantity} unit{price.quantity > 1 ? 's' : ''}</span>
                            <span className="font-medium text-white">{formatPrice(price.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Purchase Section */}
                    <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/40 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-white mb-4">Purchase Options</h4>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-black mb-2">
                          Quantity
                        </label>
                        <select
                          value={selectedQuantity}
                          onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {funding.priceStructure.map((price) => (
                            <option key={price.quantity} value={price.quantity}>
                              {price.quantity} unit{price.quantity > 1 ? 's' : ''} - {formatPrice(price.price)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-black mb-2">
                          Custom Price (Optional)
                        </label>
                        <input
                          type="text"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          placeholder="Enter custom amount"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Leave empty to use standard pricing
                        </p>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between items-center text-lg font-medium">
                          <span className="text-white">Total:</span>
                          <span className="text-indigo-400">
                            {formatPrice(customPrice ? parseInt(customPrice.replace(/[^0-9]/g, '')) || 0 : getPriceForQuantity(selectedQuantity))}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handlePurchase}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md text-lg font-medium transition-colors duration-200"
                      >
                        Purchase Now
                      </button>
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
                  <strong>Quantity:</strong> {selectedQuantity} unit{selectedQuantity > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total:</strong> {formatPrice(customPrice ? parseInt(customPrice.replace(/[^0-9]/g, '')) || 0 : getPriceForQuantity(selectedQuantity))}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleProceedToPurchase}
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