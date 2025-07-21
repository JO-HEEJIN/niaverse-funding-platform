'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UpdateFundingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ysu1110@naver.com');
  const [fundingId, setFundingId] = useState('funding-2');
  const [amount, setAmount] = useState('30000000');
  const [accumulatedIncome, setAccumulatedIncome] = useState('144000');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  // 펀딩 타입에 따른 설정
  const getFundingInfo = (id: string) => {
    switch (id) {
      case 'funding-1':
        return { 
          name: 'Doge Coin Mining', 
          unit: 'Doge', 
          amountLabel: 'Quantity (Doge)', 
          incomeLabel: 'Accumulated Income (Doge)',
          isQuantity: true 
        };
      case 'funding-2':
        return { 
          name: 'Data Center', 
          unit: '원', 
          amountLabel: 'Amount (원)', 
          incomeLabel: 'Accumulated Income (원)',
          isQuantity: false 
        };
      case 'funding-3':
        return { 
          name: 'VAST Coin', 
          unit: 'VAST', 
          amountLabel: 'Quantity (VAST)', 
          incomeLabel: 'Accumulated Income (VAST)',
          isQuantity: true 
        };
      default:
        return { 
          name: 'Unknown', 
          unit: '', 
          amountLabel: 'Amount', 
          incomeLabel: 'Accumulated Income',
          isQuantity: false 
        };
    }
  };

  const fundingInfo = getFundingInfo(fundingId);

  const handleDeleteUser = async () => {
    if (!email) {
      setDeleteMessage('Please enter an email address');
      return;
    }

    const confirmed = window.confirm(`정말로 ${email} 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setDeleteLoading(true);
    setDeleteMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setDeleteMessage('Please login as admin first');
        return;
      }

      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteMessage(`Success! Deleted user: ${email}`);
        setEmail(''); // Clear email field after successful deletion
      } else {
        setDeleteMessage(`Error: ${data.message || data.error}`);
      }
    } catch (error) {
      setDeleteMessage('Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login as admin first');
        return;
      }

      const response = await fetch('/api/admin/update-user-funding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          fundingId,
          amount: parseInt(amount),
          accumulatedIncome: parseInt(accumulatedIncome),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success! Updated funding for ${data.user}`);
      } else {
        setMessage(`Error: ${data.message || data.error}`);
      }
    } catch (error) {
      setMessage('Failed to update funding data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md mt-10 p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Update User Funding</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Funding ID
          </label>
          <select
            value={fundingId}
            onChange={(e) => setFundingId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="funding-1">funding-1 (Doge Coin Mining)</option>
            <option value="funding-2">funding-2 (Data Center)</option>
            <option value="funding-3">funding-3 (VAST Coin)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Selected: {fundingInfo.name} ({fundingInfo.unit})
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fundingInfo.amountLabel}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={fundingInfo.isQuantity ? "Enter quantity" : "Enter amount in KRW"}
            step={fundingInfo.isQuantity ? "1" : "1000"}
            required
          />
          {fundingInfo.isQuantity && (
            <p className="text-sm text-blue-500 mt-1">
              💡 For {fundingInfo.unit}, enter the quantity (number of coins/tokens)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fundingInfo.incomeLabel}
          </label>
          <input
            type="number"
            value={accumulatedIncome}
            onChange={(e) => setAccumulatedIncome(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={fundingInfo.isQuantity ? "Enter income quantity" : "Enter income in KRW"}
            step={fundingInfo.isQuantity ? "0.01" : "1000"}
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Funding'}
          </button>
          
          <button
            type="button"
            onClick={handleDeleteUser}
            disabled={deleteLoading || !email}
            className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {deleteLoading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {deleteMessage && (
        <div className={`mt-4 p-3 rounded-md ${
          deleteMessage.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {deleteMessage}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">펀딩 타입별 입력 안내:</h3>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-blue-50 rounded">
            <strong>funding-1 (Doge Coin):</strong> 수량으로 입력 (예: 1000 Doge)
          </div>
          <div className="p-2 bg-green-50 rounded">
            <strong>funding-2 (Data Center):</strong> 원화로 입력 (예: 30,000,000원)
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <strong>funding-3 (VAST Coin):</strong> 수량으로 입력 (예: 5000 VAST)
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded">
          <h4 className="font-semibold text-sm">노영수님 현재 데이터:</h4>
          <p className="text-sm">Email: ysu1110@naver.com</p>
          <p className="text-sm">Funding: funding-2 (데이터센터)</p>
          <p className="text-sm">Amount: 30,000,000원 (30개)</p>
          <p className="text-sm">Income: 144,000원</p>
        </div>

        <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
          <h4 className="font-semibold text-sm text-red-800">⚠️ 계정 삭제 주의사항:</h4>
          <ul className="text-sm text-red-700 mt-2 space-y-1">
            <li>• 계정 삭제는 되돌릴 수 없습니다</li>
            <li>• 연관된 모든 구매 내역도 함께 삭제됩니다</li>
            <li>• 삭제 전 반드시 이메일을 확인하세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}