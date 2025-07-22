const XLSX = require('xlsx');
const path = require('path');

// 펀딩 ID 매핑
const fundingTypeMap = {
  '펀딩 1': 'funding-1',
  '펀딩1': 'funding-1',
  'Doge': 'funding-1',
  'DOGE': 'funding-1',
  '도지': 'funding-1',
  '펀딩 2': 'funding-2',
  '펀딩2': 'funding-2',
  'Data Center': 'funding-2',
  '데이터센터': 'funding-2',
  '펀딩 3': 'funding-3',
  '펀딩3': 'funding-3',
  'VAST': 'funding-3',
  '바스트': 'funding-3'
};

// 엑셀 파일 미리보기
async function previewExcelData() {
  try {
    const excelPath = path.join(__dirname, '..', '전체회원 정리 (니아버스).xlsx');
    console.log(`엑셀 파일 경로: ${excelPath}\n`);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 커스텀 헤더로 데이터 읽기
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: ['인원수', '날짜', '구매자', '이메일', '생년월일', '연락처', '펀딩타입'],
      range: 1 // 첫 번째 행부터 시작 (헤더 행 건너뛰기)
    });
    
    console.log(`시트명: ${sheetName}`);
    console.log(`총 행 수: ${data.length}\n`);
    
    // 첫 5개 행 샘플 출력
    console.log('=== 데이터 샘플 (첫 5행) ===');
    data.slice(0, 5).forEach((row, index) => {
      console.log(`\n행 ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
    
    // 컬럼 분석
    console.log('\n=== 컬럼 분석 ===');
    const columns = Object.keys(data[0] || {});
    console.log('발견된 컬럼:', columns);
    
    // 펀딩 타입 분석
    console.log('\n=== 펀딩 타입 분석 ===');
    const fundingTypes = new Map();
    data.forEach(row => {
      const rawType = row['펀딩타입'];
      if (rawType) {
        fundingTypes.set(rawType, (fundingTypes.get(rawType) || 0) + 1);
      }
    });
    
    console.log('펀딩 타입별 개수:');
    fundingTypes.forEach((count, type) => {
      const mappedId = fundingTypeMap[type];
      console.log(`  ${type} → ${mappedId || '매핑 없음'}: ${count}개`);
    });
    
    // 이메일 분석
    console.log('\n=== 이메일 분석 ===');
    const emails = new Set();
    let noEmailCount = 0;
    
    data.forEach(row => {
      const email = row['이메일'];
      if (email && typeof email === 'string' && email.includes('@')) {
        emails.add(email);
      } else {
        noEmailCount++;
      }
    });
    
    console.log(`고유 이메일 수: ${emails.size}`);
    console.log(`이메일 없는 행: ${noEmailCount}`);
    
    // 날짜 형식 샘플
    console.log('\n=== 날짜 형식 샘플 ===');
    const dateSamples = [];
    data.slice(0, 10).forEach(row => {
      const date = row['날짜'];
      if (date && !dateSamples.includes(date)) {
        dateSamples.push(date);
      }
    });
    console.log('날짜 샘플:', dateSamples.slice(0, 5));
    
    // 금액 범위 분석
    console.log('\n=== 금액 분석 ===');
    let minAmount = Infinity;
    let maxAmount = 0;
    let totalAmount = 0;
    let amountCount = 0;
    
    data.forEach(row => {
      const amount = parseFloat(row['구매금액'] || row['amount'] || row['금액'] || row['투자금액'] || 0);
      if (amount > 0) {
        minAmount = Math.min(minAmount, amount);
        maxAmount = Math.max(maxAmount, amount);
        totalAmount += amount;
        amountCount++;
      }
    });
    
    console.log(`최소 금액: ${minAmount.toLocaleString()}원`);
    console.log(`최대 금액: ${maxAmount.toLocaleString()}원`);
    console.log(`평균 금액: ${Math.floor(totalAmount / amountCount).toLocaleString()}원`);
    
  } catch (error) {
    console.error('엑셀 파일 읽기 오류:', error);
  }
}

// 실행
previewExcelData();