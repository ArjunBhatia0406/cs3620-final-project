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
    //Await the params promise
    const { id } = await params;
    const carId = id;
    
    if (!carId || isNaN(parseInt(carId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid car ID' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    //SQL query to fetch car details
    const query = `
      SELECT 
        c.id,
        c.make,
        c.model,
        c.year,
        c.origin,
        l.city,
        l.state,
        s.mpg,
        s.horse_power,
        s.acceleration,
        q.available,
        qn.car_condition,
        t.fuel_type,
        t.vehicle_class as transmission,
        CAST(sf.rating AS DECIMAL(3,1)) as safety_rating,
        p.price
      FROM car c
      LEFT JOIN stats s ON c.id = s.car_id
      LEFT JOIN location l ON c.id = l.car_id
      LEFT JOIN quantity q ON c.id = q.car_id
      LEFT JOIN quality_new qn ON c.id = qn.car_id
      LEFT JOIN type t ON c.id = t.car_id
      LEFT JOIN saftey sf ON qn.saftey_id = sf.id
      LEFT JOIN price p ON c.id = p.car_id
      WHERE c.id = ?
      LIMIT 1
    `;

    const [rows]: any = await connection.execute(query, [parseInt(carId)]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      car: rows[0]
    });

  } catch (error: any) {
    console.error('Error fetching car details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch car details' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}