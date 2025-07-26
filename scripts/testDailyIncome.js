/**
 * 일일 수익 계산 시스템 테스트 스크립트
 * 
 * 이 스크립트는 다음을 테스트합니다:
 * 1. 현재 활성 구매 건 조회
 * 2. 수익률 계산 로직 검증
 * 3. API 엔드포인트 테스트
 */

const https = require('https');

// 환경 설정
const BASE_URL = 'https://niaverse.org'; // 또는 'http://localhost:3000'
const CRON_SECRET = 'niaverse-daily-income-2024';

/**
 * HTTP 요청 헬퍼 함수
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * 1. Cron Job API 테스트 (인증 실패)
 */
async function testCronUnauthorized() {
  console.log('\n🔒 Testing unauthorized cron request...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/cron/daily-income`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);
    
    if (response.status === 401) {
      console.log('✅ Unauthorized test passed');
    } else {
      console.log('❌ Unauthorized test failed - should return 401');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * 2. Cron Job API 테스트 (인증 성공)
 */
async function testCronAuthorized() {
  console.log('\n🔑 Testing authorized cron request...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/cron/daily-income?secret=${CRON_SECRET}&manual=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Authorized cron test passed');
      console.log(`📊 Statistics:`, response.data.statistics);
    } else {
      console.log('❌ Authorized cron test failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * 3. 수익률 계산 로직 테스트
 */
function testIncomeCalculations() {
  console.log('\n🧮 Testing income calculation logic...');
  
  // Doge 계산 테스트
  const dogeTests = [
    { miningUnits: 77, currentIncome: 30492, expected: 30646 }, // 30492 + (77 × 2) = 30646
    { miningUnits: 1, currentIncome: 0, expected: 2 }, // 0 + (1 × 2) = 2
    { miningUnits: 100, currentIncome: 5000, expected: 5200 } // 5000 + (100 × 2) = 5200
  ];
  
  console.log('\n🐕 Doge Calculations:');
  dogeTests.forEach((test, i) => {
    const dailyIncome = test.miningUnits * 2; // 2 Doge per mining unit
    const newTotal = test.currentIncome + dailyIncome;
    const passed = newTotal === test.expected;
    
    console.log(`Test ${i + 1}: ${test.miningUnits} units × 2 = ${dailyIncome} daily, ${test.currentIncome} current → ${newTotal} ${passed ? '✅' : '❌'}`);
  });
  
  // Data Center 계산 테스트
  const dataCenterTests = [
    { amount: 11000000, currentIncome: 476400, monthlyRate: 0.05 },
    { amount: 1000000, currentIncome: 0, monthlyRate: 0.05 }
  ];
  
  console.log('\n🏢 Data Center Calculations:');
  dataCenterTests.forEach((test, i) => {
    const dailyRate = test.monthlyRate / 30;
    const dailyIncome = test.amount * dailyRate;
    const newTotal = test.currentIncome + dailyIncome;
    
    console.log(`Test ${i + 1}: ₩${test.amount.toLocaleString()} × ${(dailyRate * 100).toFixed(3)}% = ₩${dailyIncome.toLocaleString()} daily`);
    console.log(`  Current: ₩${test.currentIncome.toLocaleString()} → New: ₩${newTotal.toLocaleString()}`);
  });
}

/**
 * 4. 일일 수익 예상 계산
 */
function calculateExpectedDailyTotals() {
  console.log('\n📈 Expected Daily Income Totals:');
  
  // 가정: 현재 활성 구매 건들
  const activePurchases = [
    { type: 'Doge', miningUnits: 77, dailyIncome: 77 * 2 }, // 77 units × 2 = 154 Doge/day
    { type: 'DataCenter', amount: 11000000, dailyIncome: 11000000 * (0.05 / 30) }
  ];
  
  let totalDailyIncome = 0;
  
  activePurchases.forEach(purchase => {
    console.log(`${purchase.type}: ${purchase.type === 'Doge' ? purchase.dailyIncome + ' Doge' : '₩' + purchase.dailyIncome.toLocaleString()}/day`);
    if (purchase.type === 'DataCenter') {
      totalDailyIncome += purchase.dailyIncome;
    }
  });
  
  console.log(`\nTotal Daily KRW Income: ₩${totalDailyIncome.toLocaleString()}`);
  console.log(`Monthly KRW Income: ₩${(totalDailyIncome * 30).toLocaleString()}`);
}

/**
 * 메인 테스트 실행
 */
async function runAllTests() {
  console.log('🚀 Daily Income System Test Suite');
  console.log('================================');
  
  // 로직 테스트 (오프라인)
  testIncomeCalculations();
  calculateExpectedDailyTotals();
  
  // API 테스트 (온라인)
  await testCronUnauthorized();
  await testCronAuthorized();
  
  console.log('\n🏁 Test suite completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check the logs above for any failures');
  console.log('2. Set up external cron job to call the API daily');
  console.log('3. Monitor the daily income updates in the dashboard');
  console.log(`4. Cron URL: ${BASE_URL}/api/cron/daily-income`);
  console.log(`5. Secret: ${CRON_SECRET}`);
}

// 실행
runAllTests().catch(console.error);