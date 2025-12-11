import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    const { id } = await params;
    const carId = id;
    
    if (!carId || isNaN(parseInt(carId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid car ID' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    //Query to fetch maintenance history
    const query = `
      SELECT 
        id,
        car_id,
        repairs
      FROM maintenance_history
      WHERE car_id = ?
      LIMIT 10
    `;

    const [rows]: any = await connection.execute(query, [parseInt(carId)]);
    
    return NextResponse.json({
      success: true,
      history: rows
    });

  } catch (error: any) {
    console.error('Error fetching maintenance history:', error);
    return NextResponse.json(
      { success: true, history: [] }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}