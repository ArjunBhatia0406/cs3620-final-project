import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

//MySQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

function convertTo24Hour(date: string, time: string) {
  //"09:00 AM" -> "09", "00", "AM"
  const [hoursMinutes, modifier] = time.split(" ");
  let [hours, minutes] = hoursMinutes.split(":");

  //Convert to number
  let h = parseInt(hours, 10);

  if (modifier === "PM" && h !== 12) {
    h += 12;
  }
  if (modifier === "AM" && h === 12) {
    h = 0;
  }

  const hh = h.toString().padStart(2, "0");
  const mm = minutes.padStart(2, "0");

  return `${date} ${hh}:${mm}:00`;
}


export async function POST(request: NextRequest) {
    let connection;
    try {
        const { date, time, phoneNumber, employeeId, serviceType, car, email } = await request.json();

        //Validate required fields
        if (!date || !time || !phoneNumber || !employeeId || !serviceType || !car || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        connection = await mysql.createConnection(dbConfig);

        //Start transaction
        await connection.query('START TRANSACTION');

        let userId;

        if (email) {
            //Check if user exists
            const [userRows]: any = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (userRows.length > 0) {
                userId = userRows[0].id;
            } else {
                //Create new user
                const [insertUser]: any = await connection.execute(
                    'INSERT INTO users (email) VALUES (?)',
                    [email]
                );
                userId = insertUser.insertId;
            }

            //Create appointment
            const appointmentDateTime = convertTo24Hour(date, time);
            const [appointmentResult]: any = await connection.execute(
                'INSERT INTO appointments (user_id, employee_id, date) VALUES (?, ?, ?)',
                [userId, employeeId, appointmentDateTime]
            );
            const appointmentId = appointmentResult.insertId;

            //Create contact
            const [contactResult]: any = await connection.execute(
                'INSERT INTO contacts (phone_number, user_id, appointment_id) VALUES (?, ?, ?)',
                [phoneNumber, userId, appointmentId]
            );
            const contactId = contactResult.insertId;

            //Create appointment details
            await connection.execute(
                'INSERT INTO appointment_details (appointment_id, contact_id, car, service_type) VALUES (?, ?, ?, ?)',
                [appointmentId, contactId, car, serviceType]
            );

            //Create payment transaction
            await connection.execute(
                'INSERT INTO payment_transactions (user_id, price) VALUES (?, ?)',
                [userId, 10.00]
            );

            //Commit transaction
            await connection.query('COMMIT');

            return NextResponse.json({
                success: true,
                appointmentId,
                message: 'Appointment scheduled successfully'
            });
        } else {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

    } catch (error) {
        //Rollback transaction in case of error
        if (connection) {
            await connection.query('ROLLBACK');
        }

        console.error('Error creating appointment:', error);
        return NextResponse.json(
            { error: 'Internal server error ' + (error instanceof Error ? error.message : 'Unknown error')},
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    connection = await mysql.createConnection(dbConfig);

    //If email parameter is provided, fetch user appointments
    if (email) {
      const [appointments]: any = await connection.query(`
        SELECT 
          a.id,
          a.date,
          a.employee_id,
          ad.service_type,
          ad.car,
          c.phone_number,
          e.name as employee_name
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN appointment_details ad ON a.id = ad.appointment_id
        JOIN contacts c ON a.id = c.appointment_id
        JOIN employees e ON a.employee_id = e.id
        WHERE u.email = ?
        ORDER BY a.date DESC
      `, [email]);

      return NextResponse.json({ appointments });
    } else {
      //If no email provided, return employees list (for the dropdown)
      const [employees]: any = await connection.execute(
        'SELECT id, name FROM employees'
      );

      return NextResponse.json({ employees });
    }

  } catch (error) {
    console.error('Error in GET request:', error);
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