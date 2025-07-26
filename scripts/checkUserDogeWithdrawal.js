const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://niaverse_admin:Qlalfqjsgh1@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkUserDogeWithdrawal() {
  const client = await pool.connect();
  
  try {
    // Find user by email
    const userResult = await client.query(
      "SELECT id, name, email FROM users WHERE email = 'Heyjoo22@naver.com'"
    );
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('User found:', user);
    
    // Get user's purchases
    const purchasesResult = await client.query(
      `SELECT 
        id,
        funding_id,
        quantity,
        price,
        accumulated_income,
        contract_signed,
        approved,
        created_at
      FROM purchases 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [user.id]
    );
    
    console.log('\nUser purchases:');
    purchasesResult.rows.forEach(purchase => {
      console.log({
        id: purchase.id,
        funding_id: purchase.funding_id,
        quantity: purchase.quantity,
        price: purchase.price,
        accumulated_income: purchase.accumulated_income,
        accumulated_income_type: typeof purchase.accumulated_income,
        contract_signed: purchase.contract_signed,
        approved: purchase.approved
      });
    });
    
    // Calculate total Doge income
    const dogeIncome = purchasesResult.rows
      .filter(p => p.funding_id === 'funding-1' && p.contract_signed && p.approved)
      .reduce((sum, p) => {
        const income = typeof p.accumulated_income === 'string' 
          ? parseFloat(p.accumulated_income) 
          : p.accumulated_income;
        return sum + (isNaN(income) ? 0 : income);
      }, 0);
    
    console.log('\nTotal Doge accumulated income:', dogeIncome);
    
    // Check withdrawals
    const withdrawalsResult = await client.query(
      `SELECT * FROM withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );
    
    console.log('\nUser withdrawals:', withdrawalsResult.rows.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserDogeWithdrawal();