const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://niaverse_admin:Qlalfqjsgh1@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse',
  ssl: {
    rejectUnauthorized: false
  }
});

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

// 엑셀 파일 읽기 및 파싱
async function processExcelData(filePath) {
  console.log(`엑셀 파일 읽기: ${filePath}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 커스텀 헤더로 데이터 읽기
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: ['인원수', '날짜', '구매자', '이메일', '생년월일', '연락처', '펀딩타입'],
    range: 1 // 첫 번째 행부터 시작 (헤더 행 건너뛰기)
  });
  
  console.log(`총 ${data.length}개의 레코드 발견`);
  
  // 회원별 펀딩 데이터 그룹화
  const userFundingMap = new Map();
  
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
        console.warn(`행 ${index + 2}: 유효하지 않은 이메일: ${email}`);
        return;
      }
      
      // 펀딩 타입 정규화
      const fundingId = fundingTypeMap[rawFundingType] || null;
      if (!fundingId) {
        console.warn(`행 ${index + 2}: 알 수 없는 펀딩 타입: ${rawFundingType}`);
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
      
      // 기본 투자 금액 설정 (엑셀에 금액 정보가 없으므로)
      let amount = 1000000; // 기본 100만원
      let units = 1;
      
      // 펀딩별 기본값 설정
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
      
      // 날짜 처리 (엑셀의 시리얼 번호 형태를 처리)
      let parsedDate = new Date();
      if (typeof purchaseDate === 'number') {
        // 엑셀 시리얼 날짜를 JS Date로 변환
        parsedDate = new Date((purchaseDate - 25569) * 86400 * 1000);
      } else if (typeof purchaseDate === 'string') {
        parsedDate = new Date(purchaseDate);
      }
      
      userFundingMap.get(email).fundings.push({
        fundingId: fundingId,
        purchaseDate: parsedDate,
        amount: amount,
        units: units
      });
      
    } catch (error) {
      console.error(`행 ${index + 2} 처리 중 오류:`, error.message);
    }
  });
  
  return userFundingMap;
}

// 펀딩별 수익 계산
function calculateAccumulatedIncome(fundingId, purchaseData) {
  const today = new Date();
  const purchaseDate = new Date(purchaseData.purchaseDate);
  const daysPassed = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
  
  // 음수 일수 방지
  const validDaysPassed = Math.max(0, daysPassed);
  
  switch(fundingId) {
    case 'funding-1':
      // Doge: 채굴기당 하루 2 Doge
      const dailyDoge = 2;
      return {
        accumulated: purchaseData.units * dailyDoge * validDaysPassed,
        unit: 'Doge',
        dailyRate: purchaseData.units * dailyDoge
      };
      
    case 'funding-2':
      // Data Center: 월 0.48% 수익률
      const monthlyRate = 0.0048;
      const monthsPassed = validDaysPassed / 30;
      const monthlyIncome = purchaseData.amount * monthlyRate;
      return {
        accumulated: Math.floor(monthlyIncome * monthsPassed),
        unit: 'KRW',
        monthlyIncome: monthlyIncome
      };
      
    case 'funding-3':
      // VAST: 현재는 수익 없음 (추후 정책 결정)
      return {
        accumulated: 0,
        unit: 'VAST',
        annualRate: 0
      };
      
    default:
      return { accumulated: 0, unit: 'Unknown' };
  }
}

// 같은 펀딩 상품의 중복 구매 합산
function consolidateFundings(userFundings) {
  const consolidated = new Map();
  
  userFundings.forEach(funding => {
    const key = funding.fundingId;
    
    if (!consolidated.has(key)) {
      consolidated.set(key, {
        fundingId: funding.fundingId,
        totalAmount: 0,
        totalUnits: 0,
        purchases: [],
        totalAccumulated: 0
      });
    }
    
    const fundingData = consolidated.get(key);
    fundingData.totalAmount += funding.amount;
    fundingData.totalUnits += funding.units;
    fundingData.purchases.push({
      date: funding.purchaseDate,
      amount: funding.amount,
      units: funding.units
    });
    
    // 각 구매별 수익 계산 후 합산
    const income = calculateAccumulatedIncome(funding.fundingId, funding);
    fundingData.totalAccumulated += income.accumulated;
    fundingData.unit = income.unit;
  });
  
  return consolidated;
}

// ID 생성 함수
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// 개별 사용자 처리 (개별 트랜잭션)
async function processIndividualUser(userData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. 사용자 조회 또는 생성
    let userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );
    
    let userId;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      // 새 사용자 생성 (ID 직접 생성)
      userId = generateId();
      await client.query(
        `INSERT INTO users (id, email, password_hash, name, phone, confirmed, is_admin) 
         VALUES ($1, $2, $3, $4, $5, true, false)`,
        [
          userId,
          userData.email,
          '$2a$10$dummy.hash.for.batch.import',
          userData.name || userData.email.split('@')[0],
          userData.phone || '010-0000-0000'
        ]
      );
    }
    
    // 2. 펀딩 데이터 합산
    const consolidated = consolidateFundings(userData.fundings);
    
    // 3. 각 펀딩별 처리
    for (const [fundingId, fundingData] of consolidated) {
      // funding-1의 경우 quantity는 채굴기 수
      let quantity = fundingData.totalUnits;
      let price = fundingData.totalAmount;
      
      // funding-3의 경우 quantity는 VAST 코인 수
      if (fundingId === 'funding-3') {
        quantity = fundingData.totalAmount / 1000; // 1000원 = 1 VAST
      }
      
      // 기존 구매 내역 확인
      const existingResult = await client.query(
        'SELECT id FROM purchases WHERE user_id = $1 AND funding_id = $2',
        [userId, fundingId]
      );
      
      if (existingResult.rows.length > 0) {
        // 업데이트
        await client.query(
          `UPDATE purchases 
           SET quantity = $1, price = $2, accumulated_income = $3, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $4 AND funding_id = $5`,
          [quantity, price.toString(), fundingData.totalAccumulated.toString(), userId, fundingId]
        );
      } else {
        // 신규 삽입 (ID 직접 생성)
        const purchaseId = generateId();
        await client.query(
          `INSERT INTO purchases (id, user_id, funding_id, quantity, price, accumulated_income, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [purchaseId, userId, fundingId, quantity, price.toString(), fundingData.totalAccumulated.toString()]
        );
      }
    }
    
    await client.query('COMMIT');
    return { success: true, userId, fundings: Array.from(consolidated.keys()) };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 진행 상황 추적
