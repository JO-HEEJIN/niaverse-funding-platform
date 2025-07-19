'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
}

export default function MyInfoPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    phone: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserInfo(token);
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
        setFormData({
          password: '',
          phone: userData.phone || '',
          address: userData.address || ''
        });
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      router.push('/login');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const updateData: any = {
        phone: formData.phone,
        address: formData.address
      };

      // Only include password if it's not empty
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('회원정보가 수정되었습니다.');
        setFormData(prev => ({ ...prev, password: '' }));
      } else {
        const errorData = await response.json();
        alert(errorData.message || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    router.push('/main');
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
            <Link href="/dashboard" className="flex items-center">
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
              <span className="text-gray-300 text-sm">환영합니다, {user.name}</span>
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
              <div className="px-3 py-2 text-center text-gray-300 text-sm border-t border-white/20 mt-2 pt-2">
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
      <main className="myinfo-page max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gradient-to-br from-gray-600/20 to-gray-800/30 backdrop-blur-sm border border-gray-400/20 shadow-lg overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">내정보</h2>
              
              <form onSubmit={handleSubmit} className="myinfo-form max-w-md mx-auto space-y-6">
                {/* 아이디 (읽기 전용) */}
                <div className="form-group">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    아이디
                  </label>
                  <input
                    type="text"
                    value={user.email}
                    readOnly
                    className="readonly-input w-full px-4 py-3 rounded-lg border border-gray-500/30 bg-gray-800/30 text-gray-400 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* 패스워드 (수정 가능) */}
                <div className="form-group">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    패스워드
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="새 비밀번호 입력 (변경시에만)"
                    className="editable-input w-full px-4 py-3 rounded-lg border border-gray-500/30 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* 이름 (읽기 전용) */}
                <div className="form-group">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    readOnly
                    className="readonly-input w-full px-4 py-3 rounded-lg border border-gray-500/30 bg-gray-800/30 text-gray-400 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* 연락처 (수정 가능) */}
                <div className="form-group">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    연락처
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="010-1234-5678"
                    className="editable-input w-full px-4 py-3 rounded-lg border border-gray-500/30 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* 주소 (수정 가능) */}
                <div className="form-group">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="서울시 강남구 테헤란로 123"
                    className="editable-input w-full px-4 py-3 rounded-lg border border-gray-500/30 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* 수정 버튼 */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="update-btn w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? '수정 중...' : '수정'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}