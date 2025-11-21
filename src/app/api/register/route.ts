// npm install mysql2 
import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/mysql";

// Make sure this runs on Node, not Edge (optional, but safe)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    const existing = rows as any[];

    if (existing.length > 0) {
      return NextResponse.json(
        { ok: false, message: "Email already registered." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = password

    // Insert user into DB
    await pool.query(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, passwordHash]
    );

    return NextResponse.json({ ok: true, message: "User registered." }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { ok: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
