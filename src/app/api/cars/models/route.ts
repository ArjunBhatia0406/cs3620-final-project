import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

//Get all car models for a given make
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const make = searchParams.get('make');
    
    if (!make) {
      return NextResponse.json({ success: true, models: [] });
    }
    
    connection = await mysql.createConnection(dbConfig);
    
    //Query to get models
    const [models]: any = await connection.query(`
      SELECT DISTINCT model 
      FROM car 
      WHERE make = ? AND model IS NOT NULL AND model != ''
      ORDER BY model
    `, [make]);
    
    return NextResponse.json({
      success: true,
      models: models.map((row: any) => row.model)
    });
    
  } catch (error: any) {
    console.error('Error fetching models:', error);
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