'use client';

import { useState } from 'react';

export default function DirectUpdatePage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const updateUserData = async () => {
    setLoading(true);
    setResult('');

    try {
      // 직접 데이터베이스 업데이트를 위한 API 호출
      const response = await fetch('/api/admin/direct-sql-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_ysu_funding',
          email: 'ysu1110@naver.com',
          fundingAmount: 30000000,
          accumulatedIncome: 144000
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`성공: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`에러: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`오류 발생: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6">직접 데이터베이스 업데이트</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold mb-2">노영수님 데이터 업데이트</h3>
        <p>Email: ysu1110@naver.com</p>
        <p>Funding: funding-2 (데이터센터)</p>
        <p>Amount: 30,000,000원</p>
        <p>Income: 144,000원</p>
      </div>

      <button
        onClick={updateUserData}
        disabled={loading}
        className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mb-4"
      >
        {loading ? '업데이트 중...' : '노영수님 펀딩 데이터 업데이트'}
      </button>

      {result && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">결과:</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}