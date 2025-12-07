import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

//Search cars based on various filters
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    
    //Get filter parameters
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    const condition = searchParams.get('condition');
    const fuelType = searchParams.get('fuelType');
    const transmission = searchParams.get('transmission');
    const minSafetyRating = searchParams.get('minSafetyRating');
    const maxSafetyRating = searchParams.get('maxSafetyRating');
    const minMpg = searchParams.get('minMpg');
    const maxMpg = searchParams.get('maxMpg');
    const minHorsepower = searchParams.get('minHorsepower');
    const maxHorsepower = searchParams.get('maxHorsepower');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const limit = searchParams.get('limit') || '12';
    const page = searchParams.get('page') || '1';
        
    const offset = (parseInt(page) - 1) * parseInt(limit);

    connection = await mysql.createConnection(dbConfig);

    //WHERE clause
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    //Helper function to add conditions
    const addCondition = (field: string, value: string | null, operator: string) => {
      if (value && value.trim() !== '') {
        whereConditions.push(`${field} ${operator} ?`);
        queryParams.push(value);
      }
    };

    //Helper function to add numeric conditions
    const addNumericCondition = (field: string, value: string | null, operator: '>=' | '<=') => {
      if (value && value.trim() !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          whereConditions.push(`${field} ${operator} ?`);
          queryParams.push(numValue);
        }
      }
    };

    //Build filters
    if (make && make.trim() !== '') {
      whereConditions.push('c.make LIKE ?');
      queryParams.push(`%${make}%`);
    }
    
    if (model && model.trim() !== '') {
      whereConditions.push('c.model LIKE ?');
      queryParams.push(`%${model}%`);
    }
    
    addNumericCondition('c.year', minYear, '>=');
    addNumericCondition('c.year', maxYear, '<=');
    
    addCondition('qn.car_condition', condition, '=');
    addCondition('t.fuel_type', fuelType, '=');
    addCondition('t.vehicle_class', transmission, '=');
    
    addNumericCondition('sf.rating', minSafetyRating, '>=');
    addNumericCondition('sf.rating', maxSafetyRating, '<=');
    
    addNumericCondition('s.mpg', minMpg, '>=');
    addNumericCondition('s.mpg', maxMpg, '<=');
    
    addNumericCondition('s.horse_power', minHorsepower, '>=');
    addNumericCondition('s.horse_power', maxHorsepower, '<=');
    
    //Available only filter
    if (availableOnly) {
      whereConditions.push('q.available = 1');
    }

    //WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    //Get total count for pages
    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        SELECT DISTINCT c.make, c.model, c.year, c.origin
        FROM car c
        LEFT JOIN stats s ON c.id = s.car_id
        LEFT JOIN location l ON c.id = l.car_id
        LEFT JOIN quantity q ON c.id = q.car_id
        LEFT JOIN quality_new qn ON c.id = qn.car_id
        LEFT JOIN type t ON c.id = t.car_id
        LEFT JOIN saftey sf ON qn.saftey_id = sf.id
        ${whereClause}
      ) as unique_cars
    `;
    
    let countResult: any;
    try {
      [countResult] = await connection.query(countQuery, queryParams);
    } catch (countError: any) {
      console.error('Count query failed:', countError.message);
      countResult = [{ total: 0 }];
    }

    const total = countResult[0]?.total || 0;
    console.log('Total unique cars:', total);

    //Get filtered cars
    const carsQuery = `
    WITH ranked_cars AS (
        SELECT 
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
        t.vehicle_class,
        CAST(sf.rating AS DECIMAL(3,1)) as safety_rating,
        sf.blind_spot_decision,
        sf.collision_warning,
        -- Rank by availability and condition (available & newer condition first)
        ROW_NUMBER() OVER (
            PARTITION BY c.make, c.model, c.year, c.origin 
            ORDER BY 
            q.available DESC, -- Available cars first
            CASE qn.car_condition
                WHEN 'New' THEN 1
                WHEN 'Used - Excellent' THEN 2
                WHEN 'Used - Good' THEN 3
                WHEN 'Used - Fair' THEN 4
                WHEN 'Vintage' THEN 5
                ELSE 6
            END,
            s.horse_power DESC, -- Higher horsepower first
            sf.rating DESC, -- Higher safety rating first
            RAND() -- Random tiebreaker
        ) as rn
        FROM car c
        LEFT JOIN stats s ON c.id = s.car_id
        LEFT JOIN location l ON c.id = l.car_id
        LEFT JOIN quantity q ON c.id = q.car_id
        LEFT JOIN quality_new qn ON c.id = qn.car_id
        LEFT JOIN type t ON c.id = t.car_id
        LEFT JOIN saftey sf ON qn.saftey_id = sf.id
        ${whereClause}
    )
    SELECT 
        CONCAT(make, '-', model, '-', year, '-', origin) as unique_id,
        make,
        model,
        year,
        origin,
        city,
        state,
        mpg,
        horse_power,
        acceleration,
        available,
        car_condition as \`condition\`,
        fuel_type,
        vehicle_class as transmission,
        safety_rating,
        blind_spot_decision,
        collision_warning
    FROM ranked_cars
    WHERE rn = 1 -- Only get the "best" instance of each car model
    ORDER BY year DESC, make ASC, model ASC
    LIMIT ? OFFSET ?
    `;
    
    let cars: any[] = [];
    try {
      const [carsResult]: any = await connection.query(
        carsQuery, 
        [...queryParams, parseInt(limit), offset]
      );
      cars = carsResult;
      console.log(`Found ${cars.length} unique cars`);
    } catch (carsError: any) {
      console.error('Cars query failed:', carsError.message);
      throw carsError;
    }

    return NextResponse.json({
      success: true,
      cars,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error: any) {
    console.error('Error searching cars:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search cars',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}