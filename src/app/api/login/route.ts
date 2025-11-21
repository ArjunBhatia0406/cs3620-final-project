import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/mysql";

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

    // Find user
    const [rows] = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = ?",
      [email]
    );
    const users = rows as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 400 }
      );
    }

    const user = users[0];

    // Compare password
    const isMatch = password

    if (!isMatch) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 400 }
      );
    }

    // TODO: set a session / JWT / cookie if you want real auth
    return NextResponse.json({
  ok: true,
  user: { id: user.id, email },
});

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { ok: false, message: "Internal server error." },
      { status: 500 }
    );
    
  }
  
}
