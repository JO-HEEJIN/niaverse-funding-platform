'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-lg">
            {/* Logo placeholder - replace with actual logo */}
            <img 
              src="/logo.png" 
              alt="NIAVERSE Logo" 
              className="w-32 h-32 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="text-3xl font-bold text-gray-800">NV</div>';
              }}
            />
          </div>
        </div>
        <h1 className="text-center text-4xl font-extrabold text-white mb-2">
          NIAVERSE
        </h1>
        <p className="text-center text-lg text-gray-300 mb-8">
          The Future of Funding Platform
        </p>
        <p className="text-center text-sm text-gray-400 mb-8">
          Discover and invest in innovative projects that are changing the world.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <Link
              href="/register"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Get Started - Create Account
            </Link>
            
            <Link
              href="/login"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In to Existing Account
            </Link>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Join the funding revolution</p>
            <p className="mt-2">Support innovative projects and be part of the future</p>
          </div>
        </div>
      </div>
    </div>
  );
}
