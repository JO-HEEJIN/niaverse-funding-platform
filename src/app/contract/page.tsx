'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contractSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms and conditions'),
});

type ContractForm = z.infer<typeof contractSchema>;

export default function ContractPage() {
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedPurchaseData = localStorage.getItem('purchaseData');
    if (!storedPurchaseData) {
      router.push('/dashboard');
      return;
    }

    setPurchaseData(JSON.parse(storedPurchaseData));
  }, [router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  // Signature pad functionality
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignature('');
  };

  const onSubmit = async (data: ContractForm) => {
    if (!signature) {
      alert('Please provide your signature');
      return;
    }

    const contractData = {
      purchaseData,
      personalInfo: data,
      signature,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(contractData),
      });

      if (response.ok) {
        setShowSuccess(true);
        localStorage.removeItem('purchaseData');
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        alert('Failed to submit contract. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  if (!purchaseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Signed Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your purchase has been processed and the contract has been signed. You will be redirected to the dashboard shortly.
          </p>
          <div className="animate-pulse text-indigo-600">Redirecting...</div>
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
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gradient-to-br from-gray-600/20 to-gray-800/30 backdrop-blur-sm border border-gray-400/20 shadow-lg overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-white">
                Purchase Contract
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-300">
                Please review your purchase details and complete the contract information below.
              </p>
            </div>

            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                {/* Purchase Summary */}
                <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/40 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6 mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Purchase Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-300">
                        <strong>Item:</strong> {purchaseData.fundingTitle}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Quantity:</strong> {purchaseData.quantity} unit{purchaseData.quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">
                        <strong>Total Amount:</strong> {formatPrice(purchaseData.price)}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Date:</strong> {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contract Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        {...register('fullName')}
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter your full name"
                      />
                      {errors.fullName && (
                        <p className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter your phone number"
                      />
                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        {...register('address')}
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter your address"
                      />
                      {errors.address && (
                        <p className="mt-2 text-sm text-red-600">{errors.address.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Electronic Signature */}
                  <div className="mt-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Electronic Signature
                    </label>
                    <div className="border border-gray-300 rounded-md p-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Please sign below using your finger or mouse:
                      </p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">Signature Pad</span>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Clear
                        </button>
                      </div>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={150}
                        className="border border-gray-200 rounded w-full cursor-crosshair"
                        style={{ touchAction: 'none' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      {!signature && (
                        <p className="text-sm text-red-600 mt-2">Signature is required</p>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mt-8">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          {...register('agreeToTerms')}
                          type="checkbox"
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                          I agree to the terms and conditions
                        </label>
                        <p className="text-gray-500">
                          By checking this box, I confirm that I have read and agree to the terms and conditions of this purchase contract.
                        </p>
                      </div>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="mt-2 text-sm text-red-600">{errors.agreeToTerms.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="mt-8">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md text-lg font-medium transition-colors duration-200"
                    >
                      Sign Contract & Complete Purchase
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}