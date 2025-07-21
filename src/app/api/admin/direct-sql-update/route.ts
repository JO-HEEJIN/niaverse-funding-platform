import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, email, fundingAmount, accumulatedIncome } = await request.json();
    
    if (action !== 'update_ysu_funding') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 직접 SQL 문을 반환해서 수동으로 실행할 수 있게 함
    const sqlCommands = [
      `-- 노영수님 사용자 찾기`,
      `SELECT id, name, email FROM users WHERE email = '${email}';`,
      ``,
      `-- 기존 funding-2 구매 확인`,
      `SELECT * FROM purchases WHERE user_id = (SELECT id FROM users WHERE email = '${email}') AND funding_id = 'funding-2';`,
      ``,
      `-- 기존 구매가 있다면 업데이트`,
      `UPDATE purchases SET 
        quantity = ${fundingAmount}, 
        price = '${fundingAmount}', 
        accumulated_income = '${accumulatedIncome}',
        updated_at = NOW()
      WHERE user_id = (SELECT id FROM users WHERE email = '${email}') AND funding_id = 'funding-2';`,
      ``,
      `-- 기존 구매가 없다면 새로 생성`,
      `INSERT INTO purchases (user_id, funding_id, quantity, price, accumulated_income, contract_signed, last_income_update, created_at, updated_at)
      SELECT id, 'funding-2', ${fundingAmount}, '${fundingAmount}', '${accumulatedIncome}', true, NOW(), NOW(), NOW()
      FROM users WHERE email = '${email}' AND NOT EXISTS (
        SELECT 1 FROM purchases WHERE user_id = users.id AND funding_id = 'funding-2'
      );`,
      ``,
      `-- 결과 확인`,
      `SELECT u.name, u.email, p.funding_id, p.quantity, p.price, p.accumulated_income 
      FROM users u 
      JOIN purchases p ON u.id = p.user_id 
      WHERE u.email = '${email}' AND p.funding_id = 'funding-2';`
    ];

    return NextResponse.json({
      success: true,
      message: '다음 SQL 명령어들을 데이터베이스에서 직접 실행하세요:',
      sqlCommands: sqlCommands.join('\n'),
      instructions: [
        '1. AWS RDS 콘솔에 접속',
        '2. Query Editor 또는 데이터베이스 클라이언트 사용',
        '3. 위의 SQL 명령어들을 순서대로 실행',
        '4. 마지막 SELECT 문으로 결과 확인'
      ]
    });

  } catch (error) {
    console.error('Direct SQL update error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SQL commands' },
      { status: 500 }
    );
  }
}