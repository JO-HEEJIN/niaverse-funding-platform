export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">회사 정보</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="font-medium">주식회사:</span> NIA CLOUD</p>
              <p><span className="font-medium">대표:</span> JUNG HOON YOUN</p>
              <p><span className="font-medium">라이센스 넘버:</span> 60995</p>
              <p><span className="font-medium">이메일:</span> ceo@niadata.com</p>
              <p><span className="font-medium">본사:</span> (342001), NIA Cloud, A2, Building, IFZA Business Park, Dubai, United Arab Emirates</p>
              <p><span className="font-medium">한국지사:</span> 서울시 강남구 테헤란로 143, 고운빌딩 7층</p>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">고객센터</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p className="text-xl font-bold text-white">02-555-7700</p>
              <p>평일 10:00 ~ 18:00</p>
              <p>(점심시간 : 11:30~13:00)</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>&copy; 2024 NIA CLOUD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}