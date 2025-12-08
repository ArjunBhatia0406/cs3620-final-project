import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    //Check if email exists and has sales rep role
    const [result]: any = await connection.query(`
      SELECT 
        u.id,
        u.email,
        r.description as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.email = ? AND r.description LIKE '%sales%'
    `, [email]);

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No sales representative found with this email',
        isSalesRep: false
      });
    }

    const user = result[0];

    return NextResponse.json({
      success: true,
      isSalesRep: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Error checking sales rep:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check sales rep',
        details: error.message
      }, 
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}