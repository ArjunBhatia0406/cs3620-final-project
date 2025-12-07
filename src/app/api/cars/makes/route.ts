import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

//Get all car makes
export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    //Query to get makes
    const [makes]: any = await connection.query(`
      SELECT DISTINCT make 
      FROM car 
      WHERE make IS NOT NULL AND make != ''
      ORDER BY make
    `);
    
    return NextResponse.json({
      success: true,
      makes: makes.map((row: any) => row.make)
    });
    
  } catch (error: any) {
    console.error('Error fetching makes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}