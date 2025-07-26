'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contractSchema = z.object({
  fullName: z.string().min(2, '성명은 최소 2자 이상이어야 합니다'),
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  phone: z.string().min(10, '전화번호는 최소 10자 이상이어야 합니다'),
  address: z.string().min(10, '주소는 최소 10자 이상이어야 합니다'),
  birthDate: z.string().regex(/^[0-9]{8}$/, '생년월일은 8자리 숫자로 입력하세요 (예: 19900101)'),
  contractDate: z.string().min(1, '계약일을 입력하세요'),
  agreeToTerms: z.boolean().refine((val) => val === true, '약관에 동의해야 합니다'),
});

type ContractForm = z.infer<typeof contractSchema>;

export default function ContractPage() {
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ContractForm>({
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
    
    // Set current date in Korean time for contract date
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const year = koreanTime.getFullYear();
    const month = String(koreanTime.getMonth() + 1).padStart(2, '0');
    const day = String(koreanTime.getDate()).padStart(2, '0');
    const contractDateStr = `${year}년 ${month}월 ${day}일`;
    setValue('contractDate', contractDateStr);
  }, [router, setValue]);

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
      alert('서명을 입력해주세요');
      return;
    }

    const userData = {
      name: data.fullName,
      birthDate: data.birthDate,
      email: data.email,
      phone: data.phone,
      address: data.address,
      contractDate: data.contractDate,
      signature: signature,
    };

    const submitData = {
      fundingType: purchaseData.fundingTitle,
      userData: userData,
    };

    try {
      const response = await fetch('/api/contract/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setContractData(result);
        setAccountInfo(result.accountInfo);
        setShowSuccess(true);
        localStorage.removeItem('purchaseData');
        // 자동 리다이렉트 제거 - 사용자가 직접 버튼으로 이동
      } else {
        alert(result.message || '계약 제출에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
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

  const copyAccountNumber = async () => {
    if (accountInfo && accountInfo.accountNumber) {
      try {
        await navigator.clipboard.writeText(accountInfo.accountNumber);
        alert('계좌번호가 복사되었습니다.');
      } catch (error) {
        // 클립보드 API가 지원되지 않는 경우 대체 방법
        const textArea = document.createElement('textarea');
        textArea.value = accountInfo.accountNumber;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          alert('계좌번호가 복사되었습니다.');
        } catch (fallbackError) {
          alert('복사에 실패했습니다. 수동으로 복사해주세요.');
        }
        document.body.removeChild(textArea);
      }
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-green-400 text-6xl mb-6">✓</div>
            <h2 className="text-3xl font-bold text-white mb-4">투자조합 계약이 완료되었습니다!</h2>
            <p className="text-gray-300 mb-6">계약서가 이메일로 발송되었습니다.</p>
          </div>
          
          {contractData && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">계약 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-200">
                <div>
                  <p><span className="font-medium">계약 번호:</span> {contractData.contractId}</p>
                  <p><span className="font-medium">투자 상품:</span> {purchaseData.fundingTitle}</p>
                </div>
                <div>
                  <p><span className="font-medium">투자 금액:</span> {formatPrice(purchaseData.price)}</p>
                  <p><span className="font-medium">계약 완료:</span> {new Date().toLocaleString('ko-KR')}</p>
                </div>
              </div>
            </div>
          )}

          {/* 계좌 정보 */}
          <div className="bg-gradient-to-r from-blue-800/50 to-purple-800/50 rounded-lg p-6 border border-blue-400/20 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">투자금 입금 계좌 정보</h3>
            
            {accountInfo && accountInfo.status === 'closed' ? (
              <div className="text-center py-8">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <p className="text-lg text-red-300 font-semibold">마감되었습니다</p>
                <p className="text-sm text-gray-300 mt-2">해당 펀딩은 더 이상 투자를 받지 않습니다.</p>
              </div>
            ) : accountInfo && accountInfo.status === 'active' ? (
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-300 text-sm">은행명</p>
                      <p className="text-white font-semibold text-lg">{accountInfo.bank}</p>
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">예금주</p>
                      <p className="text-white font-semibold text-lg">{accountInfo.accountHolder}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-300 text-sm">계좌번호</p>
                    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 mt-2">
                      <span className="text-white font-mono text-xl font-bold">{accountInfo.accountNumber}</span>
                      <button
                        onClick={copyAccountNumber}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        복사
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm font-medium">
                    ⚠️ 위 계좌로 투자금을 입금해주세요. 입금 후 투자가 확정됩니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-300">계좌 정보를 불러오는 중...</p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md text-lg font-medium transition-colors duration-200"
            >
              대시보드로 이동
            </button>
            
            {accountInfo && accountInfo.status === 'active' && (
              <button
                onClick={copyAccountNumber}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md text-lg font-medium transition-colors duration-200"
              >
                계좌번호 다시 복사
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <header className="bg-black bg-opacity-50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-indigo-400 hover:text-indigo-300 mr-4"
              >
                ← 대시보드로 돌아가기
              </button>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <img 
                  src="/logo.png" 
                  alt="NIA CLOUD Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="text-sm font-bold text-gray-800">NV</div>';
                  }}
                />
              </div>
              <h1 className="text-3xl font-bold text-white">NIA CLOUD</h1>
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
                투자조합 계약서
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-300">
                투자 정보를 확인하고 아래 계약서 정보를 완료해주세요.
              </p>
            </div>

            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                {/* Purchase Summary */}
                <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/40 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6 mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">투자 요약</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-300">
                        <strong>투자 상품:</strong> {purchaseData.fundingTitle}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>수량:</strong> {purchaseData.quantity} 단위
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">
                        <strong>총 투자금액:</strong> {formatPrice(purchaseData.price)}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>투자일:</strong> {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contract Terms */}
                <div className="bg-white rounded-lg p-6 mb-8 text-sm text-gray-800 max-h-96 overflow-y-auto">
                  {/* VAST Coin 특별 계약서 */}
                  {purchaseData.fundingTitle === 'VAST' ? (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-6 text-center">확약서</h4>
                      <div className="space-y-4">
                        <p className="mb-4">
                          본인은 아래 명시된 바와 같이 "VAST TOKEN" 거래 및 상장에 관한 사항을 확약합니다.
                        </p>
                        
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">1. 당사자 정보</h5>
                          <p className="mb-2">확약인(갑): 임 희 윤 (010-2843-7200)</p>
                          <p className="mb-2">주 소: 서울특별시 강남구 테헤란로 143, 고운빌딩 8층</p>
                          <p className="mb-2">소 속: (주)히스코에셋 대표이사</p>
                          <p className="mb-2">사업자등록번호: 341-86-02558</p>
                          <p className="mb-2">수익자(을): ( _________________ )</p>
                        </div>

                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">2. 거래 내용</h5>
                          <p className="mb-2">
                            1. "갑"은 "을"로부터 일금 <strong>____________만원 (_______________)</strong>을 받고, 해당 금액에 상응하는 VAST TOKEN <strong>____________개</strong>를 제공 하였음을 확인합니다.
                          </p>
                          <p className="mb-2">
                            2. "갑"은 2025년 9월 30일 까지 VAST TOKEN을 세계 10대 암호화폐 거래소 중 하나에 상장시키는 것을 보장합니다.
                          </p>
                          <p className="mb-2">
                            3. 만약 해당 기한까지 상장이 이루어지지 않을 경우, "갑"은 "을"에게 1달러($1) 기준으로 2025년 9월30일 까지 보상할 것을 확약 합니다.
                          </p>
                          <p className="mb-2">
                            단, 세계10대 거래소가 상장을 9월30일 이전 공지할 경우 2주 간은 유예할수 있다.
                          </p>
                          <p className="mb-2 text-sm text-gray-600">
                            [ 예) 9월30일 상장예정 공지시 10월15일 까지 유예 기간임. ]
                          </p>
                        </div>

                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">3. 기타 사항</h5>
                          <p className="mb-2">
                            1. 본 확약서는 법적 효력을 가지며, 이에 따라 "갑"은 계약의무를 성실히 이행할 것을 보증합니다.
                          </p>
                          <p className="mb-2">
                            2. 본 확약과 관련하여 분쟁이 발생할 경우, 당사자는 협의를 통해 해결하며, 협의가 이루어지지 않을 경우 대한민국 법률에 따릅니다.
                          </p>
                          <p className="mb-2">
                            3. 본 확약서는 양 당사자가 서명한 날부터 효력을 발생합니다.
                          </p>
                        </div>

                        <div className="mt-8 border-t pt-6">
                          <p className="text-center font-semibold text-gray-900 mb-6">2025년 ___월 ___일</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h6 className="font-semibold text-gray-900 mb-3">갑 (확약인)</h6>
                              <p className="mb-2">성 명: 임 희윤</p>
                              <p className="mb-2">소 속: (주)히스코에셋 대표이사</p>
                              <p className="mb-2">사업자등록번호: 341-86-02558</p>
                              <div className="mt-4 border-b border-gray-400 w-48"></div>
                              <p className="text-xs text-gray-500 mt-1">서명: 임 희윤 (인)</p>
                            </div>
                            
                            <div>
                              <h6 className="font-semibold text-gray-900 mb-3">을 (수익자)</h6>
                              <p className="mb-2">성 명: _______________</p>
                              <p className="mb-2">주민등록번호: _______________</p>
                              <div className="mt-8 border-b border-gray-400 w-48"></div>
                              <p className="text-xs text-gray-500 mt-1">서명: _______________ (인)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">49인 이하 투자조합 계약서</h4>
                  <div className="space-y-4">
                    <p>
                      본 계약은 투자자(이하 "조합원")와 윤정훈(이하 "업무집행자")이 상호 신뢰와 협력을 바탕으로 「벤처투자 촉진에 관한 법률」 제19조 및 관련 법령에 의거하여 49인 이하의 사적 투자조합(이하 "조합")을 설립하고, 공동 출자에 따른 투자활동 및 권리·의무의 사항을 규정함을 목적으로 다음과 같이 체결한다.
                    </p>
                    
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제1조 (조합의 명칭 및 목적)</h5>
                      <p className="mb-2">① 본 조합은 "NIA Cloud 49인 투자조합"(이하 "조합")이라 칭한다.</p>
                      <p>② 조합은 조합원이 공동으로 출자한 자금을 바탕으로 벤처기업, 실물자산 등 성장 잠재력이 있는 사업에 투자하여 그 성과에 따른 이익을 조합원에게 배분함을 목적으로 한다.</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제2조 (조합원의 자격 및 출자)</h5>
                      <p className="mb-2">① 조합원은 49인을 초과하지 아니한다.</p>
                      <p className="mb-2">② 조합원은 본 계약에 명시된 출자금액을 업무집행자가 지정하는 계좌에 납입하며, 출자금액과 지분율은 별도의 서면 합의서에 따른다.</p>
                      <p>③ 출자금의 납입은 완전하고 무조건적이며, 출자금 미납 시 조합원 자격을 상실할 수 있다.</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제3조 (업무집행자 및 대표)</h5>
                      <p className="mb-2">① 업무집행자는 윤정훈으로 한다.</p>
                      <p className="mb-2">② 업무집행자는 조합의 업무를 선량한 관리자 의무의 범위 내에서 성실히 수행하며, 조합의 자산 운용, 투자, 회계관리 및 조합원에 대한 보고 업무를 담당한다.</p>
                      <p>③ 업무집행자는 고의 또는 중대한 과실이 없는 한 조합의 투자 결과로 인한 손실에 대해 법적 책임을 지지 아니한다.</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제4조 (이익 및 손실의 배분)</h5>
                      <p className="mb-2">① 조합의 모든 이익과 손실은 조합원의 출자비율에 따라 배분 및 분담한다.</p>
                      <p>② 조합원은 조합의 결산 결과에 따라 정기적으로 수익을 배분받으며, 손실에 대해서도 출자비율에 따라 부담한다.</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제5조 (지분의 양도 및 제한)</h5>
                      <p className="mb-2">① 조합원의 지분 양도는 업무집행자의 사전 서면 동의를 받아야 한다.</p>
                      <p>② 업무집행자는 조합의 안정적 운영과 조합원의 권익 보호를 위해 부당한 지분 양도를 제한할 수 있다.</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제6조 (조합의 존속기간 및 해산)</h5>
                      <p className="mb-2">① 조합의 존속기간은 본 계약 체결일로부터 2년으로 한다.</p>
                      <p className="mb-2">② 존속기간 만료, 조합원 전원의 동의, 업무집행자의 제안에 따른 조합원 총회의 의결 또는 법률에서 정하는 사유 발생 시 조합은 해산한다.</p>
                      <p>③ 해산 시 조합의 청산 절차는 「상법」 및 관련 법령에 따른다. 잔여 재산은 조합원 출자 비율에 따라 분배한다.</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제7조 (기밀유지 및 비밀보호)</h5>
                      <p className="mb-2">① 조합원 및 업무집행자는 조합 운영과 관련한 모든 정보를 비밀로 유지해야 하며, 조합의 동의 없이 제3자에게 공개할 수 없다.</p>
                      <p>② 본 조항은 계약 종료 후에도 유효하다.</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제8조 (분쟁의 해결)</h5>
                      <p className="mb-2">① 본 계약에 관한 분쟁은 조합 사무소 소재지를 관할하는 법원을 제1심 관할 법원으로 한다.</p>
                      <p>② 본 계약과 관련된 사항은 대한민국 법률에 따른다.</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">제9조 (기타 조항)</h5>
                      <p className="mb-2">① 본 계약에 명시되지 않은 사항은 「민법」, 「상법」 및 관련 법령에 따른다.</p>
                      <p className="mb-2">② 본 계약은 양 당사자의 자유로운 의사에 따라 체결되었으며, 계약 당사자는 계약서 내용을 충분히 이해하고 동의함을 확인한다.</p>
                      <p>③ 본 계약서 2부를 작성하여 조합원과 업무집행자가 각각 1부씩 보관한다.</p>
                    </div>

                    <div className="mt-8 border-t pt-6">
                      <p className="text-center font-semibold text-gray-900 mb-6">계약 체결일: 2025년 ○월 ○일</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center">
                          <p className="mb-2 text-sm text-gray-600">생년월일: 1981.08.22</p>
                          <p className="font-semibold text-gray-900">업무집행자(대표): 윤정훈</p>
                          <div className="mt-4 border-b border-gray-400 w-48 mx-auto"></div>
                          <p className="text-xs text-gray-500 mt-1">(서명 또는 날인)</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="mb-2 text-sm text-gray-600">생년월일: ○년 ○월 ○일</p>
                          <p className="font-semibold text-gray-900">조합원: (성명)</p>
                          <div className="mt-4 border-b border-gray-400 w-48 mx-auto"></div>
                          <p className="text-xs text-gray-500 mt-1">(서명 또는 날인)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                    </>
                  )}
                </div>

                {/* Contract Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-white mb-2">
                        성명
                      </label>
                      <input
                        {...register('fullName')}
                        type="text"
                        className="block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent sm:text-sm placeholder-gray-400"
                        placeholder="성명을 입력하세요"
                      />
                      {errors.fullName && (
                        <p className="mt-2 text-sm text-red-400">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="birthDate" className="block text-sm font-medium text-white mb-2">
                        생년월일
                      </label>
                      <input
                        {...register('birthDate')}
                        type="text"
                        pattern="[0-9]{8}"
                        maxLength={8}
                        className="block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent sm:text-sm placeholder-gray-400"
                        placeholder="예: 19900101 (숫자만 8자리)"
                      />
                      {errors.birthDate && (
                        <p className="mt-2 text-sm text-red-400">{errors.birthDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                        이메일 주소
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className="block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent sm:text-sm placeholder-gray-400"
                        placeholder="이메일을 입력하세요"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                        전화번호
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent sm:text-sm placeholder-gray-400"
                        placeholder="전화번호를 입력하세요"
                      />
                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-400">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-white mb-2">
                        주소
                      </label>
                      <input
                        {...register('address')}
                        type="text"
                        className="block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent sm:text-sm placeholder-gray-400"
                        placeholder="주소를 입력하세요"
                      />
                      {errors.address && (
                        <p className="mt-2 text-sm text-red-400">{errors.address.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Contract Date Section */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-white mb-4">계약 체결일</h4>
                    <div>
                      <label htmlFor="contractDate" className="block text-sm font-medium text-white mb-2">
                        계약일
                      </label>
                      <input
                        {...register('contractDate')}
                        type="text"
                        readOnly
                        className="block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent sm:text-sm"
                        placeholder="자동으로 설정됩니다"
                      />
                      {errors.contractDate && (
                        <p className="mt-2 text-sm text-red-400">{errors.contractDate.message}</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-300">
                      * 계약 체결일은 한국 시간 기준으로 자동 설정됩니다.
                    </p>
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
                        <label htmlFor="agreeToTerms" className="font-medium text-white">
                          투자조합 계약 약관에 동의합니다
                        </label>
                        <p className="text-gray-300">
                          이 체크박스를 선택함으로써 위의 49인 이하 투자조합 계약서의 모든 조항을 읽고 이해했으며, 이에 동의함을 확인합니다.
                        </p>
                      </div>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="mt-2 text-sm text-red-400">{errors.agreeToTerms.message}</p>
                    )}
                  </div>

                  {/* Electronic Signature */}
                  <div className="mt-8">
                    <label className="block text-sm font-medium text-white mb-3">
                      전자서명
                    </label>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                      <p className="text-sm text-gray-300 mb-4">
                        아래 서명 패드에 손가락이나 마우스로 서명해주세요:
                      </p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300">서명 패드</span>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          지우기
                        </button>
                      </div>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={150}
                        className="border border-white/20 rounded-lg w-full cursor-crosshair bg-white"
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
                        <p className="text-sm text-red-400 mt-2">서명이 필요합니다</p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-8">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md text-lg font-medium transition-colors duration-200"
                    >
                      투자조합 계약 체결
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