function createProgressTracker(total) {
  let processed = 0;
  const startTime = Date.now();
  
  return {
    update: (email, status) => {
      processed++;
      const progress = ((processed / total) * 100).toFixed(2);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(`[${progress}%] ${processed}/${total} - ${email}: ${status} (${elapsed}s)`);
    },
    
    complete: () => {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n총 처리 시간: ${totalTime}초`);
    }
  };
}

// 메인 실행 함수
async function batchUpdateUserFundings() {
  const results = [];
  
  try {
    console.log('=== 회원 펀딩 정보 일괄 업데이트 시작 ===\n');
    
    // 1. 엑셀 데이터 읽기
    const excelPath = path.join(__dirname, '..', '전체회원 정리 (니아버스).xlsx');
    const userFundingMap = await processExcelData(excelPath);
    
    console.log(`\n처리할 회원 수: ${userFundingMap.size}명\n`);
    
    // 2. 진행 상황 추적기 생성
    const tracker = createProgressTracker(userFundingMap.size);
    
    // 3. 각 회원별 처리 (개별 트랜잭션)
    for (const [email, userData] of userFundingMap) {
      try {
        const result = await processIndividualUser(userData);
        tracker.update(email, 'SUCCESS');
        results.push({ email, status: 'success', ...result });
        
      } catch (error) {
        tracker.update(email, 'FAILED');
        results.push({ email, status: 'error', error: error.message });
        console.error(`❌ ${email}: ${error.message}`);
      }
    }
    
    tracker.complete();
    
    // 4. 결과 요약
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log('\n=== 처리 완료 ===');
    console.log(`성공: ${successCount}명`);
    console.log(`실패: ${errorCount}명`);
    
    // 5. 로그 저장
    const logData = {
      timestamp: new Date().toISOString(),
      totalProcessed: results.length,
      success: successCount,
      failed: errorCount,
      details: results
    };
    
    const logPath = path.join(__dirname, `update_log_${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    console.log(`\n로그 파일 저장됨: ${logPath}`);
    
  } catch (error) {
    console.error('\n일괄 업데이트 실패:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  batchUpdateUserFundings()
    .then(() => {
      console.log('\n스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { batchUpdateUserFundings };