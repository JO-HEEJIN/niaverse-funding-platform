'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MainPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    router.push('/main');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Mobile Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/main" className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <img 
                  src="/logo.png" 
                  alt="NIA CLOUD Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="text-sm font-bold text-gray-800">NC</div>';
                  }}
                />
              </div>
              <h1 className="text-xl font-bold text-white">NIA CLOUD</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              {isLoggedIn ? (
                <>
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
                    className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-all duration-200"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-all duration-200 rounded-md"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                  >
                    회원가입
                  </Link>
                </>
              )}
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
              {isLoggedIn ? (
                <>
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
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-white hover:bg-white/10 transition-all duration-200 text-center text-sm rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-center text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Video Hero Section */}
      <div className="relative h-screen">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pt-20">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-4 tracking-tight" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
              NIA CLOUD
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-4">
              1억 투자하면 1년간 월 500만원씩 받을 수 있어요
            </p>
            <p className="text-lg text-gray-300 mb-12 max-w-2xl">
              상품가입을 위해 로그인을 해주세요
            </p>
          </div>
          
          <div className="space-y-4 w-full max-w-md">
            <Link
              href="/register"
              className="w-full flex justify-center py-4 px-8 border border-transparent rounded-lg shadow-lg text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
            >
              시작하기 - 계정 만들기
            </Link>
            
            <Link
              href="/login"
              className="w-full flex justify-center py-4 px-8 border border-white border-opacity-30 rounded-lg shadow-lg text-lg font-medium text-white glass-effect hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
            >
              기존 계정으로 로그인
            </Link>
          </div>
          
          <div className="mt-12 text-center text-gray-300">
            <p className="text-lg">NIA Cloud와 함께 안전하고 수익성 높은 투자를 시작하세요</p>
            <p className="mt-2">도지코인 채굴, 데이터센터, VAST 토큰 등 다양한 투자 상품을 제공합니다</p>
          </div>
        </div>
      </div>
      
      {/* Additional Content Section */}
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
              NIA CLOUD와 함께 시작하세요
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              전 세계 투자자들이 선택한 신뢰할 수 있는 펀딩 플랫폼에서 
              여러분의 투자 여정을 시작하세요.
            </p>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 glass-effect rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">188,884</div>
              <div className="text-lg text-gray-300 mb-2">누적 가입자 수</div>
              <div className="text-sm text-green-400 font-medium">6월부터 ▲ 9,202명</div>
            </div>
            <div className="text-center p-8 glass-effect rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">3,483.63억원</div>
              <div className="text-lg text-gray-300 mb-2">누적 투자금액</div>
              <div className="text-sm text-green-400 font-medium">6월부터 ▲ 261.75억원</div>
            </div>
            <div className="text-center p-8 glass-effect rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-2">99.7%</div>
              <div className="text-lg text-gray-300 mb-2">고객 만족도</div>
              <div className="text-sm text-green-400 font-medium">신뢰도 최고 등급</div>
            </div>
          </div>
          
          {/* Investment Products Preview */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8 text-center">
              주요 투자 상품
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-effect rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">D</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">도지 채굴기</h4>
                  <p className="text-gray-300 text-sm mb-4">도지코인 채굴 사업으로 안정적인 수익</p>
                  <div className="text-green-400 font-bold">목표 달성률: 100%</div>
                </div>
              </div>
              
              <div className="glass-effect rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">D</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">데이터 센터</h4>
                  <p className="text-gray-300 text-sm mb-4">AI 자동매매 시스템 투자</p>
                  <div className="text-blue-400 font-bold">목표 달성률: 34%</div>
                </div>
              </div>
              
              <div className="glass-effect rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">V</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">VAST</h4>
                  <p className="text-gray-300 text-sm mb-4">디지털 참여 혁신 플랫폼</p>
                  <div className="text-purple-400 font-bold">목표 달성률: 67%</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              지금 시작하기
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}