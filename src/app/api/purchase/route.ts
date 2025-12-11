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
    const purchaseData = await request.json();
    
    const {
      car_id,
      customer_email,
      customer_name,
      total_amount
    } = purchaseData;

    //Validate required fields
    if (!car_id || !customer_email || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);
    
    //Start transaction
    await connection.beginTransaction();

    try {
      //Check if car is still available
      const checkCarQuery = 'SELECT COUNT(*) as available_count FROM quantity WHERE car_id = ? AND available = 1';
      const [carCheck]: any = await connection.execute(checkCarQuery, [car_id]);
      
      if (carCheck.length === 0 || carCheck[0].available_count === 0) {
        throw new Error('Car is no longer available');
      }

      //Get or create user ID from customer email
      //First, check if user exists
      const getUserQuery = 'SELECT id FROM users WHERE email = ?';
      const [userResult]: any = await connection.execute(getUserQuery, [customer_email]);
      
      let userId;
      
      if (userResult.length > 0) {
        //User exists
        userId = userResult[0].id;
      } else {
        //Create new user
        const createUserQuery = `
          INSERT INTO users (email, name, created_at) 
          VALUES (?, ?, NOW())
        `;
        const [createUserResult]: any = await connection.execute(createUserQuery, [
          customer_email,
          customer_name
        ]);
        userId = createUserResult.insertId;
      }

      //Create payment transaction
      const transactionQuery = `
        INSERT INTO payment_transactions (
          price,
          user_id
        ) VALUES (?, ?)
      `;
      
      const [transactionResult]: any = await connection.execute(transactionQuery, [
        total_amount,
        userId
      ]);
      
      const transactionId = transactionResult.insertId;

      //Update car availability
      //   const updateCarQuery = 'UPDATE quantity SET available = 0 WHERE car_id = ?';
      //   await connection.execute(updateCarQuery, [car_id]);

      //Commit transaction
      await connection.commit();

      return NextResponse.json({
        success: true,
        transactionId: transactionId,
        userId: userId,
        message: 'Purchase completed successfully'
      });

    } catch (transactionError: any) {
      //Rollback on error
      await connection.rollback();
      throw transactionError;
    }

  } catch (error: any) {
    console.error('Error processing purchase:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process purchase' 
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}