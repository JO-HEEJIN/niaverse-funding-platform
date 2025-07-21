'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!email) {
      setMessage('이메일을 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        setMessage('서버 응답을 처리할 수 없습니다.');
        return;
      }

      if (response.ok) {
        setIsSuccess(true);
        setMessage('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
      } else {
        console.error('Forgot password API error:', response.status, result);
        setMessage(result.message || `서버 오류가 발생했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('Network error in forgot password:', error);
      setMessage('네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

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
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {!isSuccess ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-800"
                placeholder="your-email@example.com"
                disabled={isLoading}
              />
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
                    전송 중...
                  </div>
                ) : (
                  '비밀번호 재설정 링크 전송'
                )}
              </button>
            </div>

            {message && (
              <div className={`text-center text-sm ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </div>
            )}

            <div className="text-center">
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center space-y-6">
            <div className="bg-green-600/20 border border-green-500 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-500 rounded-full mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-green-400 mb-2">이메일이 전송되었습니다!</h3>
              <p className="text-green-300 text-sm">
                {email}로 비밀번호 재설정 링크를 전송했습니다.
                <br />
                이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-gray-400 text-sm">
                이메일이 도착하지 않았나요?
              </p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setMessage('');
                  setEmail('');
                }}
                className="text-indigo-400 hover:text-indigo-300 text-sm underline"
              >
                다시 시도하기
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}