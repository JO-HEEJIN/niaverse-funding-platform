'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('유효하지 않은 접근입니다.');
      setIsCheckingToken(false);
      return;
    }

    // Verify token
    fetch('/api/auth/verify-reset-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsValidToken(true);
        } else {
          setMessage(data.message || '토큰이 만료되었거나 유효하지 않습니다.');
        }
      })
      .catch(() => {
        setMessage('토큰 검증 중 오류가 발생했습니다.');
      })
      .finally(() => {
        setIsCheckingToken(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!password || !confirmPassword) {
      setMessage('모든 필드를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('비밀번호는 최소 6자리 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage('비밀번호가 성공적으로 변경되었습니다.');
      } else {
        setMessage(result.message || '오류가 발생했습니다.');
      }
    } catch (error) {
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">토큰 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/main" className="flex justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="NIA CLOUD Logo" 
                  className="w-14 h-14 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="text-2xl font-bold text-gray-800">NC</div>';
                  }}
                />
              </div>
            </Link>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              비밀번호 재설정
            </h2>
          </div>

          <div className="bg-red-600/20 border border-red-500 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500 rounded-full mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-400 mb-2">접근 오류</h3>
            <p className="text-red-300 text-sm mb-4">
              {message}
            </p>
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                새로운 재설정 링크 요청
              </Link>
              <Link
                href="/login"
                className="block text-indigo-400 hover:text-indigo-300 text-sm"
              >
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/main" className="flex justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="NIA CLOUD Logo" 
                className="w-14 h-14 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="text-2xl font-bold text-gray-800">NC</div>';
                }}
              />
            </div>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            새 비밀번호 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            새로운 비밀번호를 입력하세요.
          </p>
        </div>

        {!isSuccess ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  새 비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-800"
                  placeholder="새 비밀번호 (최소 6자리)"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-800"
                  placeholder="비밀번호 다시 입력"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    변경 중...
                  </div>
                ) : (
                  '비밀번호 변경'
                )}
              </button>
            </div>

            {message && (
              <div className="text-center text-sm text-red-400">
                {message}
              </div>
            )}
          </form>
        ) : (
          <div className="mt-8 text-center space-y-6">
            <div className="bg-green-600/20 border border-green-500 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-500 rounded-full mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-green-400 mb-2">비밀번호 변경 완료!</h3>
              <p className="text-green-300 text-sm">
                비밀번호가 성공적으로 변경되었습니다.
                <br />
                새로운 비밀번호로 로그인하세요.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                로그인 페이지로 이동
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-300">페이지 로딩 중...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}