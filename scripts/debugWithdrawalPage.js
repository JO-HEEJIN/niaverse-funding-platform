const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: 'postgresql://niaverse_admin:Qlalfqjsgh1@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse',
  ssl: {
    rejectUnauthorized: false
  }
});

async function debugWithdrawalPage() {
  const client = await pool.connect();
  
  try {
    // Find user by email
    const userEmail = 'Heyjoo22@naver.com';
    const userResult = await client.query(
      "SELECT id, name, email FROM users WHERE email = $1",
      [userEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('=== USER INFO ===');
    console.log('User:', user);
    
    // Create a mock token for testing
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret'
    );
    console.log('\nTest token:', token);
    
    // Get user's purchases - mimicking the API query
    const purchasesResult = await client.query(
      `SELECT 
        id, 
        user_id as "userId", 
        funding_id as "fundingId", 
        quantity, 
        price, 
        contract_signed as "contractSigned", 
        contract_data as "contractData", 
        accumulated_income as "accumulatedIncome", 
        last_income_update as "lastIncomeUpdate", 
        approved, 
        approved_at as "approvedAt", 
        approved_by as "approvedBy", 
        created_at as timestamp 
      FROM purchases 
      WHERE user_id = $1 
      ORDER BY created_at DESC`,
      [user.id]
    );
    
    console.log('\n=== RAW PURCHASES FROM DB ===');
    console.log('Total purchases:', purchasesResult.rows.length);
    purchasesResult.rows.forEach((p, i) => {
      console.log(`\nPurchase ${i + 1}:`);
      console.log('  ID:', p.id);
      console.log('  Funding ID:', p.fundingId);
      console.log('  Quantity:', p.quantity);
      console.log('  Price:', p.price);
      console.log('  Accumulated Income:', p.accumulatedIncome, `(type: ${typeof p.accumulatedIncome})`);
      console.log('  Contract Signed:', p.contractSigned);
      console.log('  Approved:', p.approved);
    });
    
    // Check what the departure page would see
    console.log('\n=== DEPARTURE PAGE LOGIC CHECK ===');
    
    // Filter for approved and contract signed
    const validPurchases = purchasesResult.rows.filter(p => p.contractSigned && p.approved);
    console.log('Valid purchases (contractSigned && approved):', validPurchases.length);
    
    // Check funding match
    const fundingOptions = [
      { id: '1', title: '펀딩 I', unit: 'Doge' },
      { id: '2', title: '펀딩 II', unit: '원' },
      { id: '3', title: '펀딩 III', unit: 'VAST' }
    ];
    
    validPurchases.forEach(purchase => {
      const normalizedId = purchase.fundingId.replace('funding-', '');
      const funding = fundingOptions.find(f => f.id === normalizedId || `funding-${f.id}` === purchase.fundingId);
      console.log(`\nFunding match for ${purchase.fundingId}:`, funding ? funding.title : 'NOT FOUND');
      
      if (funding) {
        const accumulatedIncome = typeof purchase.accumulatedIncome === 'string' 
          ? parseFloat(purchase.accumulatedIncome) 
          : purchase.accumulatedIncome;
        console.log('  Parsed accumulated income:', accumulatedIncome);
        console.log('  Is valid number:', !isNaN(accumulatedIncome) && accumulatedIncome > 0);
      }
    });
    
    // Calculate income by funding
    const incomeByFunding = validPurchases.reduce((acc, purchase) => {
      const normalizedId = purchase.fundingId.replace('funding-', '');
      const funding = fundingOptions.find(f => f.id === normalizedId || `funding-${f.id}` === purchase.fundingId);
      
      if (!funding) {
        console.log(`Warning: No funding match for ${purchase.fundingId}`);
        return acc;
      }
      
      if (!acc[purchase.fundingId]) {
        acc[purchase.fundingId] = {
          fundingId: purchase.fundingId,
          fundingTitle: funding.title,
          totalIncome: 0,
          unit: funding.unit,
          purchases: []
        };
      }
      
      const accumulatedIncome = typeof purchase.accumulatedIncome === 'string' 
        ? parseFloat(purchase.accumulatedIncome) 
        : purchase.accumulatedIncome;
        
      acc[purchase.fundingId].totalIncome += isNaN(accumulatedIncome) ? 0 : accumulatedIncome;
      acc[purchase.fundingId].purchases.push(purchase);
      
      return acc;
    }, {});
    
    console.log('\n=== FINAL INCOME BY FUNDING ===');
    console.log('Income groups:', Object.keys(incomeByFunding).length);
    Object.entries(incomeByFunding).forEach(([fundingId, data]) => {
      console.log(`\n${fundingId} (${data.fundingTitle}):`);
      console.log('  Total Income:', data.totalIncome, data.unit);
      console.log('  Purchase Count:', data.purchases.length);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugWithdrawalPage();