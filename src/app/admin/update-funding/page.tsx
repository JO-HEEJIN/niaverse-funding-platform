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
    <div className="container mx-auto max-w-md mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6">Update User Funding</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            User Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Funding ID
          </label>
          <select
            value={fundingId}
            onChange={(e) => setFundingId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="funding-1">funding-1 (Doge)</option>
            <option value="funding-2">funding-2 (Data Center)</option>
            <option value="funding-3">funding-3 (VAST)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Amount (원)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Accumulated Income (원)
          </label>
          <input
            type="number"
            value={accumulatedIncome}
            onChange={(e) => setAccumulatedIncome(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Funding'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">노영수 업데이트 정보:</h3>
        <p>Email: ysu1110@naver.com</p>
        <p>Funding: funding-2 (데이터센터)</p>
        <p>Amount: 30,000,000원</p>
        <p>Income: 144,000원</p>
      </div>
    </div>
  );
}