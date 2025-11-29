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
        if (!date || !time || !phoneNumber || !employeeId || !serviceType || !car) {
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

            //Update or create contact
            const [contactRows]: any = await connection.execute(
                'SELECT id FROM contacts WHERE user_id = ?',
                [userId]
            );

            let contactId;
            if (contactRows.length > 0) {
                contactId = contactRows[0].id;
                await connection.execute(
                    'UPDATE contacts SET phone_number = ? WHERE user_id = ?',
                    [phoneNumber, userId]
                );
            } else {
                const [contactResult]: any = await connection.execute(
                    'INSERT INTO contacts (phone_number, user_id) VALUES (?, ?)',
                    [phoneNumber, userId]
                );
                contactId = contactResult.insertId;
            }

            //Create appointment
            const appointmentDateTime = convertTo24Hour(date, time);
            const [appointmentResult]: any = await connection.execute(
                'INSERT INTO appointments (user_id, employee_id, date) VALUES (?, ?, ?)',
                [userId, employeeId, appointmentDateTime]
            );
            const appointmentId = appointmentResult.insertId;

            //Create appointment details
            await connection.execute(
                'INSERT INTO appointment_details (appointment_id, contact_id, car, service_type) VALUES (?, ?, ?, ?)',
                [appointmentId, contactId, car, serviceType]
            );

            //Create payment transaction
            await connection.execute(
                'INSERT INTO payment_transactions (user_id, price, appointment_id) VALUES (?, ?, ?)',
                [userId, 10.00, appointmentId]
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
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

export async function GET() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        //Get employees for the dropdown
        const [employees]: any = await connection.execute(
            'SELECT id, name FROM employees'
        );

        return NextResponse.json({ employees });

    } catch (error) {
        console.error('Error fetching employees:', error);
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