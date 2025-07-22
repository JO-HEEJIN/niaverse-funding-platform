const XLSX = require('xlsx');
const path = require('path');

// 펀딩 ID 매핑
const fundingTypeMap = {
  '펀딩 1': 'funding-1',
  '펀딩1': 'funding-1',
  'Doge': 'funding-1',
  'DOGE': 'funding-1',
  '도지': 'funding-1',
  '채굴기': 'funding-1', // 엑셀에서 발견된 용어
  '펀딩 2': 'funding-2',
  '펀딩2': 'funding-2',
  'Data Center': 'funding-2',
  '데이터센터': 'funding-2',
  '펀딩 3': 'funding-3',
  '펀딩3': 'funding-3',
  'VAST': 'funding-3',
  '바스트': 'funding-3'
};

// 펀딩별 수익 계산 (테스트용)
function calculateAccumulatedIncome(fundingId, purchaseData) {
  const today = new Date();
  const purchaseDate = new Date(purchaseData.purchaseDate);
  const daysPassed = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
  const validDaysPassed = Math.max(0, daysPassed);
  
  switch(fundingId) {
    case 'funding-1':
      const dailyDoge = 2;
      return {
        accumulated: purchaseData.units * dailyDoge * validDaysPassed,
        unit: 'Doge',
        dailyRate: purchaseData.units * dailyDoge
      };
      
    case 'funding-2':
      const monthlyRate = 0.0048;
      const monthsPassed = validDaysPassed / 30;
      const monthlyIncome = purchaseData.amount * monthlyRate;
      return {
        accumulated: Math.floor(monthlyIncome * monthsPassed),
        unit: 'KRW',
        monthlyIncome: monthlyIncome
      };
      
    case 'funding-3':
      return {
        accumulated: 0,
        unit: 'VAST',
        annualRate: 0
      };
      
    default:
      return { accumulated: 0, unit: 'Unknown' };
  }
}

// 테스트 실행
async function testProcessing() {
  try {
    console.log('=== 엑셀 데이터 처리 테스트 ===\n');
    
    const excelPath = path.join(__dirname, '..', '전체회원 정리 (니아버스).xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 커스텀 헤더로 데이터 읽기
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: ['인원수', '날짜', '구매자', '이메일', '생년월일', '연락처', '펀딩타입'],
      range: 1
    });
    
    console.log(`총 ${data.length}개 레코드 로드`);
    
    const userFundingMap = new Map();
    let processedCount = 0;
    let errorCount = 0;
    
    // 데이터 처리
    data.forEach((row, index) => {
      try {
        // 첫 번째 행(헤더 정보)은 건너뛰기
        if (row['이메일'] === '가입아이디' || !row['이메일']) {
          return;
        }
        
        const email = row['이메일'];
        const rawFundingType = row['펀딩타입'];
        const purchaseDate = row['날짜'];
        
        // 이메일 형식 검증
        if (!email || typeof email !== 'string' || !email.includes('@')) {
          console.warn(`⚠️  행 ${index + 2}: 유효하지 않은 이메일: ${email}`);
          return;
        }
        
        // 펀딩 타입 정규화
        const fundingId = fundingTypeMap[rawFundingType];
        if (!fundingId) {
          console.warn(`⚠️  행 ${index + 2}: 알 수 없는 펀딩 타입: ${rawFundingType}`);
          return;
        }
        
        if (!userFundingMap.has(email)) {
          userFundingMap.set(email, {
            email: email,
            name: row['구매자'],
            phone: row['연락처'],
            fundings: []
          });
        }
        
        // 기본 투자 금액 설정
        let amount = 1000000;
        let units = 1;
        
        if (fundingId === 'funding-1') {
          amount = 1000000; // 채굴기 1대 = 100만원
          units = 1;
        } else if (fundingId === 'funding-2') {
          amount = 1000000; // 데이터센터 기본 100만원
          units = 1;
        } else if (fundingId === 'funding-3') {
          amount = 1000000; // VAST 기본 100만원 (1000 VAST)
          units = 1000;
        }
        
        // 날짜 처리
        let parsedDate = new Date();
        if (typeof purchaseDate === 'number') {
          parsedDate = new Date((purchaseDate - 25569) * 86400 * 1000);
        } else if (typeof purchaseDate === 'string') {
          parsedDate = new Date(purchaseDate);
        }
        
        const fundingData = {
          fundingId: fundingId,
          purchaseDate: parsedDate,
          amount: amount,
          units: units
        };
        
        // 수익 계산
        const income = calculateAccumulatedIncome(fundingId, fundingData);
        fundingData.calculatedIncome = income;
        
        userFundingMap.get(email).fundings.push(fundingData);
        processedCount++;
        
      } catch (error) {
        errorCount++;
        console.error(`❌ 행 ${index + 2} 처리 오류:`, error.message);
      }
    });
    
    console.log(`\n처리 완료: ${processedCount}개 성공, ${errorCount}개 실패`);
    console.log(`고유 사용자 수: ${userFundingMap.size}명`);
    
    // 펀딩 타입별 통계
    console.log('\n=== 펀딩 타입별 통계 ===');
    const fundingStats = { 'funding-1': 0, 'funding-2': 0, 'funding-3': 0 };
    
    for (const [email, userData] of userFundingMap) {
      userData.fundings.forEach(funding => {
        fundingStats[funding.fundingId]++;
      });
    }
    
    console.log(`채굴기 (funding-1): ${fundingStats['funding-1']}개`);
    console.log(`데이터센터 (funding-2): ${fundingStats['funding-2']}개`);
    console.log(`VAST (funding-3): ${fundingStats['funding-3']}개`);
    
    // 샘플 사용자 5명 출력
    console.log('\n=== 샘플 사용자 데이터 (처음 5명) ===');
    let count = 0;
    for (const [email, userData] of userFundingMap) {
      if (count >= 5) break;
      
      console.log(`\n${count + 1}. ${userData.name} (${email})`);
      console.log(`   연락처: ${userData.phone || 'N/A'}`);
      
      userData.fundings.forEach((funding, index) => {
        const income = funding.calculatedIncome;
        console.log(`   펀딩 ${index + 1}: ${funding.fundingId}`);
        console.log(`     - 투자액: ${funding.amount.toLocaleString()}원`);
        console.log(`     - 구매일: ${funding.purchaseDate.toLocaleDateString()}`);
        console.log(`     - 예상수익: ${income.accumulated.toLocaleString()} ${income.unit}`);
      });
      
      count++;
    }
    
    // 중복 구매 사용자 찾기
    console.log('\n=== 중복 구매 사용자 ===');
    let duplicateCount = 0;
    for (const [email, userData] of userFundingMap) {
      if (userData.fundings.length > 1) {
        duplicateCount++;
        if (duplicateCount <= 3) { // 처음 3명만 출력
          console.log(`${userData.name} (${email}): ${userData.fundings.length}개 구매`);
          userData.fundings.forEach(funding => {
            console.log(`  - ${funding.fundingId} (${funding.purchaseDate.toLocaleDateString()})`);
          });
        }
      }
    }
    console.log(`총 중복 구매 사용자: ${duplicateCount}명`);
    
    console.log('\n=== 테스트 완료 ===');
    console.log('실제 DB 업데이트를 원한다면: node scripts/batchUpdateFundings.js');
    
  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
  }
}

// 실행
testProcessing();