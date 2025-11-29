import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
};

function convertTo24Hour(date: string, time: string) {
  const [hoursMinutes, modifier] = time.split(" ");
  let [hours, minutes] = hoursMinutes.split(":");

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const { date, time, employeeId, serviceType, car, phoneNumber, email } = await request.json();
    const { id } = await params;
    const appointmentId = parseInt(id);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    //Verify the appointment belongs to the user
    const [userAppointment]: any = await connection.query(
      `SELECT a.id 
       FROM appointments a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ? AND u.email = ?`,
      [appointmentId, email]
    );

    if (userAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    //Update appointment
    const appointmentDateTime = convertTo24Hour(date, time);
    await connection.query(
      'UPDATE appointments SET employee_id = ?, date = ? WHERE id = ?',
      [employeeId, appointmentDateTime, appointmentId]
    );

    //Update appointment details
    await connection.query(
      `UPDATE appointment_details 
       SET service_type = ?, car = ? 
       WHERE appointment_id = ?`,
      [serviceType, car, appointmentId]
    );

    //Update contact phone number
    await connection.query(
      `UPDATE contacts 
       SET phone_number = ? 
       WHERE id = (SELECT contact_id FROM appointment_details WHERE appointment_id = ?)`,
      [phoneNumber, appointmentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully'
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const { email } = await request.json();
    const { id } = await params;
    const appointmentId = parseInt(id);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    //Verify the appointment belongs to the user
    const [userAppointment]: any = await connection.query(
      `SELECT a.id 
       FROM appointments a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ? AND u.email = ?`,
      [appointmentId, email]
    );

    if (userAppointment.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    //Start transaction
    await connection.query('START TRANSACTION');

    //Delete appointment_details
    await connection.query(
      'DELETE FROM appointment_details WHERE appointment_id = ?',
      [appointmentId]
    );
    
    //Delete contacts
    await connection.query(
      'DELETE FROM contacts WHERE appointment_id = ?',
      [appointmentId]
    );
    
    //Delete appointments
    await connection.query(
      'DELETE FROM appointments WHERE id = ?',
      [appointmentId]
    );
    
    //Commit transaction
    await connection.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    //Rollback on error
    if (connection) {
      await connection.query('ROLLBACK');
    }
    console.error('Error deleting appointment:', error);
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