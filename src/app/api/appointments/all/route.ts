import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [appointments]: any = await connection.query(`
      SELECT 
        a.id,
        a.date,
        a.employee_id,
        ad.service_type,
        ad.car,
        c.phone_number,
        e.name as employee_name,
        u.email as user_email
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN appointment_details ad ON a.id = ad.appointment_id
      JOIN contacts c ON a.id = c.appointment_id
      JOIN employees e ON a.employee_id = e.id
      ORDER BY a.date DESC
    `);

    return NextResponse.json({ appointments });

  } catch (error) {
    console.error('Error fetching all appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}